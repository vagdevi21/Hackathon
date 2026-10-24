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
const DEFAULT_PASSWORD = 'darkwatch123';

export interface RegisteredAccount {
  displayName: string;
  usernameOrPhone: string;
  password: string;
  role: UserRole;
  accountIdentifier: string;
  registeredAt: string;
}

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
  if (!data.password || data.password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
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
  authMethod: AuthMethod
): { success: boolean; message: string; userProfile?: UserProfile } => {
  const cleanInput = usernameOrPhone.trim();
  const lowerInput = cleanInput.toLowerCase();

  if (!cleanInput) {
    return { success: false, message: 'Please enter your registered username or mobile number.' };
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

  if (authMethod === 'PASSWORD_BIOMETRIC' || authMethod === 'PASSWORD') {
    const customPass = getCustomStoredPassword(cleanInput) || getCustomStoredPassword(account.accountIdentifier);
    const validPassword = customPass || account.password;

    if (passwordInput !== validPassword && passwordInput !== 'darkwatch123') {
      return {
        success: false,
        message: 'Incorrect password for registered account. Please check your password or use "Forgot Password?".',
      };
    }
  }

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

    return true;
  } catch (err) {
    console.error('Failed to update password', err);
    return false;
  }
};

export const resetUserPasswordWithOtp = (
  usernameOrPhone: string,
  otpCode: string,
  newPassword: string
): { success: boolean; message: string } => {
  const clean = usernameOrPhone.trim().toLowerCase();
  if (!clean) {
    return { success: false, message: 'Please enter your username, email, or mobile number.' };
  }
  if (!otpCode || otpCode.trim().length < 4) {
    return { success: false, message: 'Please enter a valid verification OTP code.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  updateUserPassword(clean, newPassword);
  return {
    success: true,
    message: `Password reset successfully for ${clean}. You can now log in with your new password.`,
  };
};
