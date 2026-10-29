/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Modular SMS Provider Adapter
 * Integrates with enterprise SMS gateways:
 * - Twilio (Global SMS API)
 * - Fast2SMS (Indian carrier SMS gateway)
 * - MSG91 (Transactional OTP flow)
 * - Custom / Test Mock Providers
 * - Safe Development / Test fallback (transparently flags unconfigured state)
 */

export interface SmsDispatchOptions {
  toPhoneNumber: string; // E.164 format e.g. +919876543210
  otpCode: string; // 6-digit numeric OTP
  purpose?: string;
  senderName?: string;
}

export interface SmsDispatchResult {
  status: 'ACCEPTED_BY_PROVIDER' | 'UNCONFIGURED' | 'FAILED';
  channel: 'SMS';
  provider: string;
  message: string;
  externalMessageId?: string;
  devHint?: string;
  error?: string;
}

export interface SmsProviderInterface {
  name: string;
  isConfigured: () => boolean;
  sendOtp: (options: SmsDispatchOptions) => Promise<SmsDispatchResult>;
}

// ============================================================================
// 1. TWILIO ADAPTER
// ============================================================================
export class TwilioSmsProvider implements SmsProviderInterface {
  name = 'Twilio SMS Gateway';

  isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
    );
  }

  async sendOtp(options: SmsDispatchOptions): Promise<SmsDispatchResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    const bodyText = `Your DarkWatch AI security verification code is: ${options.otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', options.toPhoneNumber);
    params.append('Body', bodyText);
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

      const data = await response.json();
      if (!response.ok) {
        return {
          status: 'FAILED',
          channel: 'SMS',
          provider: this.name,
          message: data.message || `Twilio dispatch failed with HTTP ${response.status}`,
          error: data.message,
        };
      }

      return {
        status: 'ACCEPTED_BY_PROVIDER',
        channel: 'SMS',
        provider: this.name,
        message: 'SMS OTP accepted by Twilio mobile carrier gateway.',
        externalMessageId: data.sid,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        channel: 'SMS',
        provider: this.name,
        message: err.message || 'Twilio network communication failed',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 2. FAST2SMS ADAPTER (Widely utilized for Indian Mobile Numbers)
// ============================================================================
export class Fast2SmsProvider implements SmsProviderInterface {
  name = 'Fast2SMS India Gateway';

  isConfigured(): boolean {
    return Boolean(process.env.FAST2SMS_API_KEY);
  }

  async sendOtp(options: SmsDispatchOptions): Promise<SmsDispatchResult> {
    const apiKey = process.env.FAST2SMS_API_KEY!;
    // Fast2SMS requires 10-digit Indian numbers without +91 or with 91
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

      const data = await response.json();
      if (!response.ok || data.return === false) {
        return {
          status: 'FAILED',
          channel: 'SMS',
          provider: this.name,
          message: data.message?.[0] || data.message || `Fast2SMS returned error`,
          error: String(data.message),
        };
      }

      return {
        status: 'ACCEPTED_BY_PROVIDER',
        channel: 'SMS',
        provider: this.name,
        message: 'SMS OTP submitted to Indian cellular carrier via Fast2SMS.',
        externalMessageId: data.request_id,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        channel: 'SMS',
        provider: this.name,
        message: err.message || 'Fast2SMS network dispatch failed',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 3. MSG91 ADAPTER
// ============================================================================
export class Msg91Provider implements SmsProviderInterface {
  name = 'MSG91 Enterprise Gateway';

  isConfigured(): boolean {
    return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_FLOW_ID);
  }

  async sendOtp(options: SmsDispatchOptions): Promise<SmsDispatchResult> {
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
          recipients: [
            {
              mobiles: rawNumber,
              otp: options.otpCode,
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok || data.type === 'error') {
        return {
          status: 'FAILED',
          channel: 'SMS',
          provider: this.name,
          message: data.message || 'MSG91 flow request rejected',
          error: data.message,
        };
      }

      return {
        status: 'ACCEPTED_BY_PROVIDER',
        channel: 'SMS',
        provider: this.name,
        message: 'SMS OTP accepted by MSG91 carrier router.',
        externalMessageId: data.request_id,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        channel: 'SMS',
        provider: this.name,
        message: err.message || 'MSG91 network dispatch failed',
        error: err.message,
      };
    }
  }
}

// ============================================================================
// 4. DEVELOPMENT & TESTING FALLBACK PROVIDER
// ============================================================================
export class DevConsoleSmsProvider implements SmsProviderInterface {
  name = 'Development Console SMS Adapter';

  isConfigured(): boolean {
    return true;
  }

  async sendOtp(options: SmsDispatchOptions): Promise<SmsDispatchResult> {
    const logNotice = `[DarkWatch SMS Dispatch] Mobile: ${options.toPhoneNumber} | OTP: [${options.otpCode}] | Valid: 5 min`;
    console.log('\x1b[36m%s\x1b[0m', logNotice);

    return {
      status: 'UNCONFIGURED',
      channel: 'SMS',
      provider: 'DEV_CONSOLE',
      message: 'SMS provider unconfigured in environment: OTP logged to secure server console for development.',
      devHint: logNotice,
    };
  }
}

// ============================================================================
// COMPOSITE SMS DISPATCH SERVICE
// ============================================================================
export class SmsService {
  private activeProvider: SmsProviderInterface | null = null;
  private mockProvider: SmsProviderInterface | null = null;

  constructor() {
    this.detectProvider();
  }

  public detectProvider() {
    const forced = process.env.SMS_PROVIDER?.toUpperCase();
    if (forced === 'TWILIO') {
      this.activeProvider = new TwilioSmsProvider();
    } else if (forced === 'FAST2SMS') {
      this.activeProvider = new Fast2SmsProvider();
    } else if (forced === 'MSG91') {
      this.activeProvider = new Msg91Provider();
    } else {
      // Auto-detect based on configured credentials
      const twilio = new TwilioSmsProvider();
      if (twilio.isConfigured()) {
        this.activeProvider = twilio;
        return;
      }
      const fast2sms = new Fast2SmsProvider();
      if (fast2sms.isConfigured()) {
        this.activeProvider = fast2sms;
        return;
      }
      const msg91 = new Msg91Provider();
      if (msg91.isConfigured()) {
        this.activeProvider = msg91;
        return;
      }
      // Fallback
      this.activeProvider = new DevConsoleSmsProvider();
    }
  }

  public setMockProvider(mock: SmsProviderInterface | null) {
    this.mockProvider = mock;
  }

  public getActiveProviderName(): string {
    if (this.mockProvider) return this.mockProvider.name;
    return this.activeProvider?.name || 'DevConsoleSmsProvider';
  }

  public isConfigured(): boolean {
    if (this.mockProvider) return this.mockProvider.isConfigured();
    return this.activeProvider ? this.activeProvider.isConfigured() : false;
  }

  async sendOtp(options: SmsDispatchOptions): Promise<SmsDispatchResult> {
    if (this.mockProvider) {
      return this.mockProvider.sendOtp(options);
    }
    if (!this.activeProvider) {
      this.detectProvider();
    }
    return this.activeProvider!.sendOtp(options);
  }
}

export const smsService = new SmsService();
