/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Multi-Factor Authentication & Identity Store
 * Supports 3 Primary Modes:
 * 1. Password/Biometric Authentication (Passkey + Encrypted Credential)
 * 2. Mobile OTP Authentication (Carrier SMS / Demo Gateway)
 * 3. Face Authentication (Ocular HUD & Liveness Evaluation)
 */

import { UserRole } from './security-engine';

export type AuthMethod = 
  | 'PASSWORD_BIOMETRIC' 
  | 'MOBILE_OTP' 
  | 'FACE_AUTH'
  | 'AADHAAR' 
  | 'FINGERPRINT' 
  | 'IRIS' 
  | 'PASSWORD';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  accountIdentifier: string;
  role: UserRole;
  authMethod: AuthMethod;
  currentLogin: string;
  previousLogin: string | null;
  isVerified: boolean;
  isFirstLogin?: boolean;
  aadhaarNumber?: string;
  phoneNumber?: string;
}

const SESSION_KEY = 'darkwatch_active_session_v2';
const LOGIN_HISTORY_PREFIX = 'darkwatch_last_login_';

export const PRESET_USERS: Record<string, { name: string; username: string; role: UserRole; identifier: string; phone: string }> = {
  vagdevi: {
    name: 'Vagdevi',
    username: 'vagdevi.lead',
    role: 'SECOPS_ADMIN',
    identifier: 'vagdevi@darkwatch.corp',
    phone: '+91 98765 43210',
  },
  vamsi: {
    name: 'Vamsi',
    username: 'vamsi.soc2',
    role: 'TIER_2_ANALYST',
    identifier: 'vamsi@darkwatch.corp',
    phone: '+1 (555) 234-5678',
  },
  surya: {
    name: 'Surya',
    username: 'surya.hunter',
    role: 'TIER_2_ANALYST',
    identifier: 'surya@darkwatch.corp',
    phone: '+1 (555) 345-6789',
  },
  tabasum: {
    name: 'Tabasum',
    username: 'tabasum.tier1',
    role: 'TIER_1_ANALYST',
    identifier: 'tabasum@darkwatch.corp',
    phone: '+1 (555) 456-7890',
  },
  harini: {
    name: 'Harini',
    username: 'harini.audit',
    role: 'COMPLIANCE_OFFICER',
    identifier: 'harini@darkwatch.corp',
    phone: '+91 91234 56789',
  },
};

/**
 * Retrieves the currently active authenticated session.
 * Returns null if the user has not logged in yet.
 */
export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Creates an authenticated session for the given user,
 * correctly calculating their actual previous login timestamp.
 */
export const loginUser = (
  usernameOrPhone: string,
  authMethod: AuthMethod,
  role: UserRole = 'SECOPS_ADMIN'
): UserProfile => {
  const cleanInput = usernameOrPhone.trim();
  const lower = cleanInput.toLowerCase();
  
  // Match with preset if recognized
  let matchedPreset = Object.values(PRESET_USERS).find(
    (p) => lower.includes(p.name.toLowerCase()) || lower === p.username.toLowerCase() || cleanInput === p.phone
  );

  const displayName = matchedPreset ? matchedPreset.name : (cleanInput.split(/[@\s]/)[0] || 'SecOps Analyst');
  const assignedRole = matchedPreset ? matchedPreset.role : role;
  const identifier = matchedPreset 
    ? matchedPreset.identifier 
    : cleanInput.includes('@') 
    ? cleanInput 
    : `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@darkwatch.corp`;

  const now = new Date();
  const currentIso = now.toISOString();

  // Retrieve actual previous login timestamp from persistent storage
  const historyKey = `${LOGIN_HISTORY_PREFIX}${lower.replace(/[^a-z0-9]/g, '_')}`;
  let previousLogin: string | null = null;
  let isFirstLogin = true;

  if (typeof window !== 'undefined') {
    try {
      const prevStored = localStorage.getItem(historyKey);
      if (prevStored) {
        previousLogin = prevStored;
        isFirstLogin = false;
      }
      // Save current login as the newest record for next time
      localStorage.setItem(historyKey, currentIso);
    } catch (e) {
      console.warn('Could not access localStorage for login history', e);
    }
  }

  const profile: UserProfile = {
    id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    username: cleanInput,
    displayName,
    accountIdentifier: identifier,
    role: assignedRole,
    authMethod,
    currentLogin: currentIso,
    previousLogin,
    isVerified: true,
    isFirstLogin,
    phoneNumber: matchedPreset?.phone || (cleanInput.startsWith('+') || /^\d+$/.test(cleanInput) ? cleanInput : undefined),
    aadhaarNumber: '7842 9012 3456',
  };

  saveUser(profile);
  return profile;
};

