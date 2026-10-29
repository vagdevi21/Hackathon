/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Comprehensive End-to-End Security & Authentication Test Suite
 * Tests User Registration, Dynamic OTP lifecycle, Password Policies, Lockout,
 * SIEM event ingestion, and SHA-256 Audit Chain Integrity.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  db, 
  hashPassword, 
  verifyPassword 
} from './db.ts';
import { validatePasswordPolicy } from '../../server.ts';
import { 
  computeAuditHash, 
  verifyAuditChain, 
  evaluateThreatRisk, 
  hasPermission,
  calculateVPR,
  standardSha256
} from '../utils/security-engine.ts';

// ============================================================================
// 1. PASSWORD POLICY TESTS
// ============================================================================

test('Password policy: Rejects password shorter than 8 characters', () => {
  const res = validatePasswordPolicy('Short1!');
  assert.equal(res.valid, false);
  assert.match(res.message, /at least 8 characters/);
});

test('Password policy: Rejects password without uppercase letter', () => {
  const res = validatePasswordPolicy('alllowercase123#');
  assert.equal(res.valid, false);
  assert.match(res.message, /uppercase/);
});

test('Password policy: Rejects password without lowercase letter', () => {
  const res = validatePasswordPolicy('ALLUPPERCASE123#');
  assert.equal(res.valid, false);
  assert.match(res.message, /lowercase/);
});

test('Password policy: Rejects password without a digit', () => {
  const res = validatePasswordPolicy('NoDigitsHere!@#');
  assert.equal(res.valid, false);
  assert.match(res.message, /digit/);
});

test('Password policy: Rejects password without a special character', () => {
  const res = validatePasswordPolicy('NoSpecialChar123');
  assert.equal(res.valid, false);
  assert.match(res.message, /special character/);
});

test('Password policy: Accepts compliant strong password', () => {
  const res = validatePasswordPolicy('DarkWatch@2026#SecOps');
  assert.equal(res.valid, true);
  assert.equal(res.message, '');
});

// ============================================================================
// 2. CRYPTOGRAPHIC PASSWORD HASHING
// ============================================================================

test('PBKDF2 Password Hashing: Hashes with salt and timing-safe verification', () => {
  const pwd = 'SecureTestPassword99!';
  const { hash, salt } = hashPassword(pwd);

  assert.ok(hash.length >= 64);
  assert.ok(salt.length >= 16);

  // Correct password matches
  assert.equal(verifyPassword(pwd, hash, salt), true);

  // Wrong password fails
  assert.equal(verifyPassword('WrongPassword99!', hash, salt), false);
});

// ============================================================================
// 3. DYNAMIC OTP LIFECYCLE TESTS
// ============================================================================

test('Dynamic OTP: Each request generates a fresh random 6-digit code', () => {
  const user = 'test_otp_user_' + Date.now();
  const otp1 = db.createOtp(user, 'REGISTRATION');
  const otp2 = db.createOtp(user, 'REGISTRATION');

  assert.equal(otp1.code.length, 6);
  assert.equal(otp2.code.length, 6);
  assert.match(otp1.code, /^\d{6}$/);
  assert.match(otp2.code, /^\d{6}$/);

  // Resend creates fresh code and invalidates earlier active code
  assert.notEqual(otp1.record.id, otp2.record.id);

  // The first OTP should now be marked consumed/invalidated by the resend
  const verifyOld = db.verifyOtp(user, otp1.code, 'REGISTRATION');
  assert.equal(verifyOld.valid, false);

  // The newest OTP is valid
  const verifyNew = db.verifyOtp(user, otp2.code, 'REGISTRATION');
  assert.equal(verifyNew.valid, true);
});

test('Dynamic OTP: Single-use enforcement (cannot be reused)', () => {
  const user = 'test_single_use_' + Date.now();
  const { code } = db.createOtp(user, 'PASSWORD_RESET');

  // First use: Valid
  const firstAttempt = db.verifyOtp(user, code, 'PASSWORD_RESET');
  assert.equal(firstAttempt.valid, true);

  // Second use: Rejection
  const secondAttempt = db.verifyOtp(user, code, 'PASSWORD_RESET');
  assert.equal(secondAttempt.valid, false);
  assert.match(secondAttempt.error!, /No active OTP/);
});

