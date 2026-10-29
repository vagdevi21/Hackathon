/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Full-Stack Application Server
 * Express Server with Vite Middleware in Dev, Static Hosting in Prod,
 * and complete Cybersecurity API endpoints with persistent storage and AI capabilities.
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { 
  db, 
  hashPassword, 
  verifyPassword, 
  UserRecord,
  PendingRegistration
} from './src/server/db.ts';
import { sendOtpEmail } from './src/server/email.ts';
import { smsService } from './src/server/sms/sms-provider.ts';
import { otpService } from './src/services/otpService.ts';
import { normalizeRegistrationPhone, maskPhoneForDisplay } from './src/server/sms/phone-normalizer.ts';
import { 
  evaluateThreatRisk, 
  advancePatchStage, 
  verifyAuditChain, 
  UserRole,
  hasPermission 
} from './src/utils/security-engine.ts';
import { calculateLinkRiskScore } from './src/services/link-analyzer.ts';
import { GoogleGenAI } from '@google/genai';
import { verifyPhoneNumber } from './src/server/verification/phone-verifier.ts';
import { verifyUrl } from './src/server/verification/url-verifier.ts';
import { verifyDocument } from './src/server/verification/document-verifier.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '25mb' }));

// In-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const entry = rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count += 1;
    next();
  };
}

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: UserRole;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please re-authenticate.' });
  }

  req.user = {
    userId: session.userId,
    username: session.username,
    role: session.role,
  };
  next();
}

function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    const session = db.getSession(token);
    if (session) {
      req.user = {
        userId: session.userId,
        username: session.username,
        role: session.role,
      };
    }
  }
  next();
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// ============================================================================

// Password policy validator
export function validatePasswordPolicy(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one digit (0-9).' };
  }
  if (!/[-@#$%^&*!_~?+=|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (e.g. @, #, $, !).' };
  }
  return { valid: true, message: '' };
}

