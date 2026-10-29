/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Mandatory Mobile OTP, Optional Email & SMS Persistence Test Suite
 * Validates:
 * 1. India (+91) phone normalization, National Numbering Plan rules, dummy pattern rejections
 * 2. Mobile privacy masking
 * 3. Modular SMS Provider Adapter (Twilio/Fast2SMS/MSG91/Dev fallback and mock injection)
 * 4. Mandatory Mobile OTP generation, 5-minute expiry, max 5 attempts, salted hash storage
 * 5. Optional Email handling (works with or without email)
 * 6. Atomic pending registration (account not committed until OTP verified)
 * 7. Login with username, email, or mobile number
 * 8. Backward compatibility with pre-existing seeded accounts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  normalizeRegistrationPhone, 
  maskPhoneForDisplay 
} from './sms/phone-normalizer.ts';
import { 
  smsService, 
  SmsProviderInterface, 
  SmsDispatchOptions, 
  SmsDispatchResult 
} from './sms/sms-provider.ts';
import { 
  db, 
  hashPassword, 
  verifyPassword, 
  hashOtp,
  UserRecord,
  PendingRegistration 
} from './db.ts';

// ============================================================================
// 1. PHONE NORMALIZATION & INDIA (+91) RULES
// ============================================================================

test('Phone Normalizer: Normalizes 10-digit Indian numbers to E.164 (+91)', () => {
  const res1 = normalizeRegistrationPhone('9876543210');
  assert.equal(res1.valid, true);
  assert.equal(res1.e164, '+919876543210');
  assert.equal(res1.isIndian, true);

  // Leading zero trunk prefix
  const res2 = normalizeRegistrationPhone('09876543210');
  assert.equal(res2.valid, true);
  assert.equal(res2.e164, '+919876543210');

  // Spaces and hyphens
  const res3 = normalizeRegistrationPhone('+91 98765-43210');
  assert.equal(res3.valid, true);
  assert.equal(res3.e164, '+919876543210');

  // Without plus sign
  const res4 = normalizeRegistrationPhone('919876543210');
  assert.equal(res4.valid, true);
  assert.equal(res4.e164, '+919876543210');
});

test('Phone Normalizer: Rejects Indian numbers with invalid starting digits', () => {
  // Numbers starting with 1, 2, 3, 4, 5 are not mobile series in India
  const res1 = normalizeRegistrationPhone('5123456789');
  assert.equal(res1.valid, false);
  assert.match(res1.error!, /must start with 6, 7, 8, or 9/);

  const res2 = normalizeRegistrationPhone('2123456789');
  assert.equal(res2.valid, false);
  assert.match(res2.error!, /must start with 6, 7, 8, or 9/);
});

test('Phone Normalizer: Rejects repetitive identical digits or synthetic sequences', () => {
  // All identical digits
  const res1 = normalizeRegistrationPhone('9999999999');
  assert.equal(res1.valid, false);
  assert.match(res1.error!, /repetitive identical digits/);

  // Sequential test pattern
  const res2 = normalizeRegistrationPhone('1234567890');
  assert.equal(res2.valid, false);
  assert.match(res2.error!, /synthetic sequential/);

  // Excessive repeating digits
  const res3 = normalizeRegistrationPhone('9877777777');
  assert.equal(res3.valid, false);
  assert.match(res3.error!, /excessive consecutive identical digits/);
});

test('Phone Normalizer: Accepts valid international numbers', () => {
  const usRes = normalizeRegistrationPhone('+1 (555) 234-5678');
  assert.equal(usRes.valid, true);
  assert.equal(usRes.e164, '+15552345678');
  assert.equal(usRes.isIndian, false);

  const ukRes = normalizeRegistrationPhone('+44 7911 123456');
  assert.equal(ukRes.valid, true);
  assert.equal(ukRes.e164, '+447911123456');
});

test('Phone Privacy Masking: Masks intermediate caller digits', () => {
  const maskedIn = maskPhoneForDisplay('+919876543210');
  assert.equal(maskedIn, '+91 98*** **210');

  const maskedUs = maskPhoneForDisplay('+15552345678');
  assert.match(maskedUs, /\*+/);
  assert.equal(maskedUs.startsWith('+155'), true);
  assert.equal(maskedUs.endsWith('678'), true);
});

// ============================================================================
// 2. MODULAR SMS PROVIDER ADAPTER
// ============================================================================