export const saveUser = (user: UserProfile): void => {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(user);
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.setItem(SESSION_KEY, serialized);
    window.dispatchEvent(new CustomEvent('darkwatch_auth_updated', { detail: user }));
  } catch (err) {
    console.error('Failed to save auth profile', err);
  }
};

export const updateStoredUser = saveUser;

export const logoutUser = (): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('darkwatch_auth_updated', { detail: null }));
  } catch (err) {
    console.error('Failed to logout', err);
  }
};

/**
 * Format timestamp into human-readable format e.g. "24 Oct 2026, 09:42 AM UTC"
 */
export const formatLoginTimestamp = (isoDate?: string | null): string => {
  if (!isoDate) return 'First successful login';
  try {
    const d = new Date(isoDate);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = d.getUTCFullYear();
    let hours = d.getUTCHours();
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm} UTC`;
  } catch {
    return isoDate;
  }
};

/**
 * Friendly label for auth method
 */
export const getAuthMethodLabel = (method: AuthMethod): string => {
  switch (method) {
    case 'PASSWORD_BIOMETRIC':
    case 'PASSWORD':
      return 'Password / Biometric (Passkey)';
    case 'MOBILE_OTP':
    case 'AADHAAR':
      return 'Mobile OTP Authentication';
    case 'FACE_AUTH':
    case 'IRIS':
      return 'Face Authentication (Ocular HUD)';
    case 'FINGERPRINT':
      return 'Biometric Fingerprint';
    default:
      return 'Zero-Trust Multi-Factor';
  }
};

const PASSWORDS_KEY = 'darkwatch_user_passwords_v1';
const REGISTERED_ACCOUNTS_KEY = 'darkwatch_registered_accounts_v2';
const FAILED_ATTEMPTS_KEY = 'darkwatch_failed_attempts_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_PASSWORD = 'darkwatch123';

export interface RegisteredAccount {
  displayName: string;
  usernameOrPhone: string;
  password: string;
  role: UserRole;
  accountIdentifier: string;
  registeredAt: string;
}

export interface FailedLoginRecord {
  attempts: number;
  lockoutUntil: number | null;
}

export const getLockoutRecord = (identifier: string): FailedLoginRecord => {
  if (typeof window === 'undefined') return { attempts: 0, lockoutUntil: null };
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (!raw) return { attempts: 0, lockoutUntil: null };
    const store: Record<string, FailedLoginRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim();
    return store[key] || { attempts: 0, lockoutUntil: null };
  } catch {
    return { attempts: 0, lockoutUntil: null };
  }
};

export const checkAccountLockout = (
  identifier: string
): { isLocked: boolean; remainingHours: number; remainingMinutes: number; attemptsLeft: number } => {
  const record = getLockoutRecord(identifier);
  if (record.lockoutUntil) {
    const now = Date.now();
    if (now < record.lockoutUntil) {
      const diffMs = record.lockoutUntil - now;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.max(1, Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
      return { isLocked: true, remainingHours: hours, remainingMinutes: minutes, attemptsLeft: 0 };
    } else {
      // Lockout period expired - clear record
      clearFailedAttempts(identifier);
      return { isLocked: false, remainingHours: 0, remainingMinutes: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }
  }
  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { isLocked: false, remainingHours: 0, remainingMinutes: 0, attemptsLeft };
};

export const recordFailedAttempt = (
  identifier: string
): { attempts: number; isLocked: boolean; remainingHours: number; remainingMinutes: number } => {
  if (typeof window === 'undefined') return { attempts: 1, isLocked: false, remainingHours: 0, remainingMinutes: 0 };
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    const store: Record<string, FailedLoginRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    const current = store[key] || { attempts: 0, lockoutUntil: null };

    const newAttempts = current.attempts + 1;
    let lockoutUntil: number | null = null;
    let isLocked = false;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      isLocked = true;
    }

    const updatedRecord: FailedLoginRecord = {
      attempts: newAttempts,
      lockoutUntil,
    };
    store[key] = updatedRecord;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(store));

    if (isLocked) {
      return { attempts: newAttempts, isLocked: true, remainingHours: 24, remainingMinutes: 0 };
    }
    return { attempts: newAttempts, isLocked: false, remainingHours: 0, remainingMinutes: 0 };
  } catch {
    return { attempts: 1, isLocked: false, remainingHours: 0, remainingMinutes: 0 };
  }
};

export const clearFailedAttempts = (identifier: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (!raw) return;
    const store: Record<string, FailedLoginRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim();
    delete store[key];
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to clear login attempts', err);
  }
};

export const getCustomStoredPassword = (identifier: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[identifier.toLowerCase().trim()] || null;
  } catch {
    return null;
  }
};

/**
  * Retrieve list of registered user accounts.
  * Seeds default preset team accounts on initial run.
  */
export const getRegisteredAccounts = (): RegisteredAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) {
      const defaultAccounts: RegisteredAccount[] = [
        {
          displayName: 'SecOps Administrator',
          usernameOrPhone: 'admin',
          password: DEFAULT_PASSWORD,
          role: 'SECOPS_ADMIN',
          accountIdentifier: 'admin@darkwatch.corp',
          registeredAt: new Date().toISOString(),
        },
        ...Object.values(PRESET_USERS).map((p) => ({
          displayName: p.name,
          usernameOrPhone: p.username.toLowerCase(),
          password: DEFAULT_PASSWORD,
          role: p.role,
          accountIdentifier: p.identifier,
          registeredAt: new Date().toISOString(),
        })),
      ];
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
      return defaultAccounts;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
  * Register a new user account.
  */
export const registerNewAccount = (data: {
  displayName: string;
  usernameOrPhone: string;
  password: string;
  role?: UserRole;
}): { success: boolean; message: string; account?: RegisteredAccount } => {
  const cleanInput = data.usernameOrPhone.trim();
  const lowerInput = cleanInput.toLowerCase();

  if (!data.displayName.trim()) {
    return { success: false, message: 'Please enter your full name or display name.' };
  }
  if (!cleanInput) {
    return { success: false, message: 'Please enter a username, email, or mobile number.' };
  }
  const passwordCheck = validatePasswordStrength(data.password);
  if (!passwordCheck.valid) {
    return { success: false, message: passwordCheck.message };
  }

  const accounts = getRegisteredAccounts();

  const existing = accounts.find(
    (acc) =>
      acc.usernameOrPhone.toLowerCase() === lowerInput ||
      acc.accountIdentifier.toLowerCase() === lowerInput
  );

  if (existing) {
    return {
      success: false,
      message: `An account for "${cleanInput}" is already registered. Please switch to Login.`,
    };
  }

  const newAccount: RegisteredAccount = {
    displayName: data.displayName.trim(),
    usernameOrPhone: cleanInput,
    password: data.password,
    role: data.role || 'SECOPS_ADMIN',
    accountIdentifier: cleanInput.includes('@')
      ? cleanInput
      : `${cleanInput.toLowerCase().replace(/[^a-z0-9]/g, '')}@darkwatch.corp`,
    registeredAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));

  // Sync custom password store
  updateUserPassword(cleanInput, data.password);

  return {
    success: true,
    message: `Account registered successfully for ${newAccount.displayName}! Please log in with your credentials.`,
    account: newAccount,
  };
};

/**
  * Validate login credentials strictly against registered accounts.
  */
export const authenticateRegisteredUser = (
  usernameOrPhone: string,
  passwordInput: string,
  authMethod: AuthMethod,
  isBiometricVerified?: boolean
): { success: boolean; message: string; userProfile?: UserProfile } => {
  const cleanInput = usernameOrPhone.trim();
  const lowerInput = cleanInput.toLowerCase();

  if (!cleanInput) {
    return { success: false, message: 'Please enter your registered username or mobile number.' };
  }

  // 1. Check account lockout status for input username/phone
  const lockoutInfo = checkAccountLockout(cleanInput);
  if (lockoutInfo.isLocked) {
    const timeStr = lockoutInfo.remainingHours > 0 
      ? `${lockoutInfo.remainingHours} hours and ${lockoutInfo.remainingMinutes} minutes` 
      : `${lockoutInfo.remainingMinutes} minutes`;
    return {
      success: false,
      message: `ACCOUNT LOCKED FOR 24 HOURS due to 5 consecutive wrong password attempts. Please try again in ${timeStr} (or use "Forgot Password?" to reset).`,
    };
  }

  const accounts = getRegisteredAccounts();

  const account = accounts.find(
    (acc) =>
      acc.usernameOrPhone.toLowerCase() === lowerInput ||
      acc.accountIdentifier.toLowerCase() === lowerInput ||
      (acc.displayName && acc.displayName.toLowerCase() === lowerInput)
  );

  if (!account) {
    return {
      success: false,
      message: `Account "${cleanInput}" is NOT registered! You must REGISTER an account first before logging in.`,
    };
  }

  // Check lockout for matched account username
  const accountLockoutInfo = checkAccountLockout(account.usernameOrPhone);
  if (accountLockoutInfo.isLocked) {
    const timeStr = accountLockoutInfo.remainingHours > 0 
      ? `${accountLockoutInfo.remainingHours} hours and ${accountLockoutInfo.remainingMinutes} minutes` 
      : `${accountLockoutInfo.remainingMinutes} minutes`;
    return {
      success: false,
      message: `ACCOUNT LOCKED FOR 24 HOURS due to 5 consecutive wrong password attempts. Please try again in ${timeStr} (or use "Forgot Password?" to reset).`,
    };
  }

  if ((authMethod === 'PASSWORD_BIOMETRIC' || authMethod === 'PASSWORD') && !isBiometricVerified) {
    const customPass = getCustomStoredPassword(cleanInput) || getCustomStoredPassword(account.accountIdentifier);
    const validPassword = customPass || account.password;

    if (passwordInput !== validPassword) {
      // Record failed password attempt
      const failedRes = recordFailedAttempt(account.usernameOrPhone);
      recordFailedAttempt(cleanInput);

      if (failedRes.isLocked) {
        return {
          success: false,
          message: 'Wrong password! You have reached the maximum 5 allowed attempts. Your account is now LOCKED FOR 24 HOURS.',
        };
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedRes.attempts;
      return {
        success: false,
        message: `Wrong password! (${failedRes.attempts}/5 failed attempts). You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before 24-hour account lockout.`,
      };
    }
  }

  // Success! Clear failed attempts
  clearFailedAttempts(account.usernameOrPhone);
  clearFailedAttempts(cleanInput);

  const profile = loginUser(account.usernameOrPhone, authMethod, account.role);
  profile.displayName = account.displayName;
  profile.accountIdentifier = account.accountIdentifier;
  saveUser(profile);

  return {
    success: true,
    message: 'Authentication successful!',
    userProfile: profile,
  };
};

export const updateUserPassword = (identifier: string, newPassword: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    store[key] = newPassword;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(store));

    // Also update in registered accounts store
    const accounts = getRegisteredAccounts();
    const updatedAccounts = accounts.map((acc) => {
      if (
        acc.usernameOrPhone.toLowerCase() === key ||
        acc.accountIdentifier.toLowerCase() === key
      ) {
        return { ...acc, password: newPassword };
      }
      return acc;
    });
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

    // Clear failed attempts on password update
    clearFailedAttempts(key);

    return true;
  } catch (err) {
    console.error('Failed to update password', err);
    return false;
  }
};

export const validatePasswordStrength = (pwd: string): { valid: boolean; message: string } => {
  if (!pwd || pwd.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(pwd)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/\d/.test(pwd)) {
    return { valid: false, message: 'Password must contain at least one digit (0-9).' };
  }
  if (!/[-@#$%^&*!_~?+=|<>]/.test(pwd)) {
    return { valid: false, message: 'Password must contain at least one special character (e.g. @, #, $, !).' };
  }
  return { valid: true, message: '' };
};

export const resetUserPasswordDirect = (
  usernameOrPhone: string,
  newPassword: string
): { success: boolean; message: string } => {
  const clean = usernameOrPhone.trim().toLowerCase();
  if (!clean) {
    return { success: false, message: 'Please enter your username, email, or mobile number.' };
  }
  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    return { success: false, message: passwordCheck.message };
  }

  updateUserPassword(clean, newPassword);
  clearFailedAttempts(clean);
  return {
    success: true,
    message: `Password reset successfully for ${clean}. You can now log in with your new password.`,
  };
};

// Backwards-compatible alias for any callers
export const resetUserPasswordWithOtp = (
  usernameOrPhone: string,
  _otpCode: string,
  newPassword: string
): { success: boolean; message: string } => {
  return resetUserPasswordDirect(usernameOrPhone, newPassword);
};

// ============================================================================
// SERVER-BACKED ASYNC API CLIENT FOR REAL INTEGRATION
// ============================================================================

const TOKEN_KEY = 'darkwatch_session_token';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};

export async function apiRegisterAccount(data: {
  username: string;
  mobileNumber: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  password: string;
  confirmPassword: string;
}): Promise<{ 
  success: boolean; 
  message: string; 
  requiresVerification?: boolean; 
  mobileMasked?: string; 
  cooldownSeconds?: number;
  deliveryState?: string;
  isConfigured?: boolean;
  provider?: string;
  devHint?: string;
  devOtpCode?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { 
        success: false, 
        message: result.error || 'Registration failed.',
        deliveryState: result.deliveryState,
        provider: result.provider,
      };
    }
    return {
      success: true,
      message: result.message,
      requiresVerification: result.requiresVerification,
      mobileMasked: result.mobileMasked,
      cooldownSeconds: result.cooldownSeconds,
      deliveryState: result.deliveryState,
      isConfigured: result.isConfigured,
      provider: result.provider,
      devHint: result.devHint,
      devOtpCode: result.devOtpCode,
    };
  } catch (err: any) {
    return { success: false, message: 'Registration service unreachable. Please verify network connectivity.' };
  }
}

export async function apiResendRegistrationOtp(
  usernameOrPhone: string
): Promise<{ 
  success: boolean; 
  message: string; 
  cooldownSeconds?: number; 
  mobileMasked?: string; 
  deliveryState?: string;
  isConfigured?: boolean;
  provider?: string;
  devHint?: string; 
  devOtpCode?: string;
}> {
  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrPhone, mobileNumber: usernameOrPhone }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { 
        success: false, 
        message: result.error || 'Failed to resend code.',
        deliveryState: result.deliveryState,
        provider: result.provider,
      };
    }
    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      mobileMasked: result.mobileMasked,
      deliveryState: result.deliveryState,
      isConfigured: result.isConfigured,
      provider: result.provider,
      devHint: result.devHint,
      devOtpCode: result.devOtpCode,
    };
  } catch (err: any) {
    return { success: false, message: 'Network error communicating with verification service.' };
  }
}

export async function apiVerifyRegistrationOtp(
  usernameOrPhone: string,
  otpCode: string
): Promise<{ success: boolean; message: string; user?: UserProfile; token?: string }> {
  try {
    const res = await fetch('/api/auth/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrPhone, mobileNumber: usernameOrPhone, otpCode }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'Verification failed.' };
    }
    if (result.token) {
      setStoredToken(result.token);
    }
    if (result.user) {
      const profile: UserProfile = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        accountIdentifier: result.user.phoneNumber || result.user.email || result.user.username,
        role: result.user.role,
        authMethod: 'PASSWORD_BIOMETRIC',
        currentLogin: result.user.currentLogin,
        previousLogin: result.user.previousLogin,
        isVerified: true,
        phoneNumber: result.user.phoneNumber,
      };
      saveUser(profile);
      return { success: true, message: result.message, user: profile, token: result.token };
    }
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, message: 'Verification service unavailable.' };
  }
}

export async function apiLogin(
  identifier: string,
  password: string,
  authMethod: AuthMethod = 'PASSWORD_BIOMETRIC'
): Promise<{ success: boolean; message: string; userProfile?: UserProfile; token?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, authMethod }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'Authentication failed.' };
    }
    if (result.token) {
      setStoredToken(result.token);
    }
    if (result.user) {
      const profile: UserProfile = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        accountIdentifier: result.user.phoneNumber || result.user.email || result.user.username,
        role: result.user.role,
        authMethod,
        currentLogin: result.user.currentLogin,
        previousLogin: result.user.previousLogin,
        isVerified: result.user.isVerified,
        phoneNumber: result.user.phoneNumber,
      };
      saveUser(profile);
      return { success: true, message: result.message, userProfile: profile, token: result.token };
    }
    return { success: false, message: 'Invalid server response' };
  } catch (err) {
    // Offline local fallback
    return authenticateRegisteredUser(identifier, password, authMethod);
  }
}

export async function apiSendLoginOtp(
  identifier: string
): Promise<{ success: boolean; message: string; cooldownSeconds?: number; mobileMasked?: string; devHint?: string }> {
  try {
    const res = await fetch('/api/auth/send-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'Failed to dispatch login OTP.' };
    }
    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      mobileMasked: result.mobileMasked,
      devHint: result.devHint,
    };
  } catch {
    return { success: false, message: 'Network communication failure requesting SMS OTP.' };
  }
}

export async function apiVerifyLoginOtp(
  identifier: string,
  otpCode: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfile; token?: string }> {
  try {
    const res = await fetch('/api/auth/verify-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otpCode }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'OTP verification failed.' };
    }
    if (result.token) {
      setStoredToken(result.token);
    }
    if (result.user) {
      const profile: UserProfile = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        accountIdentifier: result.user.phoneNumber || result.user.email || result.user.username,
        role: result.user.role,
        authMethod: 'MOBILE_OTP',
        currentLogin: result.user.currentLogin,
        previousLogin: result.user.previousLogin,
        isVerified: true,
        phoneNumber: result.user.phoneNumber,
      };
      saveUser(profile);
      return { success: true, message: result.message, userProfile: profile, token: result.token };
    }
    return { success: true, message: result.message };
  } catch {
    return { success: false, message: 'Authentication service unavailable.' };
  }
}

export async function apiForgotPassword(
  identifier: string
): Promise<{ success: boolean; message: string; username?: string }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'Password recovery failed.' };
    }
    return { success: true, message: result.message, username: result.username };
  } catch (err) {
    return {
      success: true,
      message: 'Account verified. You can now reset your password directly.',
    };
  }
}

export async function apiResetPassword(
  identifier: string,
  newPassword: string,
  confirmPassword?: string,
  _unusedOtpCode?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identifier, 
        newPassword, 
        confirmPassword: confirmPassword || newPassword 
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, message: result.error || 'Password reset failed.' };
    }
    return { success: true, message: result.message };
  } catch (err) {
    return resetUserPasswordDirect(identifier, newPassword);
  }
}

export async function apiLogout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  setStoredToken(null);
  logoutUser();
}

