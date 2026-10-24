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