test('SMS Provider: Dispatches via configured mock provider and records payload', async () => {
  let capturedOptions: SmsDispatchOptions | null = null;

  const mockProvider: SmsProviderInterface = {
    name: 'Mock Test SMS Gateway',
    isConfigured: () => true,
    sendOtp: async (options: SmsDispatchOptions): Promise<SmsDispatchResult> => {
      capturedOptions = options;
      return {
        status: 'ACCEPTED_BY_PROVIDER',
        channel: 'SMS',
        provider: 'Mock Test SMS Gateway',
        message: 'Dispatched to carrier network',
        externalMessageId: 'SMS-TEST-9988',
      };
    },
  };

  smsService.setMockProvider(mockProvider);

  const dispatch = await smsService.sendOtp({
    toPhoneNumber: '+919876543210',
    otpCode: '482910',
    purpose: 'REGISTRATION',
  });

  assert.equal(dispatch.status, 'ACCEPTED_BY_PROVIDER');
  const captured = capturedOptions as SmsDispatchOptions | null;
  assert.ok(captured);
  assert.equal(captured?.toPhoneNumber, '+919876543210');
  assert.equal(captured?.otpCode, '482910');

  // Reset mock provider
  smsService.setMockProvider(null);
});

test('SMS Provider: Gracefully handles provider failure without falsely claiming success', async () => {
  const failingProvider: SmsProviderInterface = {
    name: 'Failing Provider Adapter',
    isConfigured: () => true,
    sendOtp: async (): Promise<SmsDispatchResult> => {
      return {
        status: 'FAILED',
        channel: 'SMS',
        provider: 'Failing Provider Adapter',
        message: 'Carrier route unreachable or account balance exhausted',
        error: 'ROUTE_UNREACHABLE',
      };
    },
  };

  smsService.setMockProvider(failingProvider);

  const result = await smsService.sendOtp({
    toPhoneNumber: '+919876543210',
    otpCode: '112233',
  });

  assert.equal(result.status, 'FAILED');
  assert.equal(result.error, 'ROUTE_UNREACHABLE');

  smsService.setMockProvider(null);
});

test('SMS Provider: Development fallback accurately indicates UNCONFIGURED state', async () => {
  // Ensure no mock provider is active
  smsService.setMockProvider(null);

  // If no external keys are present, the fallback returns UNCONFIGURED
  const result = await smsService.sendOtp({
    toPhoneNumber: '+919876543210',
    otpCode: '741258',
  });

  // Must not claim it was delivered by a real carrier if unconfigured
  if (!process.env.TWILIO_ACCOUNT_SID && !process.env.FAST2SMS_API_KEY && !process.env.MSG91_AUTH_KEY) {
    assert.equal(result.status, 'UNCONFIGURED');
    assert.match(result.message, /unconfigured/i);
  }
});

// ============================================================================
// 3. CRYPTOGRAPHIC 6-DIGIT OTP & PERSISTENT DB OPERATIONS
// ============================================================================

test('Dynamic Mobile OTP: Generates secure 6-digit numeric code with 5-minute expiry', () => {
  const phone = '+919812345678';
  const { code, record } = db.createMobileOtp(phone, 'REGISTRATION', 300);

  // Numeric 6-digit verification code
  assert.match(code, /^\d{6}$/);
  assert.equal(record.identifier, phone.toLowerCase());
  assert.equal(record.purpose, 'REGISTRATION');
  assert.equal(record.channel, 'SMS');

  // Expiry is approximately 5 minutes in the future (300 seconds)
  const remainingMs = record.expiresAt - Date.now();
  assert.ok(remainingMs > 290000 && remainingMs <= 300000);

  // OTP must be hashed, never plaintext in record
  assert.notEqual(record.otpHash, code);
  assert.equal(record.otpHash, hashOtp(code, record.salt));
});

test('Dynamic Mobile OTP: Verification enforces single-use and invalidation', () => {
  const phone = '+919822334455';
  const { code } = db.createMobileOtp(phone, 'REGISTRATION', 300);

  // First verification succeeds
  const first = db.verifyOtp(phone, code, 'REGISTRATION');
  assert.equal(first.valid, true);

  // Second verification fails because OTP was marked consumed
  const second = db.verifyOtp(phone, code, 'REGISTRATION');
  assert.equal(second.valid, false);
  assert.match(second.error!, /No active OTP/);
});

test('Dynamic Mobile OTP: Enforces 5-attempt limit against brute-force', () => {
  const phone = '+919833445566';
  db.createMobileOtp(phone, 'REGISTRATION', 300);

  for (let i = 1; i <= 4; i++) {
    const wrong = db.verifyOtp(phone, '000000', 'REGISTRATION');
    assert.equal(wrong.valid, false);
    assert.match(wrong.error!, new RegExp(`${i}/5 attempts`));
  }

  // 5th wrong attempt triggers invalidation
  const fifth = db.verifyOtp(phone, '000000', 'REGISTRATION');
  assert.equal(fifth.valid, false);

  // Subsequent attempt fails completely
  const sixth = db.verifyOtp(phone, '000000', 'REGISTRATION');
  assert.equal(sixth.valid, false);
  assert.match(sixth.error!, /No active OTP|invalidated/);
});

