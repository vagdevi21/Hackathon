/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Comprehensive OTP & SMS Carrier Gateway Service
 * 
 * Features:
 * - Cryptographically secure 6-digit numeric OTP generation (crypto.randomInt)
 * - PBKDF2-HMAC-SHA256 verifier hashing with random 16-byte salt (no plaintext OTP storage)
 * - 5-minute strict expiration window & single-use invalidation
 * - Max 5 attempts per challenge with brute-force lockout
 * - 45-second resend rate-limiting cooldown
 * - Pluggable SMS Provider Adapter Pattern:
 *     1. Twilio (Global SMS REST API)
 *     2. Fast2SMS (Indian Cellular Carrier Gateway - OTP Route)
 *     3. MSG91 (Enterprise Transactional SMS Flow)
 *     4. DevConsoleFallback (Accurately reports SMS_SERVICE_NOT_CONFIGURED without false delivery claims)
 *     5. Injectable Mock Provider for automated testing
 * - Distinct Delivery States:
 *     - PREPARING_OTP
 *     - SUBMITTING_TO_SMS_PROVIDER
 *     - SMS_REQUEST_ACCEPTED
 *     - DELIVERY_CONFIRMED
 *     - DELIVERY_FAILED
 *     - SMS_SERVICE_NOT_CONFIGURED
 *     - SMS_SERVICE_UNAVAILABLE
 */

import crypto from 'node:crypto';
import { normalizeRegistrationPhone, maskPhoneForDisplay } from '../server/sms/phone-normalizer.ts';

export type SmsDeliveryState =
  | 'PREPARING_OTP'
  | 'SUBMITTING_TO_SMS_PROVIDER'
  | 'SMS_REQUEST_ACCEPTED'
  | 'DELIVERY_CONFIRMED'
  | 'DELIVERY_FAILED'
  | 'SMS_SERVICE_NOT_CONFIGURED'
  | 'SMS_SERVICE_UNAVAILABLE';

export interface ProviderDispatchResult {
  deliveryState: SmsDeliveryState;
  provider: string;
  isConfigured: boolean;
  message: string;
  externalMessageId?: string;
  rawResponse?: any;
  error?: string;
  devHint?: string;
}

export interface SmsProviderAdapter {
  name: string;
  id: 'TWILIO' | 'FAST2SMS' | 'MSG91' | 'DEV_CONSOLE' | 'MOCK';
  isConfigured(): boolean;
  sendSms(options: {
    toPhoneNumber: string;
    otpCode: string;
    message: string;
    purpose?: string;
  }): Promise<ProviderDispatchResult>;
}

