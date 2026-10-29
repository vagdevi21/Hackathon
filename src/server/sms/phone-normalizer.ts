/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Phone Number Normalization & Validation (India +91 First)
 * Standardizes inputs to E.164, enforces National Numbering Plan rules,
 * flags repetitive synthetic patterns, and formats for secure display.
 */

export interface NormalizedPhoneResult {
  valid: boolean;
  e164?: string;
  countryCode?: string;
  nationalNumber?: string;
  error?: string;
  isIndian?: boolean;
}

/**
 * Normalizes user-entered mobile number to E.164 format.
 * Defaults to India (+91) if no country code is specified.
 */
export function normalizeRegistrationPhone(
  input: string,
  defaultCountryCode = '+91'
): NormalizedPhoneResult {
  if (!input || !input.trim()) {
    return { valid: false, error: 'Mobile number is required for account verification.' };
  }

  const raw = input.trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (digitsOnly.length < 7) {
    return { valid: false, error: 'Mobile number is too short. Please provide a valid phone number.' };
  }

  let e164 = '';
  let countryCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;
  let nationalNumber = '';

  if (raw.startsWith('+')) {
    // Explicit international format entered by user
    if (raw.startsWith('+91')) {
      countryCode = '+91';
      nationalNumber = digitsOnly.slice(2);
      e164 = `+91${nationalNumber}`;
    } else {
      // Other international country codes (e.g. +1, +44, +61)
      e164 = `+${digitsOnly}`;
      countryCode = `+${digitsOnly.slice(0, digitsOnly.length - 10 || 1)}`;
      nationalNumber = digitsOnly.slice(countryCode.length - 1);
    }
  } else if (raw.startsWith('0') && digitsOnly.length === 11 && countryCode === '+91') {
    // Leading zero trunk prefix for India (e.g. 09876543210)
    nationalNumber = digitsOnly.slice(1);
    e164 = `+91${nationalNumber}`;
  } else if (digitsOnly.length === 10 && countryCode === '+91') {
    // Standard 10-digit Indian national number
    nationalNumber = digitsOnly;
    e164 = `+91${nationalNumber}`;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    // 91 prefix without plus sign
    nationalNumber = digitsOnly.slice(2);
    e164 = `+91${nationalNumber}`;
  } else {
    // Fallback for general numbers
    e164 = `+${digitsOnly}`;
    nationalNumber = digitsOnly;
  }

  const isIndian = e164.startsWith('+91');

  // Specific Indian National Numbering Plan checks
  if (isIndian) {
    if (nationalNumber.length !== 10) {
      return {
        valid: false,
        error: `Indian mobile number must be exactly 10 digits (received ${nationalNumber.length}).`,
      };
    }

    // Repetitive or dummy number validation
    // 1. All same digits (e.g. 9999999999, 0000000000, 7777777777)
    if (/^(\d)\1{9}$/.test(nationalNumber)) {
      return {
        valid: false,
        error: 'Invalid mobile number: repetitive identical digits pattern is rejected.',
      };
    }

    // 2. Sequential numbers (e.g. 1234567890, 0123456789)
    if (nationalNumber === '1234567890' || nationalNumber === '0123456789') {
      return {
        valid: false,
        error: 'Invalid mobile number: synthetic sequential test number pattern is rejected.',
      };
    }

    // 3. 7 or more consecutive repeated digits
    if (/(\d)\1{6,}/.test(nationalNumber)) {
      return {
        valid: false,
        error: 'Invalid mobile number: excessive consecutive identical digits detected.',
      };
    }

    const firstDigit = nationalNumber.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return {
        valid: false,
        error: `Indian mobile numbers must start with 6, 7, 8, or 9 as per TRAI/DoT numbering plan (received starting digit '${firstDigit}').`,
      };
    }
  } else {
    // International numbers
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return {
        valid: false,
        error: 'International mobile number must be between 8 and 15 digits according to ITU-T E.164.',
      };
    }
  }

  return {
    valid: true,
    e164,
    countryCode,
    nationalNumber,
    isIndian,
  };
}

/**
 * Masks intermediate phone digits for secure user privacy:
 * e.g. +919876543210 -> "+91 98*** **210"
 */
export function maskPhoneForDisplay(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!clean.startsWith('+')) {
    return clean.replace(/.(?=.{2})/g, '*');
  }

  if (clean.startsWith('+91') && clean.length === 13) {
    const nat = clean.slice(3); // 10 digits
    return `+91 ${nat.slice(0, 2)}*** **${nat.slice(-3)}`;
  }

  // General international masking
  const prefix = clean.slice(0, Math.min(5, Math.floor(clean.length / 2) - 1));
  const suffix = clean.slice(-3);
  const asterisks = '*'.repeat(Math.max(3, clean.length - prefix.length - suffix.length));
  return `${prefix}${asterisks}${suffix}`;
}