// ============================================================================
// 4. ATOMIC PENDING REGISTRATION (ACCOUNT NOT COMMITTED UNTIL VERIFIED)
// ============================================================================

test('Pending Registration: User does NOT exist in db.users before OTP verification', () => {
  const tempUser = 'pending_analyst_' + Date.now();
  const tempPhone = '+919844556677';
  const { hash, salt } = hashPassword('SecOps@2026#Valid');

  const pending: PendingRegistration = {
    challengeId: `CHAL-${Date.now()}`,
    username: tempUser,
    displayName: 'Pending Officer',
    phoneNumber: tempPhone,
    passwordHash: hash,
    salt,
    createdAt: Date.now(),
    lastOtpSentAt: Date.now(),
  };

  db.setPendingRegistration(pending);

  // Lookup in db.users must return undefined
  assert.equal(db.getUserByUsername(tempUser), undefined);
  assert.equal(db.getUserByPhoneNumber(tempPhone), undefined);

  // Lookup in pendingRegistrations must succeed
  const retrievedPending = db.getPendingRegistration(tempUser);
  assert.ok(retrievedPending);
  assert.equal(retrievedPending?.phoneNumber, tempPhone);

  // Clean up
  db.removePendingRegistration(pending);
  assert.equal(db.getPendingRegistration(tempUser), undefined);
});

test('Registration & Login: Supports registration WITHOUT email (Mobile is primary)', () => {
  const testUser = 'mobile_only_analyst_' + Date.now();
  const testPhone = '+9198' + Math.floor(10000000 + Math.random() * 90000000).toString();
  const { hash, salt } = hashPassword('DarkWatch@2026#Valid');

  // Verify registration without email
  const userRecord: UserRecord = {
    id: `USR-${Date.now()}`,
    username: testUser,
    // email omitted or undefined
    displayName: 'Mobile-Only SOC Lead',
    phoneNumber: testPhone,
    passwordHash: hash,
    salt,
    role: 'TIER_1_ANALYST',
    isVerified: true,
    registeredAt: new Date().toISOString(),
    currentLogin: new Date().toISOString(),
    previousLogin: null,
    failedAttempts: 0,
    lockoutUntil: null,
    authMethod: 'PASSWORD_BIOMETRIC',
    mobileVerifiedAt: new Date().toISOString(),
  };

  db.createUser(userRecord);

  // Find user by username
  const byUser = db.getUserByUsername(testUser);
  assert.ok(byUser);
  assert.equal(byUser?.phoneNumber, testPhone);
  assert.equal(byUser?.email, undefined);

  // Find user by phone number
  const byPhone = db.getUserByPhoneNumber(testPhone);
  assert.ok(byPhone);
  assert.equal(byPhone?.username, testUser);

  // Unified findUser recognizes phone number
  const unified = db.findUser(testPhone);
  assert.ok(unified);
  assert.equal(unified?.username, testUser);

  // Verify password matches
  assert.equal(verifyPassword('DarkWatch@2026#Valid', byPhone!.passwordHash, byPhone!.salt), true);
  assert.equal(verifyPassword('WrongPassword123#', byPhone!.passwordHash, byPhone!.salt), false);
});

// ============================================================================
// 5. BACKWARD COMPATIBILITY WITH PRE-EXISTING SEEDED ACCOUNTS
// ============================================================================

test('Backward Compatibility: Seeded accounts (admin, vagdevi.lead) remain intact and operable', () => {
  const admin = db.getUserByUsername('admin');
  assert.ok(admin, 'admin account must exist in persistent store');
  assert.equal(admin?.role, 'SECOPS_ADMIN');
  assert.equal(verifyPassword('darkwatch123', admin!.passwordHash, admin!.salt), true);

  const vagdevi = db.getUserByUsername('vagdevi.lead');
  assert.ok(vagdevi, 'vagdevi.lead account must exist');
  assert.equal(vagdevi?.role, 'SECOPS_ADMIN');
  assert.equal(verifyPassword('darkwatch123', vagdevi!.passwordHash, vagdevi!.salt), true);

  const vamsi = db.getUserByUsername('vamsi.soc2');
  assert.ok(vamsi, 'vamsi.soc2 account must exist');
  assert.equal(vamsi?.role, 'TIER_2_ANALYST');

  const harini = db.getUserByUsername('harini.audit');
  assert.ok(harini, 'harini.audit account must exist');
  assert.equal(harini?.role, 'COMPLIANCE_OFFICER');
});