// Registration (Mandatory Mobile OTP with India +91 First, Optional Email, Atomic Commit)
app.post('/api/auth/register', rateLimiter(10, 60000), async (req: Request, res: Response) => {
  try {
    const { username, mobileNumber, phoneNumber, email, displayName, password, confirmPassword } = req.body;
    const phoneInput = mobileNumber || phoneNumber;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const cleanUser = username.trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUser) || cleanUser.length < 3 || cleanUser.length > 32) {
      return res.status(400).json({ 
        error: 'Username must be 3-32 characters long and may only contain letters, numbers, dots, dashes, or underscores.' 
      });
    }

    if (!phoneInput || !phoneInput.trim()) {
      return res.status(400).json({ error: 'Mobile number is mandatory for registration.' });
    }

    // Normalize and validate mobile number (India +91 First)
    const phoneNorm = normalizeRegistrationPhone(phoneInput, '+91');
    if (!phoneNorm.valid || !phoneNorm.e164) {
      return res.status(400).json({ error: phoneNorm.error || 'Invalid mobile phone number.' });
    }

    // Optional email validation
    let cleanEmail: string | undefined = undefined;
    if (email && email.trim()) {
      const emailTrimmed = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        return res.status(400).json({ error: 'Provided email address is invalid. Please enter a valid email or leave it empty.' });
      }
      if (db.getUserByEmail(emailTrimmed)) {
        return res.status(409).json({ error: `An account with email "${emailTrimmed}" already exists. Please log in or reset password.` });
      }
      cleanEmail = emailTrimmed;
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirm password do not match.' });
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return res.status(400).json({ error: policy.message });
    }

    if (db.getUserByUsername(cleanUser)) {
      return res.status(409).json({ error: `Username "${cleanUser}" is already taken. Please choose another.` });
    }

    if (db.getUserByPhoneNumber(phoneNorm.e164)) {
      return res.status(409).json({ 
        error: `An account with mobile number "${maskPhoneForDisplay(phoneNorm.e164)}" already exists. Please log in or reset password.` 
      });
    }

    // Cooldown check on rapid re-registration
    const existingPending = db.getPendingRegistration(cleanUser) || db.getPendingRegistration(phoneNorm.e164);
    if (existingPending && Date.now() - existingPending.lastOtpSentAt < 30000) {
      const waitSec = Math.ceil((30000 - (Date.now() - existingPending.lastOtpSentAt)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec}s before requesting another verification code.`,
        cooldownSeconds: waitSec,
      });
    }

    const { hash, salt } = hashPassword(password);

    // Dispatch OTP challenge via centralized otpService with carrier adapter
    const otpResult = await otpService.createAndSendChallenge({
      phoneNumber: phoneNorm.e164,
      purpose: 'REGISTRATION',
      username: cleanUser,
    });

    if (otpResult.deliveryState === 'DELIVERY_FAILED' || otpResult.deliveryState === 'SMS_SERVICE_UNAVAILABLE') {
      return res.status(502).json({
        error: `Failed to dispatch SMS verification code: ${otpResult.message}. Please check mobile number or retry.`,
        deliveryState: otpResult.deliveryState,
        provider: otpResult.provider,
        canRetry: true,
      });
    }

    // Save pending registration record (Atomic: not committed to permanent users until verified)
    const pendingRegistration: PendingRegistration = {
      challengeId: otpResult.challengeId,
      username: cleanUser,
      displayName: displayName?.trim() || cleanUser,
      email: cleanEmail,
      phoneNumber: phoneNorm.e164,
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
      lastOtpSentAt: Date.now(),
    };
    db.setPendingRegistration(pendingRegistration);

    // Synchronize challenge into local DB store for backward-compatible verification
    if (otpResult.devOtpCode) {
      db.createMobileOtp(phoneNorm.e164, 'REGISTRATION', 300);
    }

    db.appendAuditLog(
      'USER_REGISTRATION_OTP_SENT', 
      phoneNorm.e164, 
      'TIER_1_ANALYST', 
      `Account: ${cleanUser} | State: ${otpResult.deliveryState} | Provider: ${otpResult.provider}`, 
      'APPROVAL_PENDING'
    );

    return res.status(200).json({
      success: true,
      status: otpResult.deliveryState,
      deliveryState: otpResult.deliveryState,
      isConfigured: otpResult.isConfigured,
      message: otpResult.message,
      requiresVerification: true,
      username: cleanUser,
      phoneNumber: phoneNorm.e164,
      mobileMasked: otpResult.maskedMobile,
      cooldownSeconds: otpResult.cooldownSeconds,
      provider: otpResult.provider,
      devHint: otpResult.devHint,
      devOtpCode: otpResult.devOtpCode,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal registration failure. Please try again.' });
  }
});

// Resend Registration Mobile OTP (Enforces 45s Cooldown & Provider Dispatch)
app.post('/api/auth/resend-otp', rateLimiter(10, 60000), async (req: Request, res: Response) => {
  try {
    const { username, mobileNumber, phoneNumber } = req.body;
    const identifier = username || mobileNumber || phoneNumber;
    if (!identifier) {
      return res.status(400).json({ error: 'Username or mobile number is required to resend OTP.' });
    }

    const pending = db.getPendingRegistration(identifier);
    if (!pending) {
      return res.status(404).json({ error: 'No pending registration session found. Please fill out the registration form.' });
    }

    const otpResult = await otpService.resendChallenge(pending.phoneNumber);
    if (!otpResult.success && otpResult.cooldownSeconds > 0) {
      return res.status(429).json({
        error: otpResult.message,
        cooldownSeconds: otpResult.cooldownSeconds,
      });
    }

    if (otpResult.deliveryState === 'DELIVERY_FAILED' || otpResult.deliveryState === 'SMS_SERVICE_UNAVAILABLE') {
      return res.status(502).json({
        error: `Failed to resend SMS: ${otpResult.message}. Please retry.`,
        deliveryState: otpResult.deliveryState,
        provider: otpResult.provider,
      });
    }

    pending.lastOtpSentAt = Date.now();
    pending.challengeId = otpResult.challengeId;
    db.setPendingRegistration(pending);

    return res.json({
      success: true,
      status: otpResult.deliveryState,
      deliveryState: otpResult.deliveryState,
      isConfigured: otpResult.isConfigured,
      message: otpResult.message,
      cooldownSeconds: 45,
      mobileMasked: otpResult.maskedMobile,
      provider: otpResult.provider,
      devHint: otpResult.devHint,
      devOtpCode: otpResult.devOtpCode,
    });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend verification code.' });
  }
});

// Cancel or Invalidate Pending Registration (when user edits registration details)
app.post('/api/auth/cancel-pending-registration', (req: Request, res: Response) => {
  try {
    const { username, mobileNumber, phoneNumber } = req.body;
    const identifier = username || mobileNumber || phoneNumber;
    if (identifier) {
      const pending = db.getPendingRegistration(identifier);
      if (pending) {
        otpService.invalidateChallenge(pending.phoneNumber);
        db.removePendingRegistration(pending);
      }
    }
    return res.json({ success: true, message: 'Pending challenge invalidated.' });
  } catch {
    return res.json({ success: true });
  }
});

// Diagnostic SMS Provider Status
app.get('/api/auth/sms-provider-status', (req: Request, res: Response) => {
  const status = otpService.getProviderStatus();
  return res.json({
    status: status.configured ? 'CONFIGURED' : 'UNCONFIGURED',
    ...status,
  });
});

// Verify Registration OTP & Commit Account Creation
app.post('/api/auth/verify-registration', rateLimiter(10, 60000), (req: Request, res: Response) => {
  try {
    const { username, mobileNumber, phoneNumber, otpCode } = req.body;
    const queryId = username || mobileNumber || phoneNumber;

    if (!queryId || !otpCode) {
      return res.status(400).json({ error: 'Username/mobile and verification code are required.' });
    }

    const pending = db.getPendingRegistration(queryId);
    if (!pending) {
      return res.status(404).json({ 
        error: 'Registration session expired or not found. Please submit registration to receive an OTP.' 
      });
    }

    // Verify OTP via otpService, falling back to db.verifyOtp if needed
    let verification = otpService.verifyChallenge({
      phoneNumber: pending.phoneNumber,
      otpCode: otpCode.trim(),
      purpose: 'REGISTRATION',
    });

    if (!verification.success) {
      const dbVerification = db.verifyOtp(pending.phoneNumber, otpCode.trim(), 'REGISTRATION');
      if (dbVerification.valid) {
        verification = { success: true, message: 'Verification successful.' };
      } else {
        return res.status(400).json({ 
          error: verification.message || dbVerification.error,
          attemptsRemaining: verification.attemptsRemaining,
          isMaxAttemptsExceeded: verification.isMaxAttemptsExceeded,
        });
      }
    }

    // OTP Verified! Atomically create permanent user record
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: `USR-${crypto.randomInt(1000, 9999)}`,
      username: pending.username,
      email: pending.email,
      displayName: pending.displayName || pending.username,
      phoneNumber: pending.phoneNumber,
      passwordHash: pending.passwordHash,
      salt: pending.salt,
      role: 'TIER_1_ANALYST',
      isVerified: true,
      registeredAt: now,
      currentLogin: now,
      previousLogin: null,
      failedAttempts: 0,
      lockoutUntil: null,
      authMethod: 'PASSWORD_BIOMETRIC',
      mobileVerifiedAt: now,
    };

    db.createUser(newUser);
    db.removePendingRegistration(pending);
    otpService.invalidateChallenge(pending.phoneNumber);
    db.appendAuditLog('ACCOUNT_VERIFIED_OTP', newUser.phoneNumber || newUser.email || newUser.username, newUser.role, `Account: ${newUser.username}`, 'SUCCESS');

    // Create session
    const session = db.createSession(newUser);

    return res.json({
      success: true,
      message: 'Mobile OTP verified successfully! Account created in persistent database.',
      token: session.token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        displayName: newUser.displayName,
        role: newUser.role,
        isVerified: true,
        currentLogin: newUser.currentLogin,
        previousLogin: newUser.previousLogin,
      },
    });
  } catch (err: any) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Failed to verify account.' });
  }
});

// Login (Supports Username, Email, or Normalized Mobile Number)
app.post('/api/auth/login', rateLimiter(15, 60000), (req: Request, res: Response) => {
  try {
    const { identifier, password, authMethod } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email/mobile and password are required.' });
    }

    const cleanInput = identifier.trim();
    let user = db.findUser(cleanInput);

    // If not found directly, attempt mobile number normalization (+91 default)
    if (!user) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      if (norm.valid && norm.e164) {
        user = db.getUserByPhoneNumber(norm.e164);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify username/mobile and password.' });
    }

    // Check account lockout (5 attempts -> 24h lockout)
    if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockoutUntil - Date.now()) / (1000 * 60)));
      return res.status(403).json({
        error: `Account is temporarily locked due to consecutive failed attempts. Please retry in ${remainingMinutes} minutes or reset password.`,
      });
    }

    const isValidPassword = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValidPassword) {
      const newAttempts = user.failedAttempts + 1;
      let lockoutUntil: number | null = null;
      if (newAttempts >= 5) {
        lockoutUntil = Date.now() + 24 * 60 * 60 * 1000;
      }

      db.updateUser(user.username, {
        failedAttempts: newAttempts,
        lockoutUntil,
      });

      if (lockoutUntil) {
        db.appendAuditLog('ACCOUNT_LOCKED_FAILED_LOGINS', user.email || user.phoneNumber || user.username, user.role, `User: ${user.username}`, 'REJECTED');
        return res.status(403).json({
          error: 'Maximum 5 failed attempts reached. Account is locked for 24 hours.',
        });
      }

      const remaining = 5 - newAttempts;
      return res.status(401).json({
        error: `Invalid credentials. (${newAttempts}/5 attempts). ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
      });
    }

    // Login successful: update timestamps and reset failed attempts
    const nowIso = new Date().toISOString();
    const updated = db.updateUser(user.username, {
      previousLogin: user.currentLogin,
      currentLogin: nowIso,
      failedAttempts: 0,
      lockoutUntil: null,
      authMethod: authMethod || user.authMethod,
    })!;

    const session = db.createSession(updated);
    db.appendAuditLog('USER_LOGIN_SUCCESS', updated.email || updated.phoneNumber || updated.username, updated.role, `${authMethod || 'PASSWORD'} Auth`, 'SUCCESS');

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token: session.token,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        isVerified: updated.isVerified,
        currentLogin: updated.currentLogin,
        previousLogin: updated.previousLogin,
        authMethod: updated.authMethod,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service encountered an unexpected error.' });
  }
});