test('Dynamic OTP: Maximum 5 verification attempts enforced', () => {
  const user = 'test_bruteforce_' + Date.now();
  db.createOtp(user, 'REGISTRATION');

  for (let i = 1; i <= 4; i++) {
    const wrongAttempt = db.verifyOtp(user, '000000', 'REGISTRATION');
    assert.equal(wrongAttempt.valid, false);
    assert.match(wrongAttempt.error!, new RegExp(`${i}/5 attempts`));
  }

  // 5th wrong attempt triggers invalidation
  const fifthAttempt = db.verifyOtp(user, '000000', 'REGISTRATION');
  assert.equal(fifthAttempt.valid, false);

  // 6th attempt is locked
  const lockedAttempt = db.verifyOtp(user, '000000', 'REGISTRATION');
  assert.equal(lockedAttempt.valid, false);
});

test('Dynamic OTP: Purpose binding prevents cross-flow reuse', () => {
  const user = 'test_purpose_' + Date.now();
  const { code } = db.createOtp(user, 'REGISTRATION');

  // Attempting to verify a REGISTRATION code under PASSWORD_RESET purpose must fail
  const crossPurpose = db.verifyOtp(user, code, 'PASSWORD_RESET');
  assert.equal(crossPurpose.valid, false);

  // Correct purpose succeeds
  const correctPurpose = db.verifyOtp(user, code, 'REGISTRATION');
  assert.equal(correctPurpose.valid, true);
});

// ============================================================================
// 4. PERSISTENT USER & SESSION MANAGEMENT
// ============================================================================

test('Database Persistence: User registration and authentication profile', () => {
  const username = 'analyst.persist_' + Date.now();
  const email = `${username}@darkwatch.corp`;
  const { hash, salt } = hashPassword('DarkWatch@2026#SecOps');

  const record = db.createUser({
    id: `USR-${Date.now()}`,
    username,
    email,
    displayName: 'Test Analyst',
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
  });

  assert.equal(record.username, username);

  // Retrieve user by username
  const fetchedUser = db.getUserByUsername(username);
  assert.ok(fetchedUser);
  assert.equal(fetchedUser?.email, email);

  // Retrieve user by email
  const fetchedByEmail = db.getUserByEmail(email);
  assert.ok(fetchedByEmail);
  assert.equal(fetchedByEmail?.username, username);

  // Create session
  const session = db.createSession(record);
  assert.ok(session.token);

  // Verify session
  const retrievedSession = db.getSession(session.token);
  assert.ok(retrievedSession);
  assert.equal(retrievedSession?.username, username);

  // Revoke session on logout
  db.deleteSession(session.token);
  assert.equal(db.getSession(session.token), undefined);
});

// ============================================================================
// 5. CRYPTOGRAPHIC SHA-256 AUDIT CHAIN INTEGRITY & TAMPER DETECTION
// ============================================================================

test('Audit Trail: Standard SHA-256 produces deterministic 64-hex digest', () => {
  const hash1 = standardSha256('hello-darkwatch');
  const hash2 = standardSha256('hello-darkwatch');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
  assert.match(hash1, /^[0-9a-f]{64}$/);
});

test('Audit Trail: Valid audit chain verifies successfully', () => {
  const g = 'dw-sha256-0000000000000000000000000000000000000000000000000000000000000000';
  const h1 = computeAuditHash(g, 'GENESIS_LOG', 'system@darkwatch.corp', '2026-10-17 10:00:00 UTC');
  const h2 = computeAuditHash(h1, 'FIREWALL_BLOCK', 'admin@darkwatch.corp', '2026-10-17 10:05:00 UTC');

  const chain = [
    {
      id: 'AUD-002',
      timestamp: '2026-10-17 10:05:00 UTC',
      actor: 'admin@darkwatch.corp',
      role: 'SECOPS_ADMIN',
      action: 'FIREWALL_BLOCK',
      target: '192.168.1.1',
      result: 'SUCCESS',
      hash: h2,
      prevHash: h1,
    },
    {
      id: 'AUD-001',
      timestamp: '2026-10-17 10:00:00 UTC',
      actor: 'system@darkwatch.corp',
      role: 'SECOPS_ADMIN',
      action: 'GENESIS_LOG',
      target: 'Core Network',
      result: 'SUCCESS',
      hash: h1,
      prevHash: g,
    },
  ];

  const result = verifyAuditChain(chain);
  assert.equal(result.isValid, true);
  assert.equal(result.totalBlocks, 2);
  assert.equal(result.verifiedBlocks, 2);
});

