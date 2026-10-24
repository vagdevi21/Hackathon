/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Multi-Factor Authentication & Identity Store
 * Supports: Aadhaar UIDAI, Biometric Fingerprint, Iris / Facial Recognition, Password
 */

import { UserRole } from './security-engine';

export type AuthMethod = 'AADHAAR' | 'FINGERPRINT' | 'IRIS' | 'PASSWORD';

export interface UserProfile {
  id: string;
  username: string;
  aadhaarNumber?: string;
  displayName: string;
  role: UserRole;
  authMethod: AuthMethod;
  lastLogin: string;
  biometricToken?: string;
  irisConfidence?: number;
  uidaiVerified?: boolean;
}

const STORAGE_KEY = 'darkwatch_auth_profile';

export const DEFAULT_USER: UserProfile = {
  id: 'USR-8921',
  username: 'Vagdevi (Team Synora)',
  aadhaarNumber: '7842 9012 3456',
  displayName: 'Vagdevi',
  role: 'SECOPS_ADMIN',
  authMethod: 'AADHAAR',
  lastLogin: new Date().toISOString(),
  uidaiVerified: true,
};

export const getStoredUser = (): UserProfile => {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
};

export const saveUser = (user: UserProfile): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('darkwatch_auth_updated', { detail: user }));
  } catch (err) {
    console.error('Failed to save auth profile', err);
  }
};

export const logoutUser = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('darkwatch_auth_updated', { detail: null }));
  } catch (err) {
    console.error('Failed to logout', err);
  }
};