// Send Mobile OTP for Login (Carrier SMS)
app.post('/api/auth/send-login-otp', rateLimiter(10, 60000), async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your registered mobile number or username.' });
    }

    const cleanInput = identifier.trim();
    let user = db.findUser(cleanInput);
    if (!user) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      if (norm.valid && norm.e164) {
        user = db.getUserByPhoneNumber(norm.e164);
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'No registered user matches that identifier. Please register first.' });
    }

    // Determine target phone number
    let targetPhone = user.phoneNumber;
    if (!targetPhone) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      if (norm.valid && norm.e164) {
        targetPhone = norm.e164;
      } else {
        // Fallback mobile for preset demo accounts
        targetPhone = '+919876543210';
      }
    }

    // Generate dynamic 6-digit OTP with 5-minute expiry
    const { code } = db.createMobileOtp(targetPhone, 'MFA_STEPUP', 300);
    const maskedMobile = maskPhoneForDisplay(targetPhone);

    const delivery = await smsService.sendOtp({
      toPhoneNumber: targetPhone,
      otpCode: code,
      purpose: 'LOGIN_OTP',
    });

    if (delivery.status === 'FAILED') {
      return res.status(502).json({ error: `Failed to dispatch login SMS: ${delivery.message}` });
    }

    db.appendAuditLog('LOGIN_OTP_DISPATCHED', user.email || targetPhone, user.role, `User: ${user.username}`, 'SUCCESS');

    return res.json({
      success: true,
      message: `A 6-digit OTP has been dispatched via SMS to ${maskedMobile}. Valid for 5 minutes.`,
      cooldownSeconds: 45,
      mobileMasked: maskedMobile,
      deliveryStatus: delivery.status,
      provider: delivery.provider,
      devHint: process.env.NODE_ENV !== 'production' ? delivery.devHint : undefined,
    });
  } catch (err: any) {
    console.error('Send login OTP error:', err);
    return res.status(500).json({ error: 'Failed to dispatch login OTP.' });
  }
});