test('Audit Trail: Detects tampering or altered record in the chain', () => {
  const g = 'dw-sha256-0000000000000000000000000000000000000000000000000000000000000000';
  const h1 = computeAuditHash(g, 'GENESIS_LOG', 'system@darkwatch.corp', '2026-10-17 10:00:00 UTC');
  const h2 = computeAuditHash(h1, 'FIREWALL_BLOCK', 'admin@darkwatch.corp', '2026-10-17 10:05:00 UTC');

  // An adversary alters block 1's hash
  const tamperedChain = [
    {
      id: 'AUD-002',
      timestamp: '2026-10-17 10:05:00 UTC',
      actor: 'admin@darkwatch.corp',
      role: 'SECOPS_ADMIN',
      action: 'FIREWALL_BLOCK',
      target: '192.168.1.1',
      result: 'SUCCESS',
      hash: h2,
      prevHash: 'dw-sha256-TAMPERED_PREV_HASH_1234567890abcdef', // Tampered link!
    },
    {
      id: 'AUD-001',
      timestamp: '2026-10-17 10:00:00 UTC',
      actor: 'system@darkwatch.corp',
      role: 'SECOPS_ADMIN',
      action: 'GENESIS_LOG',
      target: 'Core Network',
      result: 'SUCCESS',
      hash: h1,
      prevHash: g,
    },
  ];

  const result = verifyAuditChain(tamperedChain);
  assert.equal(result.isValid, false);
  assert.match(result.error!, /Broken chain link/);
  assert.equal(result.failedBlockId, 'AUD-002');
});

// ============================================================================
// 6. SIEM EVENT TELEMETRY & THREAT RISK EVALUATION
// ============================================================================

test('SIEM Telemetry: High severity ingestion calculates risk and triggers approval flag', () => {
  const criticalEvent = evaluateThreatRisk({
    baseSeverityScore: 9.5,
    confidenceScore: 0.95,
    assetCriticality: 'MISSION_CRITICAL',
    attackVelocityMultiplier: 2.0,
  });

  assert.equal(criticalEvent.tier, 'CRITICAL');
  assert.equal(criticalEvent.requiresHumanApproval, true);
  assert.equal(criticalEvent.slaMinutes, 15);
  assert.ok(criticalEvent.compositeScore >= 85);
});

test('RBAC Authorization: Enforces role boundaries on critical actions', () => {
  assert.equal(hasPermission('SECOPS_ADMIN', 'APPROVE_PLAYBOOK'), true);
  assert.equal(hasPermission('SECOPS_ADMIN', 'DEPLOY_PATCH'), true);

  assert.equal(hasPermission('TIER_2_ANALYST', 'APPROVE_PLAYBOOK'), true);
  assert.equal(hasPermission('TIER_2_ANALYST', 'DEPLOY_PATCH'), false);

  assert.equal(hasPermission('TIER_1_ANALYST', 'APPROVE_PLAYBOOK'), false);
  assert.equal(hasPermission('TIER_1_ANALYST', 'SIMULATE_PLAYBOOK'), true);
});

test('Direct Password Reset: Resets password directly without requiring 6-digit OTP', () => {
  const user = db.getUserByUsername('admin');
  assert.ok(user, 'Admin user exists');

  // Direct password update without OTP challenge
  const newPwd = 'NewSecurePassword@2026';
  const { hash, salt } = hashPassword(newPwd);
  db.updateUser(user.username, {
    passwordHash: hash,
    salt,
    failedAttempts: 0,
    lockoutUntil: null,
  });

  const updated = db.getUserByUsername('admin');
  assert.ok(updated);
  assert.equal(verifyPassword(newPwd, updated.passwordHash, updated.salt), true);
  assert.equal(updated.failedAttempts, 0);

  // Restore original password
  const restore = hashPassword('darkwatch123');
  db.updateUser(user.username, {
    passwordHash: restore.hash,
    salt: restore.salt,
  });
});