// ============================================================================
// 1. TWILIO ADAPTER
// ============================================================================
export class TwilioAdapter implements SmsProviderAdapter {
  name = 'Twilio SMS Gateway';
  id = 'TWILIO' as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
    );
  }

  async sendSms(options: {
    toPhoneNumber: string;
    otpCode: string;
    message: string;
  }): Promise<ProviderDispatchResult> {
    if (!this.isConfigured()) {
      return {
        deliveryState: 'SMS_SERVICE_NOT_CONFIGURED',
        provider: this.name,
        isConfigured: false,
        message: 'Twilio credentials not configured in environment (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).',
      };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', options.toPhoneNumber);
    params.append('Body', options.message);

    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else if (fromPhone) {
      params.append('From', fromPhone);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          deliveryState: 'DELIVERY_FAILED',
          provider: this.name,
          isConfigured: true,
          message: data.message || `Twilio dispatch failed with HTTP ${response.status}`,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      // Check Twilio delivery status
      const twilioStatus = data.status; // 'queued', 'sent', 'delivered', 'failed', 'undelivered'
      const deliveryState: SmsDeliveryState = 
        twilioStatus === 'delivered' ? 'DELIVERY_CONFIRMED' : 'SMS_REQUEST_ACCEPTED';

      return {
        deliveryState,
        provider: this.name,
        isConfigured: true,
        message: `SMS request accepted by Twilio mobile carrier gateway (Status: ${twilioStatus || 'queued'}). Handset delivery in transit.`,
        externalMessageId: data.sid,
        rawResponse: { sid: data.sid, status: data.status },
      };
    } catch (err: any) {
      return {
        deliveryState: 'SMS_SERVICE_UNAVAILABLE',
        provider: this.name,
        isConfigured: true,
        message: err.message || 'Twilio network communication timeout.',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 2. FAST2SMS ADAPTER (Primary Indian Cellular Carrier Gateway)
// ============================================================================
export class Fast2SmsAdapter implements SmsProviderAdapter {
  name = 'Fast2SMS India Gateway';
  id = 'FAST2SMS' as const;

  isConfigured(): boolean {
    return Boolean(process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim());
  }

  async sendSms(options: {
    toPhoneNumber: string;
    otpCode: string;
    message: string;
  }): Promise<ProviderDispatchResult> {
    if (!this.isConfigured()) {
      return {
        deliveryState: 'SMS_SERVICE_NOT_CONFIGURED',
        provider: this.name,
        isConfigured: false,
        message: 'Fast2SMS API key not configured in environment (FAST2SMS_API_KEY).',
      };
    }

    const apiKey = process.env.FAST2SMS_API_KEY!;
    // Fast2SMS requires 10-digit Indian numbers without +91
    let nationalNumber = options.toPhoneNumber.replace(/\D/g, '');
    if (nationalNumber.startsWith('91') && nationalNumber.length === 12) {
      nationalNumber = nationalNumber.slice(2);
    }

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: options.otpCode,
          numbers: nationalNumber,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.return === false) {
        const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Fast2SMS rejected request');
        return {
          deliveryState: 'DELIVERY_FAILED',
          provider: this.name,
          isConfigured: true,
          message: `Fast2SMS India dispatch failed: ${errMsg}`,
          error: errMsg,
        };
      }

      return {
        deliveryState: 'SMS_REQUEST_ACCEPTED',
        provider: this.name,
        isConfigured: true,
        message: `SMS OTP accepted by Indian cellular carrier via Fast2SMS (Request ID: ${data.request_id || 'N/A'}). Handset delivery in transit.`,
        externalMessageId: data.request_id,
        rawResponse: { request_id: data.request_id, return: data.return },
      };
    } catch (err: any) {
      return {
        deliveryState: 'SMS_SERVICE_UNAVAILABLE',
        provider: this.name,
        isConfigured: true,
        message: err.message || 'Fast2SMS carrier network communication failure.',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 3. MSG91 ADAPTER
// ============================================================================
export class Msg91Adapter implements SmsProviderAdapter {
  name = 'MSG91 Enterprise Gateway';
  id = 'MSG91' as const;

  isConfigured(): boolean {
    return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_FLOW_ID);
  }

  async sendSms(options: {
    toPhoneNumber: string;
    otpCode: string;
  }): Promise<ProviderDispatchResult> {
    if (!this.isConfigured()) {
      return {
        deliveryState: 'SMS_SERVICE_NOT_CONFIGURED',
        provider: this.name,
        isConfigured: false,
        message: 'MSG91 credentials not configured in environment (MSG91_AUTH_KEY / MSG91_FLOW_ID).',
      };
    }

    const authKey = process.env.MSG91_AUTH_KEY!;
    const flowId = process.env.MSG91_FLOW_ID!;
    const rawNumber = options.toPhoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: flowId,
          short_url: '0',
          recipients: [{ mobiles: rawNumber, otp: options.otpCode }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.type === 'error') {
        return {
          deliveryState: 'DELIVERY_FAILED',
          provider: this.name,
          isConfigured: true,
          message: data.message || 'MSG91 flow request rejected.',
          error: data.message,
        };
      }

      return {
        deliveryState: 'SMS_REQUEST_ACCEPTED',
        provider: this.name,
        isConfigured: true,
        message: 'SMS OTP accepted by MSG91 carrier router. Handset delivery in transit.',
        externalMessageId: data.request_id,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        deliveryState: 'SMS_SERVICE_UNAVAILABLE',
        provider: this.name,
        isConfigured: true,
        message: err.message || 'MSG91 network timeout.',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 4. DEVELOPMENT & TESTING FALLBACK ADAPTER
// ============================================================================
export class DevConsoleAdapter implements SmsProviderAdapter {
  name = 'Development Console SMS Adapter';
  id = 'DEV_CONSOLE' as const;

  isConfigured(): boolean {
    // DevConsole is NOT an external cellular SMS provider; returns false to prevent false delivery claims
    return false;
  }

  async sendSms(options: {
    toPhoneNumber: string;
    otpCode: string;
  }): Promise<ProviderDispatchResult> {
    const isDev = process.env.NODE_ENV !== 'production';
    const logNotice = `[DarkWatch SMS Engine] Mobile: ${options.toPhoneNumber} | Code: [${options.otpCode}] | Expiry: 5 min`;
    console.log('\x1b[36m%s\x1b[0m', logNotice);

    return {
      deliveryState: 'SMS_SERVICE_NOT_CONFIGURED',
      provider: this.name,
      isConfigured: false,
      message: 'No live SMS gateway configured (TWILIO_*, FAST2SMS_*, MSG91_*). Cellular SMS cannot be delivered to physical handset.',
      devHint: isDev ? logNotice : undefined,
    };
  }
}

// ============================================================================
// OTP CHALLENGE INTERFACE & VERIFIER
// ============================================================================
export interface OtpChallenge {
  challengeId: string;
  phoneNumber: string; // E.164
  username?: string;
  verifierHash: string; // PBKDF2 hash of 6-digit code
  salt: string;
  purpose: string;
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  deliveryState: SmsDeliveryState;
  providerName: string;
  externalMessageId?: string;
}

export interface SendOtpResult {
  success: boolean;
  challengeId: string;
  deliveryState: SmsDeliveryState;
  provider: string;
  isConfigured: boolean;
  message: string;
  phoneNumber: string;
  maskedMobile: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
  devHint?: string;
  devOtpCode?: string; // only in non-production when provider is unconfigured
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  challengeId?: string;
  attemptsRemaining?: number;
  isMaxAttemptsExceeded?: boolean;
}

// Helper: Hash OTP using PBKDF2 with SHA-256
export function hashOtpCode(otp: string, salt: string): string {
  return crypto.pbkdf2Sync(otp, salt, 10000, 32, 'sha256').toString('hex');
}

// Helper: Secure Timing-Safe Hash Verification
export function verifyOtpCode(otp: string, verifierHash: string, salt: string): boolean {
  try {
    const computed = hashOtpCode(otp, salt);
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(verifierHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN OTP SERVICE CLASS
// ============================================================================
export class OtpService {
  private challenges: Map<string, OtpChallenge> = new Map(); // Keyed by challengeId
  private phoneIndex: Map<string, string> = new Map(); // Keyed by E.164 phone -> challengeId
  private customAdapter: SmsProviderAdapter | null = null;

  private twilioAdapter = new TwilioAdapter();
  private fast2smsAdapter = new Fast2SmsAdapter();
  private msg91Adapter = new Msg91Adapter();
  private devConsoleAdapter = new DevConsoleAdapter();

  /**
   * Inject a custom or mock SMS provider adapter (e.g. during automated unit tests)
   */
  public setCustomAdapter(adapter: SmsProviderAdapter | null): void {
    this.customAdapter = adapter;
  }

  /**
   * Resolves the active SMS Provider based on environment configuration
   */
  public getActiveAdapter(): SmsProviderAdapter {
    if (this.customAdapter) {
      return this.customAdapter;
    }

    const preferred = (process.env.SMS_PROVIDER || '').toUpperCase();

    if (preferred === 'TWILIO' && this.twilioAdapter.isConfigured()) {
      return this.twilioAdapter;
    }
    if (preferred === 'FAST2SMS' && this.fast2smsAdapter.isConfigured()) {
      return this.fast2smsAdapter;
    }
    if (preferred === 'MSG91' && this.msg91Adapter.isConfigured()) {
      return this.msg91Adapter;
    }

    // Auto-detect based on configured credentials
    if (this.fast2smsAdapter.isConfigured()) return this.fast2smsAdapter;
    if (this.twilioAdapter.isConfigured()) return this.twilioAdapter;
    if (this.msg91Adapter.isConfigured()) return this.msg91Adapter;

    // Fallback to Dev Console Adapter
    return this.devConsoleAdapter;
  }

  /**
   * Diagnostic info regarding SMS Provider configuration
   */
  public getProviderStatus(): {
    configured: boolean;
    activeProvider: string;
    supportedProviders: string[];
    missingConfig: string[];
  } {
    const active = this.getActiveAdapter();
    const missing: string[] = [];

    if (!process.env.FAST2SMS_API_KEY && !process.env.TWILIO_ACCOUNT_SID && !process.env.MSG91_AUTH_KEY) {
      missing.push('No SMS credentials found. Set FAST2SMS_API_KEY or TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN in .env.');
    }

    return {
      configured: active.isConfigured(),
      activeProvider: active.name,
      supportedProviders: ['Twilio SMS Gateway', 'Fast2SMS India Gateway', 'MSG91 Enterprise Gateway'],
      missingConfig: missing,
    };
  }

  /**
   * Creates, hashes, and dispatches a 6-digit numeric OTP challenge
   */
  public async createAndSendChallenge(options: {
    phoneNumber: string;
    purpose?: string;
    username?: string;
    defaultCountryCode?: string;
  }): Promise<SendOtpResult> {
    const norm = normalizeRegistrationPhone(options.phoneNumber, options.defaultCountryCode || '+91');
    if (!norm.valid || !norm.e164) {
      throw new Error(norm.error || 'Invalid phone number format.');
    }

    const phoneE164 = norm.e164;
    const purpose = options.purpose || 'REGISTRATION';
    const maskedMobile = maskPhoneForDisplay(phoneE164);

    // Invalidate existing active challenge for this phone number if one exists
    const existingId = this.phoneIndex.get(phoneE164);
    if (existingId) {
      const existing = this.challenges.get(existingId);
      if (existing && !existing.isUsed && Date.now() < existing.expiresAt) {
        // Enforce 45s resend cooldown
        const elapsed = Date.now() - existing.lastSentAt;
        if (elapsed < 45000) {
          const waitSec = Math.ceil((45000 - elapsed) / 1000);
          return {
            success: false,
            challengeId: existing.challengeId,
            deliveryState: existing.deliveryState,
            provider: existing.providerName,
            isConfigured: this.getActiveAdapter().isConfigured(),
            message: `Rate limit active. Please wait ${waitSec}s before requesting a new verification code.`,
            phoneNumber: phoneE164,
            maskedMobile,
            cooldownSeconds: waitSec,
            expiresInSeconds: Math.max(0, Math.ceil((existing.expiresAt - Date.now()) / 1000)),
          };
        }
        // Invalidate prior challenge before issuing new one
        existing.isUsed = true;
      }
    }

    // Cryptographically secure 6-digit OTP code (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const verifierHash = hashOtpCode(code, salt);

    const challengeId = `CHAL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    const adapter = this.getActiveAdapter();
    const smsMessage = `Your DarkWatch AI security verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;

    // Dispatch via SMS Provider
    const dispatchResult = await adapter.sendSms({
      toPhoneNumber: phoneE164,
      otpCode: code,
      message: smsMessage,
      purpose,
    });

    const challenge: OtpChallenge = {
      challengeId,
      phoneNumber: phoneE164,
      username: options.username,
      verifierHash,
      salt,
      purpose,
      createdAt: now,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
      deliveryState: dispatchResult.deliveryState,
      providerName: adapter.name,
      externalMessageId: dispatchResult.externalMessageId,
    };

    this.challenges.set(challengeId, challenge);
    this.phoneIndex.set(phoneE164, challengeId);

    const isDev = process.env.NODE_ENV !== 'production';

    // Construct honest, unambiguous response message
    let responseMessage: string;
    if (dispatchResult.deliveryState === 'SMS_REQUEST_ACCEPTED') {
      responseMessage = `Verification code accepted by SMS carrier (${adapter.name}) for dispatch to ${maskedMobile}. Handset delivery in transit.`;
    } else if (dispatchResult.deliveryState === 'DELIVERY_CONFIRMED') {
      responseMessage = `Verification code confirmed delivered to ${maskedMobile}.`;
    } else if (dispatchResult.deliveryState === 'SMS_SERVICE_NOT_CONFIGURED') {
      responseMessage = isDev
        ? `[Dev Mode - SMS Unconfigured] Verification code generated for ${maskedMobile}. Cellular delivery requires SMS gateway credentials in .env.`
        : `SMS verification service is temporarily unavailable. Live cellular gateway credentials are unconfigured.`;
    } else {
      responseMessage = `SMS dispatch failed via ${adapter.name}: ${dispatchResult.message}. Please retry or verify mobile number.`;
    }

    return {
      success: dispatchResult.deliveryState === 'SMS_REQUEST_ACCEPTED' || dispatchResult.deliveryState === 'DELIVERY_CONFIRMED' || (isDev && dispatchResult.deliveryState === 'SMS_SERVICE_NOT_CONFIGURED'),
      challengeId,
      deliveryState: dispatchResult.deliveryState,
      provider: adapter.name,
      isConfigured: adapter.isConfigured(),
      message: responseMessage,
      phoneNumber: phoneE164,
      maskedMobile,
      cooldownSeconds: 45,
      expiresInSeconds: 300,
      devHint: isDev ? dispatchResult.devHint : undefined,
      devOtpCode: isDev && !adapter.isConfigured() ? code : undefined,
    };
  }

  /**
   * Verifies an OTP code against the active challenge
   */
  public verifyChallenge(options: {
    phoneNumber: string;
    otpCode: string;
    purpose?: string;
  }): VerifyOtpResult {
    const norm = normalizeRegistrationPhone(options.phoneNumber, '+91');
    const phoneE164 = norm.valid && norm.e164 ? norm.e164 : options.phoneNumber.trim();

    const challengeId = this.phoneIndex.get(phoneE164);
    if (!challengeId) {
      return {
        success: false,
        message: 'No active verification session found. Please submit your registration details to request an OTP.',
      };
    }

    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.isUsed) {
      return {
        success: false,
        message: 'This verification challenge is no longer valid or has already been used. Please request a new code.',
      };
    }

    const now = Date.now();
    if (now > challenge.expiresAt) {
      challenge.isUsed = true;
      return {
        success: false,
        message: 'The 6-digit verification code has expired (5-minute validity window). Please request a fresh OTP.',
      };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.isUsed = true;
      return {
        success: false,
        message: 'Maximum verification attempts (5) exceeded. Challenge locked for security. Please request a fresh code.',
        isMaxAttemptsExceeded: true,
      };
    }

    challenge.attempts += 1;
    const isValid = verifyOtpCode(options.otpCode.trim(), challenge.verifierHash, challenge.salt);

    if (!isValid) {
      const remaining = challenge.maxAttempts - challenge.attempts;
      if (remaining <= 0) {
        challenge.isUsed = true;
        return {
          success: false,
          message: 'Maximum verification attempts (5) exceeded. Challenge invalidated for security.',
          attemptsRemaining: 0,
          isMaxAttemptsExceeded: true,
        };
      }
      return {
        success: false,
        message: `Incorrect verification code (${challenge.attempts}/5 attempts). ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        attemptsRemaining: remaining,
      };
    }

    // Success! Consume challenge single-use
    challenge.isUsed = true;
    challenge.deliveryState = 'DELIVERY_CONFIRMED';

    return {
      success: true,
      challengeId: challenge.challengeId,
      message: 'Mobile OTP successfully verified with cryptographic zero-trust signature.',
    };
  }

  /**
   * Resends an OTP for an active challenge, enforcing 45s cooldown
   */
  public async resendChallenge(phoneNumber: string): Promise<SendOtpResult> {
    const norm = normalizeRegistrationPhone(phoneNumber, '+91');
    const phoneE164 = norm.valid && norm.e164 ? norm.e164 : phoneNumber.trim();

    const challengeId = this.phoneIndex.get(phoneE164);
    let username: string | undefined;
    let purpose = 'REGISTRATION';

    if (challengeId) {
      const existing = this.challenges.get(challengeId);
      if (existing) {
        username = existing.username;
        purpose = existing.purpose;
      }
    }

    return this.createAndSendChallenge({
      phoneNumber: phoneE164,
      purpose,
      username,
    });
  }

  /**
   * Invalidates challenges for a phone number (e.g. when user edits details)
   */
  public invalidateChallenge(phoneNumber: string): void {
    const norm = normalizeRegistrationPhone(phoneNumber, '+91');
    const phoneE164 = norm.valid && norm.e164 ? norm.e164 : phoneNumber.trim();

    const challengeId = this.phoneIndex.get(phoneE164);
    if (challengeId) {
      const challenge = this.challenges.get(challengeId);
      if (challenge) {
        challenge.isUsed = true;
      }
      this.phoneIndex.delete(phoneE164);
    }
  }

  /**
   * Retrieves challenge status for monitoring
   */
  public getChallenge(challengeIdOrPhone: string): OtpChallenge | undefined {
    let challenge = this.challenges.get(challengeIdOrPhone);
    if (!challenge) {
      const id = this.phoneIndex.get(challengeIdOrPhone);
      if (id) {
        challenge = this.challenges.get(id);
      }
    }
    return challenge;
  }
}

// Global Singleton Export
export const otpService = new OtpService();