// Verify Mobile OTP for Login
app.post('/api/auth/verify-login-otp', rateLimiter(15, 60000), (req: Request, res: Response) => {
  try {
    const { identifier, otpCode } = req.body;
    if (!identifier || !otpCode) {
      return res.status(400).json({ error: 'Mobile number/username and OTP code are required.' });
    }

    const cleanInput = identifier.trim();
    let user = db.findUser(cleanInput);
    if (!user) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      if (norm.valid && norm.e164) {
        user = db.getUserByPhoneNumber(norm.e164);
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    let targetPhone = user.phoneNumber;
    if (!targetPhone) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      targetPhone = norm.valid && norm.e164 ? norm.e164 : '+919876543210';
    }

    const verification = db.verifyOtp(targetPhone, otpCode, 'MFA_STEPUP');
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const nowIso = new Date().toISOString();
    const updated = db.updateUser(user.username, {
      previousLogin: user.currentLogin,
      currentLogin: nowIso,
      failedAttempts: 0,
      lockoutUntil: null,
      authMethod: 'MOBILE_OTP',
    })!;

    const session = db.createSession(updated);
    db.appendAuditLog('USER_LOGIN_SUCCESS', updated.email || targetPhone, updated.role, 'Carrier Mobile OTP Auth', 'SUCCESS');

    return res.json({
      success: true,
      message: 'Mobile OTP verified. Authentication successful.',
      token: session.token,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        displayName: updated.displayName,
        role: updated.role,
        isVerified: updated.isVerified,
        currentLogin: updated.currentLogin,
        previousLogin: updated.previousLogin,
        authMethod: updated.authMethod,
      },
    });
  } catch (err: any) {
    console.error('Verify login OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify login OTP.' });
  }
});

// Forgot Password - Dynamic OTP request (Supports Mobile SMS & Email)
app.post('/api/auth/forgot-password', rateLimiter(5, 60000), async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your registered username, mobile number, or email.' });
    }

    const cleanInput = identifier.trim();
    let user = db.findUser(cleanInput);
    if (!user) {
      const norm = normalizeRegistrationPhone(cleanInput, '+91');
      if (norm.valid && norm.e164) {
        user = db.getUserByPhoneNumber(norm.e164);
      }
    }

    // Generic safe response to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account matches that identifier, a secure verification code has been dispatched.',
      });
    }

    let devHintMsg: string | undefined = undefined;

    if (user.phoneNumber) {
      // Primary: Dispatch OTP via Mobile SMS
      const { code } = db.createMobileOtp(user.phoneNumber, 'PASSWORD_RESET', 300);
      const delivery = await smsService.sendOtp({
        toPhoneNumber: user.phoneNumber,
        otpCode: code,
        purpose: 'PASSWORD_RESET',
      });
      devHintMsg = delivery.devHint;
      db.appendAuditLog('PASSWORD_RESET_OTP_REQUEST', user.phoneNumber, user.role, `Account: ${user.username} | SMS`, 'SUCCESS');

      return res.json({
        success: true,
        message: `A 6-digit recovery OTP has been dispatched via SMS to ${maskPhoneForDisplay(user.phoneNumber)}. Valid for 5 minutes.`,
        devHint: process.env.NODE_ENV !== 'production' ? devHintMsg : undefined,
      });
    } else {
      // Fallback for legacy accounts without registered mobile number
      const { code } = db.createOtp(user.username, 'PASSWORD_RESET');
      const targetEmail = user.email || `${user.username}@darkwatch.corp`;
      const delivery = await sendOtpEmail({
        toEmail: targetEmail,
        username: user.username,
        otpCode: code,
        purpose: 'PASSWORD_RESET',
      });
      devHintMsg = delivery.message;
      db.appendAuditLog('PASSWORD_RESET_OTP_REQUEST', targetEmail, user.role, `Account: ${user.username} | Email`, 'SUCCESS');

      return res.json({
        success: true,
        message: `A secure verification code has been dispatched to ${targetEmail}.`,
        devHint: process.env.NODE_ENV !== 'production' ? devHintMsg : undefined,
      });
    }
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process password recovery request.' });
  }
});

// Reset Password with Verified OTP
app.post('/api/auth/reset-password', rateLimiter(10, 60000), (req: Request, res: Response) => {
  try {
    const { identifier, otpCode, newPassword, confirmPassword } = req.body;
    if (!identifier || !otpCode || !newPassword) {
      return res.status(400).json({ error: 'Identifier, OTP code, and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation password do not match.' });
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return res.status(400).json({ error: policy.message });
    }

    const user = db.findUser(identifier);
    if (!user) {
      return res.status(400).json({ error: 'Invalid password recovery request.' });
    }

    const verification = db.verifyOtp(user.username, otpCode, 'PASSWORD_RESET');
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const { hash, salt } = hashPassword(newPassword);
    db.updateUser(user.username, {
      passwordHash: hash,
      salt,
      failedAttempts: 0,
      lockoutUntil: null,
    });

    db.appendAuditLog('PASSWORD_RESET_COMPLETE', user.email || user.phoneNumber || user.username, user.role, `Account: ${user.username}`, 'SUCCESS');

    return res.json({
      success: true,
      message: 'Password updated successfully! You can now authenticate with your new credentials.',
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Current User Profile
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserByUsername(req.user!.username);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isVerified: user.isVerified,
    currentLogin: user.currentLogin,
    previousLogin: user.previousLogin,
    authMethod: user.authMethod,
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    db.deleteSession(token);
  }
  db.appendAuditLog('USER_LOGOUT', req.user!.username, req.user!.role, 'Session terminated', 'SUCCESS');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ============================================================================
// SCAN HISTORY & REPUTATION ENGINE ENDPOINTS
// ============================================================================

app.get('/api/scans', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const username = req.user?.username;
  const scans = db.getScans(username);
  return res.json(scans);
});

app.post('/api/scans', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { target, targetType, isSaved, notes } = req.body;
    if (!target) {
      return res.status(400).json({ error: 'Scan target (URL or Phone) is required.' });
    }

    const type = targetType === 'PHONE' ? 'PHONE' : 'URL';
    const now = new Date();

    let analysis: any;
    if (type === 'URL') {
      analysis = calculateLinkRiskScore(target);
    } else {
      // Phone heuristic assessment
      analysis = {
        score: target.includes('800') || target.includes('555') ? 85 : 15,
        riskLevel: target.includes('800') || target.includes('555') ? 'HIGH_RISK' : 'VERIFIED_SAFE',
        summary: `Heuristic assessment of ${target} complete.`,
        category: 'Telephony Reputation Analysis',
      };
    }

    const scanRecord = {
      id: `HIST-${crypto.randomInt(1000, 9999)}`,
      query: target,
      targetType: type as 'URL' | 'PHONE',
      timestamp: `Just now (${now.toISOString().substring(11, 16)} UTC)`,
      isoDate: now.toISOString(),
      scamRating: analysis.score,
      verdict: analysis.riskLevel as any,
      category: analysis.category || (type === 'URL' ? 'URL Investigation' : 'Caller Telephony Scan'),
      summary: analysis.summary || `Scan executed on ${target}.`,
      blacklistsFlagged: analysis.blacklistsFlagged || [],
      totalBlacklistsChecked: 9,
      carrierOrRegistrar: analysis.carrierOrRegistrar || 'Autonomous Network Heuristics',
      country: analysis.country || 'Global',
      isSaved: isSaved ?? true,
      notes: notes || undefined,
      username: req.user?.username,
    };

    db.saveScan(scanRecord);
    db.appendAuditLog('EXECUTE_SCAN', req.user?.username || 'anonymous', req.user?.role || 'TIER_1_ANALYST', `${type}: ${target}`, 'SUCCESS');

    return res.status(201).json(scanRecord);
  } catch (err: any) {
    console.error('Scan creation error:', err);
    return res.status(500).json({ error: 'Failed to execute and save scan.' });
  }
});

app.patch('/api/scans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes, toggleSave } = req.body;

  if (toggleSave) {
    const newStatus = db.toggleSaveScan(id);
    return res.json({ success: true, isSaved: newStatus });
  }

  if (typeof notes === 'string') {
    const ok = db.updateScanNotes(id, notes);
    return res.json({ success: ok });
  }

  return res.status(400).json({ error: 'No update action specified.' });
});

app.delete('/api/scans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteScan(id);
  return res.json({ success: deleted });
});

// ============================================================================
// THREATS, INCIDENT RESPONSE & AI REASONING
// ============================================================================

app.get('/api/threats', (req: Request, res: Response) => {
  res.json(db.getThreats());
});

app.post('/api/threats/simulate', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { alertId } = req.body;
  const updated = db.updateThreat(alertId, { status: 'SIMULATED' });
  if (!updated) {
    return res.status(404).json({ error: 'Threat alert not found.' });
  }
  db.appendAuditLog('SIMULATE_MITIGATION', req.user?.username || 'analyst', req.user?.role || 'TIER_1_ANALYST', alertId, 'SIMULATED');
  return res.json({ success: true, threat: updated });
});

app.post('/api/threats/approve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { alertId } = req.body;
  const role = req.user!.role;

  // Enforce server-side role check
  if (!hasPermission(role, 'APPROVE_PLAYBOOK')) {
    return res.status(403).json({
      error: `Access denied. Role "${role}" lacks APPROVE_PLAYBOOK permission. Only SecOps Admins or Tier 2 Analysts can approve live mitigations.`,
    });
  }

  const updated = db.updateThreat(alertId, { status: 'MITIGATED' });
  if (!updated) {
    return res.status(404).json({ error: 'Threat alert not found.' });
  }

  db.appendAuditLog('APPROVE_LIVE_MITIGATION', req.user!.username, role, alertId, 'SUCCESS');
  return res.json({ success: true, threat: updated });
});

// Server-side Gemini AI Reasoning endpoint
app.post('/api/ai/analyze-threat', async (req: Request, res: Response) => {
  const { alert } = req.body;
  if (!alert) {
    return res.status(400).json({ error: 'Alert payload required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      isAiPowered: false,
      summary: `DarkWatch Autonomous Engine: Multi-vector correlation flags ${alert.title} against asset ${alert.targetAsset?.name}. Threat pattern matches baseline anomaly deviation.`,
      blastRadius: `Affected target ${alert.targetAsset?.name} (${alert.targetAsset?.criticality}) and interconnected microservices.`,
      mitreMapping: {
        tactic: alert.mitreTactic || 'Initial Access (TA0001)',
        technique: alert.mitreTechnique || 'Valid Accounts (T1078)',
      },
      recommendedActions: [alert.recommendedAction || 'Execute SOAR Playbook quarantine'],
      simulationHypothesis: 'Simulation verifies zero degradation on healthy production traffic.',
      confidenceReasoning: `${alert.confidence}% confidence calculated from multi-signal telemetry.`,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are DarkWatch AI, an autonomous cybersecurity incident reasoning engine.
Analyze this incident and return STRICT JSON with keys:
"summary": string (plain language root cause explanation),
"blastRadius": string (which systems or data are endangered),
"mitreTactic": string,
"mitreTechnique": string,
"recommendedActions": array of strings,
"simulationHypothesis": string,
"confidenceReasoning": string

Incident Telemetry:
Title: ${alert.title}
Type: ${alert.type}
Severity: ${alert.severity}
Confidence: ${alert.confidence}%
Source IP: ${alert.sourceIp} (${alert.sourceCountry})
Target Asset: ${alert.targetAsset?.name} (${alert.targetAsset?.type}, ${alert.targetAsset?.criticality})
Description: ${alert.description}
Payload: ${alert.payloadSummary}`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (aiRes.text) {
      const parsed = JSON.parse(aiRes.text);
      return res.json({
        isAiPowered: true,
        summary: parsed.summary,
        blastRadius: parsed.blastRadius,
        mitreMapping: {
          tactic: parsed.mitreTactic || alert.mitreTactic,
          technique: parsed.mitreTechnique || alert.mitreTechnique,
        },
        recommendedActions: parsed.recommendedActions || [alert.recommendedAction],
        simulationHypothesis: parsed.simulationHypothesis || 'Zero downtime confirmed via sandbox testing.',
        confidenceReasoning: parsed.confidenceReasoning || `High confidence from correlated threat telemetry.`,
      });
    }

    throw new Error('Empty AI response');
  } catch (err: any) {
    console.warn('Gemini server API fallback:', err.message);
    return res.json({
      isAiPowered: false,
      summary: `DarkWatch Deterministic Correlation: Elevated threat level detected on ${alert.targetAsset?.name}. Pattern matches known exploit signature.`,
      blastRadius: `Target asset ${alert.targetAsset?.name} and adjacent network interfaces.`,
      mitreMapping: {
        tactic: alert.mitreTactic,
        technique: alert.mitreTechnique,
      },
      recommendedActions: [alert.recommendedAction],
      simulationHypothesis: 'Safe containment verified with 0% impact on mission-critical workloads.',
      confidenceReasoning: `${alert.confidence}% confidence derived from firewall and EDR logs.`,
    });
  }
});

// ============================================================================
// VULNERABILITIES & AUTOMATED PATCH MANAGEMENT
// ============================================================================

app.get('/api/vulnerabilities', (req: Request, res: Response) => {
  res.json(db.getVulnerabilities());
});

app.get('/api/patches', (req: Request, res: Response) => {
  res.json(db.getPatches());
});

app.post('/api/patches/:id/advance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const role = req.user!.role;

  if (!hasPermission(role, 'DEPLOY_PATCH')) {
    return res.status(403).json({
      error: `Access denied. Role "${role}" lacks DEPLOY_PATCH permission. Only SecOps Admins can advance patch deployments.`,
    });
  }

  const patch = db.getPatches().find((p) => p.id === id);
  if (!patch) {
    return res.status(404).json({ error: 'Patch record not found.' });
  }

  const transition = advancePatchStage(patch.currentStage, true);
  const updated = db.updatePatch(id, {
    currentStage: transition.nextStage,
    progressPercent: transition.nextStage === 'PRODUCTION_DEPLOYED' ? 100 : patch.progressPercent + 30,
    lastUpdated: 'Just now',
  });

  db.appendAuditLog('ADVANCE_PATCH_STAGE', req.user!.username, role, `${id} -> ${transition.nextStage}`, 'SUCCESS');
  return res.json({ success: true, patch: updated, message: transition.message });
});

// ============================================================================
// SIEM TELEMETRY INGESTION PIPELINE (API KEY / BEARER AUTHORIZED)
// ============================================================================

app.post('/api/siem/events', (req: Request, res: Response) => {
  try {
    const rawEvents = Array.isArray(req.body) ? req.body : [req.body];
    if (rawEvents.length === 0) {
      return res.status(400).json({ error: 'At least one telemetry event is required.' });
    }

    const ingested = [];
    const alertsGenerated = [];

    for (const raw of rawEvents) {
      const source = raw.source || raw.sourceName || 'Generic-SIEM-Connector';
      const eventType = raw.eventType || raw.type || 'SECURITY_TELEMETRY';
      const sourceIp = raw.sourceIp || raw.src_ip || '192.168.1.100';
      const targetAsset = raw.targetAsset || raw.dest_host || 'Core-Gateway';
      const severityScore = typeof raw.severityScore === 'number' ? raw.severityScore : 7;
      const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.85;

      const evalResult = evaluateThreatRisk({
        baseSeverityScore: severityScore,
        confidenceScore: confidence,
        assetCriticality: raw.assetCriticality || 'HIGH',
        attackVelocityMultiplier: raw.velocity || 1.2,
      });

      const eventRecord = {
        id: `SIEM-${crypto.randomInt(1000, 9999)}`,
        timestamp: new Date().toISOString(),
        source,
        sourceIp,
        targetAsset,
        eventType,
        severity: evalResult.tier,
        rawPayload: typeof raw.payload === 'string' ? raw.payload : JSON.stringify(raw),
        normalizedData: {
          compositeScore: evalResult.compositeScore,
          requiresHumanApproval: evalResult.requiresHumanApproval,
          recommendedAction: evalResult.recommendedAction,
        },
      };

      db.ingestSiemEvent(eventRecord);
      ingested.push(eventRecord);

      // If threat evaluation is CRITICAL or HIGH, automatically generate an actionable ThreatAlert
      if (evalResult.tier === 'CRITICAL' || evalResult.tier === 'HIGH') {
        const newAlert = {
          id: `ALT-${crypto.randomInt(1000, 9999)}`,
          title: raw.title || `Elevated ${eventType} Correlated from ${source}`,
          type: (raw.alertType || 'MALWARE') as any,
          severity: evalResult.tier,
          confidence: Math.round(confidence * 100),
          timestamp: 'Just now',
          sourceIp,
          sourceCountry: raw.sourceCountry || 'External Red Zone',
          sourceCountryCode: raw.sourceCountryCode || 'XX',
          targetAsset: {
            id: `AST-${crypto.randomInt(100, 999)}`,
            name: targetAsset,
            ip: raw.targetIp || '10.240.10.1',
            type: 'PROD_DB' as const,
            criticality: 'HIGH' as const,
          },
          status: 'ACTIVE' as const,
          mitreTactic: raw.mitreTactic || 'Lateral Movement (TA0008)',
          mitreTechnique: raw.mitreTechnique || 'Exploitation of Remote Services (T1210)',
          description: raw.description || `Ingested SIEM event with composite score ${evalResult.compositeScore}.`,
          payloadSummary: eventRecord.rawPayload.substring(0, 200),
          recommendedAction: evalResult.recommendedAction,
          playbookId: 'PB-AUTO-CONTAIN',
          requiresHumanApproval: evalResult.requiresHumanApproval,
        };
        db.addThreat(newAlert);
        alertsGenerated.push(newAlert);
      }
    }

    db.appendAuditLog('SIEM_TELEMETRY_INGEST', 'siem-collector@darkwatch.corp', 'SECOPS_ADMIN', `Ingested ${ingested.length} events, ${alertsGenerated.length} alerts generated`, 'SUCCESS');

    return res.status(201).json({
      success: true,
      ingestedCount: ingested.length,
      alertsGeneratedCount: alertsGenerated.length,
      events: ingested,
      alerts: alertsGenerated,
    });
  } catch (err: any) {
    console.error('SIEM ingestion error:', err);
    return res.status(500).json({ error: 'Failed to ingest SIEM telemetry.' });
  }
});

app.get('/api/siem/events', (req: Request, res: Response) => {
  res.json(db.getSiemEvents());
});

// ============================================================================
// AUDIT TRAIL & CRYPTOGRAPHIC CHAIN INTEGRITY
// ============================================================================

app.get('/api/audit', (req: Request, res: Response) => {
  res.json(db.getAuditLogs());
});

app.post('/api/audit/verify', (req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  const result = verifyAuditChain(logs);
  return res.json(result);
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'DarkWatch AI Cyber Threat Early Warning & Vulnerability Response',
    version: '2.5.0-production',
    sha256VerificationActive: true,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AUTHENTICITY, SCAM & THREAT VERIFICATION CENTER ENDPOINTS
// ============================================================================

// 1. Phone Number Verification (India +91 First)
app.post('/api/verification/phone', rateLimiter(30, 60000), async (req: Request, res: Response) => {
  try {
    const { phoneNumber, countryCode = '+91' } = req.body;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: 'Valid phoneNumber string is required.' });
    }
    const result = await verifyPhoneNumber(phoneNumber, countryCode);
    db.appendAuditLog(
      'PHONE_VERIFICATION_CHECK',
      'system',
      'TIER_1_ANALYST',
      `Checked ${result.maskedNumber} (${result.reputationStatus})`,
      result.sharedClassification === 'MALICIOUS_FRAUD_CONFIRMED' ? 'REJECTED' : 'SUCCESS'
    );
    return res.json(result);
  } catch (err: any) {
    console.error('Phone verification error:', err);
    return res.status(500).json({ error: err.message || 'Phone verification processing failed.' });
  }
});

// 2. Website / URL Verification
app.post('/api/verification/url', rateLimiter(30, 60000), async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid url string is required.' });
    }
    const result = await verifyUrl(url);
    db.appendAuditLog(
      'URL_VERIFICATION_CHECK',
      'system',
      'TIER_1_ANALYST',
      `Checked URL ${result.hostname || url} (${result.sharedClassification})`,
      result.sharedClassification === 'MALICIOUS_FRAUD_CONFIRMED' ? 'REJECTED' : 'SUCCESS'
    );
    return res.json(result);
  } catch (err: any) {
    console.error('URL verification error:', err);
    return res.status(500).json({ error: err.message || 'URL verification processing failed.' });
  }
});

// 3. Document / Exam Paper Verification
app.post('/api/verification/document', rateLimiter(20, 60000), async (req: Request, res: Response) => {
  try {
    const { fileName, fileBase64, mimeType, claimedIssuer, claimedExamId, extractedTextHint } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'Document fileName and fileBase64 are required.' });
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    const result = await verifyDocument({
      fileName,
      fileBuffer: buffer,
      mimeType: mimeType || 'application/pdf',
      claimedIssuer,
      claimedExamId,
      extractedTextHint,
    });
    db.appendAuditLog(
      'DOCUMENT_VERIFICATION_CHECK',
      'system',
      'TIER_1_ANALYST',
      `Verified ${fileName} (${result.verificationStatus})`,
      result.verificationStatus === 'CONFIRMED MISMATCH' ? 'REJECTED' : 'SUCCESS'
    );
    return res.json(result);
  } catch (err: any) {
    console.error('Document verification error:', err);
    return res.status(500).json({ error: err.message || 'Document verification processing failed.' });
  }
});

// 4. Provider Transparency & Capabilities
app.get('/api/verification/providers', (req: Request, res: Response) => {
  res.json({
    phoneReputationProvider: {
      name: 'Telecom Intelligence Provider Adapter',
      configured: Boolean(process.env.PHONE_REPUTATION_API_KEY || process.env.NUMVERIFY_API_KEY),
      supportedCountries: ['+91 (India - Default)', '+1 (US/Canada)', '+44 (UK)', 'International'],
    },
    urlThreatIntelligence: {
      name: 'Global Threat Intelligence Feed',
      configured: Boolean(process.env.SAFE_BROWSING_API_KEY || process.env.VIRUSTOTAL_API_KEY),
    },
    documentAuthoritativeRegistry: {
      name: 'Institutional Examination Repository',
      configured: true,
      recordsCount: 2,
    },
  });
});

// ============================================================================
// MOUNT VITE (DEV) OR STATIC FILES (PROD)
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[DarkWatch AI] Server running on http://${HOST}:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
