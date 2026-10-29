/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Phone Number Verification Service (India +91 First)
 * Validates formatting, analyzes suspicious digit patterns, masks digits for privacy,
 * and assesses reputation via configured provider or honest UNVERIFIED indicators.
 */

import { PhoneVerificationResult, PhoneRiskStatus, SharedClassification, VerificationEvidenceItem } from './types';

export interface PhoneReputationProvider {
  name: string;
  isConfigured: () => boolean;
  lookup: (e164Number: string) => Promise<{
    status: 'SUCCESS' | 'TIMEOUT' | 'ERROR';
    spamScore?: number;
    scamReports?: number;
    carrier?: string;
    lineType?: string;
    errorDetail?: string;
  }>;
}

// Privacy masking helper: masks intermediate digits, keeping country code & first 2 and last 3 digits
export function maskPhoneNumber(phoneNumber: string): string {
  const clean = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  if (clean.length < 7) {
    return clean.replace(/.(?=.{2})/g, '*');
  }
  const prefix = clean.slice(0, Math.min(5, Math.floor(clean.length / 2) - 1));
  const suffix = clean.slice(-3);
  const maskedMiddle = '*'.repeat(Math.max(3, clean.length - prefix.length - suffix.length));
  return `${prefix}${maskedMiddle}${suffix}`;
}

// Suspicious patterns detector
export function detectSuspiciousPatterns(digits: string): string[] {
  const patterns: string[] = [];

  // All identical digits
  if (/^(\d)\1+$/.test(digits)) {
    patterns.push(`Repeated identical digits pattern (${digits.slice(0, 1)} repeated ${digits.length} times)`);
  }

  // 6 or more consecutive identical digits
  if (/(\d)\1{5,}/.test(digits)) {
    patterns.push('High digit repetition: 6+ identical consecutive numbers detected');
  }

  // Sequential digits (ascending)
  const isAscending = (s: string) => {
    for (let i = 0; i < s.length - 1; i++) {
      if ((parseInt(s[i]) + 1) % 10 !== parseInt(s[i + 1])) return false;
    }
    return true;
  };

  // Sequential digits (descending)
  const isDescending = (s: string) => {
    for (let i = 0; i < s.length - 1; i++) {
      if ((parseInt(s[i]) - 1 + 10) % 10 !== parseInt(s[i + 1])) return false;
    }
    return true;
  };

  if (digits.length >= 8 && (isAscending(digits) || isDescending(digits))) {
    patterns.push(`Sequential algorithmic digit progression detected (${isAscending(digits) ? 'Ascending' : 'Descending'})`);
  }

  // Known test/placeholder sequences
  const knownPlaceholders = [
    '0000000000',
    '1234567890',
    '9876543210',
    '1111111111',
    '9999999999',
    '8888888888',
    '0123456789',
    '5550199',
  ];
  if (knownPlaceholders.some((ph) => digits.includes(ph))) {
    patterns.push('Matches recognized test/placeholder synthetic number sequence');
  }

  return patterns;
}

// Default provider adapter checking environment configuration
export const defaultProvider: PhoneReputationProvider = {
  name: 'Telecom Intelligence Provider Adapter',
  isConfigured: () => {
    return Boolean(process.env.PHONE_REPUTATION_API_KEY || process.env.NUMVERIFY_API_KEY);
  },
  lookup: async (e164Number: string) => {
    const key = process.env.PHONE_REPUTATION_API_KEY || process.env.NUMVERIFY_API_KEY;
    if (!key) {
      return { status: 'ERROR', errorDetail: 'No provider credentials configured in environment variables' };
    }
    // Real provider network fetch with safe 4-second timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://api.reputation-service.internal/v1/lookup?number=${encodeURIComponent(e164Number)}`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        return { status: 'ERROR', errorDetail: `Provider returned HTTP ${res.status}` };
      }
      const data = await res.json();
      return {
        status: 'SUCCESS',
        spamScore: data.spamScore,
        scamReports: data.scamReports,
        carrier: data.carrier,
        lineType: data.lineType,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { status: 'TIMEOUT', errorDetail: 'Provider request timed out after 4000ms' };
      }
      return { status: 'ERROR', errorDetail: err.message || 'Network request failed' };
    }
  },
};

export async function verifyPhoneNumber(
  input: string,
  selectedCountry: string = '+91',
  customProvider?: PhoneReputationProvider
): Promise<PhoneVerificationResult> {
  const now = new Date().toISOString();
  const trimmed = (input || '').trim();
  const provider = customProvider || defaultProvider;

  // Extract digits
  let digitsOnly = trimmed.replace(/\D/g, '');
  let countryCode = selectedCountry.startsWith('+') ? selectedCountry : `+${selectedCountry}`;
  let nationalDigits = digitsOnly;

  // If user entered + in input, parse country code from input
  if (trimmed.startsWith('+')) {
    if (trimmed.startsWith('+91')) {
      countryCode = '+91';
      nationalDigits = digitsOnly.slice(2);
    } else if (trimmed.startsWith('+1')) {
      countryCode = '+1';
      nationalDigits = digitsOnly.slice(1);
    } else if (trimmed.startsWith('+44')) {
      countryCode = '+44';
      nationalDigits = digitsOnly.slice(2);
    } else {
      // General match
      countryCode = `+${digitsOnly.slice(0, 2)}`;
      nationalDigits = digitsOnly.slice(2);
    }
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    countryCode = '+91';
    nationalDigits = digitsOnly.slice(2);
  }

  // Country Name determination
  const countryName = countryCode === '+91' ? 'India' : countryCode === '+1' ? 'United States / Canada' : countryCode === '+44' ? 'United Kingdom' : 'International';

  // Format validation
  let isValidFormat = false;
  let numberingPlan = 'Unknown Numbering Plan';
  let lineTypeDetected = 'Unverified Line Type';
  const evidence: VerificationEvidenceItem[] = [];

  if (countryCode === '+91') {
    // Indian Numbering Plan (DoT & TRAI guidelines)
    // Mobile: 10 digits starting with 6, 7, 8, 9
    // Toll-free: 1800 / 1860 followed by 6 or 7 digits
    // Landline: 2-4 digit STD code + 6-8 digit subscriber (total 10 digits)
    if (nationalDigits.length === 10) {
      const firstDigit = nationalDigits[0];
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        isValidFormat = true;
        numberingPlan = 'DoT National Numbering Plan (India 10-Digit Mobile)';
        lineTypeDetected = 'Mobile Wireless / Cellular Allocation';
        evidence.push({
          id: 'ev-dot-format',
          name: 'DoT Indian Mobile Allocation Scheme',
          category: 'FORMAT',
          status: 'PASSED',
          detail: `Valid 10-digit mobile series beginning with allocation prefix '${firstDigit}'`,
          sourceChecked: 'TRAI / Department of Telecommunications National Numbering Plan',
          timestamp: now,
        });
      } else if (['1', '2', '3', '4', '5'].includes(firstDigit)) {
        // Indian landline or reserved range
        if (['2', '3', '4'].includes(firstDigit)) {
          isValidFormat = true;
          numberingPlan = 'DoT Fixed Landline / Wireline STD';
          lineTypeDetected = 'Fixed Landline Wireline';
          evidence.push({
            id: 'ev-dot-landline',
            name: 'DoT Fixed Landline Allocation',
            category: 'FORMAT',
            status: 'PASSED',
            detail: `Valid 10-digit fixed line series beginning with STD trunk digit '${firstDigit}'`,
            sourceChecked: 'TRAI National Numbering Plan',
            timestamp: now,
          });
        } else {
          isValidFormat = false;
          numberingPlan = 'Invalid Indian Mobile/Landline Prefix';
          evidence.push({
            id: 'ev-dot-invalid-prefix',
            name: 'Invalid Indian Numbering Prefix',
            category: 'FORMAT',
            status: 'FLAGGED',
            detail: `Indian mobile lines must begin with 6, 7, 8, or 9. Prefix '${firstDigit}' is reserved or unallocated.`,
            sourceChecked: 'TRAI National Numbering Plan',
            timestamp: now,
          });
        }
      } else {
        isValidFormat = false;
      }
    } else if (nationalDigits.length === 11 && nationalDigits.startsWith('0')) {
      // User dialed leading STD 0
      const actualDigits = nationalDigits.slice(1);
      if (['6', '7', '8', '9'].includes(actualDigits[0])) {
        isValidFormat = true;
        nationalDigits = actualDigits;
        numberingPlan = 'DoT National Numbering Plan (Normalized from leading 0)';
        lineTypeDetected = 'Mobile Wireless / Cellular Allocation';
        evidence.push({
          id: 'ev-dot-lead0',
          name: 'Normalized Leading 0 Trunk Prefix',
          category: 'FORMAT',
          status: 'PASSED',
          detail: 'Normalized 11-digit dialed number (0XXXXXXXXXX) to 10-digit E.164 subscriber format',
          sourceChecked: 'DoT National Numbering Plan',
          timestamp: now,
        });
      }
    } else {
      isValidFormat = false;
      evidence.push({
        id: 'ev-dot-len-fail',
        name: 'Number Length Validation',
        category: 'FORMAT',
        status: 'FLAGGED',
        detail: `Expected 10 digits for Indian standard numbering, received ${nationalDigits.length} digits`,
        sourceChecked: 'TRAI National Numbering Plan',
        timestamp: now,
      });
    }
  } else {
    // Generic international format (E.164 min 7, max 15 digits)
    if (nationalDigits.length >= 7 && nationalDigits.length <= 15) {
      isValidFormat = true;
      numberingPlan = `International Numbering Plan (${countryName})`;
      lineTypeDetected = 'International Telecom Allocation';
      evidence.push({
        id: 'ev-intl-format',
        name: 'ITU-T E.164 Format Compliance',
        category: 'FORMAT',
        status: 'PASSED',
        detail: `Valid international digit length (${nationalDigits.length} digits) under ITU-T E.164`,
        sourceChecked: 'ITU-T Recommendation E.164',
        timestamp: now,
      });
    } else {
      isValidFormat = false;
      evidence.push({
        id: 'ev-intl-len-fail',
        name: 'ITU-T E.164 Length Validation',
        category: 'FORMAT',
        status: 'FLAGGED',
        detail: `Length ${nationalDigits.length} out of standard ITU-T E.164 range (7 to 15 digits)`,
        sourceChecked: 'ITU-T Recommendation E.164',
        timestamp: now,
      });
    }
  }

  // Suspicious pattern analysis
  const suspiciousPatterns = detectSuspiciousPatterns(nationalDigits);
  if (suspiciousPatterns.length > 0) {
    suspiciousPatterns.forEach((p, idx) => {
      evidence.push({
        id: `ev-pat-${idx}`,
        name: 'Suspicious Number Pattern Rule',
        category: 'PATTERN',
        status: 'FLAGGED',
        detail: p,
        sourceChecked: 'DarkWatch Algorithmic Pattern Analyzer',
        timestamp: now,
      });
    });
  }

  // E.164 representation
  const e164 = isValidFormat ? `${countryCode}${nationalDigits}` : null;
  const maskedNumber = maskPhoneNumber(`${countryCode} ${nationalDigits}`);

  // Provider lookup and reputation status determination
  const isProviderConfigured = provider.isConfigured();
  let providerResponseStatus: 'SUCCESS' | 'NOT_CONFIGURED' | 'TIMEOUT' | 'ERROR' = isProviderConfigured ? 'SUCCESS' : 'NOT_CONFIGURED';
  let reputationStatus: PhoneRiskStatus = 'UNVERIFIED';
  let sharedClassification: SharedClassification = 'UNVERIFIED';
  let riskScore: number | null = null;
  let explanation = '';
  const sourcesChecked: string[] = ['DoT / ITU-T Numbering Plan Schema', 'DarkWatch Heuristic Pattern Engine'];
  const limitations: string[] = [
    'A valid number format does not confirm subscriber identity, active assignment, or caller safety.',
    'Caller ID can be spoofed by VoIP operators and illicit gateways.',
  ];

  if (!isValidFormat) {
    reputationStatus = 'INVALID NUMBER FORMAT';
    sharedClassification = 'SUSPICIOUS';
    riskScore = null;
    explanation = `The submitted phone number does not conform to the recognized ${countryName} numbering plan format.`;
  } else if (suspiciousPatterns.length > 0) {
    reputationStatus = 'SUSPICIOUS NUMBER PATTERN';
    sharedClassification = 'SUSPICIOUS';
    riskScore = 55;
    explanation = `The phone number format is structurally valid, but contains a known suspicious pattern (${suspiciousPatterns[0]}). Requires analyst scrutiny before trusting caller claims.`;
  } else if (!isProviderConfigured) {
    // Honest unverified status when external provider is not configured
    reputationStatus = 'NUMBER FORMAT VALID — ASSIGNMENT UNVERIFIED';
    sharedClassification = 'VALID_INPUT';
    riskScore = null;
    explanation = `The phone number adheres to the official ${countryName} numbering plan format. However, external real-time telecom subscriber and spam reputation verification is UNVERIFIED because no third-party caller-id provider is currently configured.`;
    limitations.push('Spam/Scam reputation status is CHECK UNAVAILABLE due to unconfigured external provider credentials.');
    evidence.push({
      id: 'ev-prov-unconfigured',
      name: 'External Spam/Scam Database Check',
      category: 'PROVIDER',
      status: 'UNAVAILABLE',
      detail: 'External live telecom reputation provider not configured in environment variables. Number format is structurally valid.',
      sourceChecked: provider.name,
      timestamp: now,
    });
  } else {
    // External provider is configured: execute lookup
    sourcesChecked.push(provider.name);
    try {
      const lookupResult = await provider.lookup(e164!);
      providerResponseStatus = lookupResult.status;

      if (lookupResult.status === 'TIMEOUT') {
        reputationStatus = 'CHECK UNAVAILABLE';
        sharedClassification = 'CHECK_UNAVAILABLE';
        riskScore = null;
        explanation = 'The configured phone reputation provider request timed out. Please retry later.';
        evidence.push({
          id: 'ev-prov-timeout',
          name: `${provider.name} Request`,
          category: 'PROVIDER',
          status: 'UNAVAILABLE',
          detail: 'Lookup timed out before receiving upstream telecom response.',
          sourceChecked: provider.name,
          timestamp: now,
        });
      } else if (lookupResult.status === 'ERROR') {
        reputationStatus = 'CHECK UNAVAILABLE';
        sharedClassification = 'CHECK_UNAVAILABLE';
        riskScore = null;
        explanation = `The configured phone reputation provider encountered an error: ${lookupResult.errorDetail || 'Provider unavailable'}.`;
        evidence.push({
          id: 'ev-prov-err',
          name: `${provider.name} Error`,
          category: 'PROVIDER',
          status: 'UNAVAILABLE',
          detail: lookupResult.errorDetail || 'Provider error',
          sourceChecked: provider.name,
          timestamp: now,
        });
      } else {
        // SUCCESS from provider
        if (lookupResult.carrier) lineTypeDetected = `${lineTypeDetected} (${lookupResult.carrier})`;
        const spamScore = lookupResult.spamScore ?? 0;
        const scamReports = lookupResult.scamReports ?? 0;

        if (scamReports > 0 || spamScore >= 75) {
          reputationStatus = scamReports > 0 ? 'SCAM RISK INDICATORS FOUND' : 'SPAM REPORTS FOUND';
          sharedClassification = 'MALICIOUS_FRAUD_CONFIRMED';
          riskScore = Math.max(78, spamScore);
          explanation = `Known reports found in checked databases: ${scamReports} confirmed scam complaints, spam risk score ${spamScore}/100.`;
          evidence.push({
            id: 'ev-prov-threat',
            name: 'Provider Reputation Threat Match',
            category: 'REPUTATION',
            status: 'FLAGGED',
            detail: `${scamReports} scam complaints registered against this caller ID in threat feeds.`,
            sourceChecked: provider.name,
            timestamp: now,
          });
        } else if (spamScore >= 35) {
          reputationStatus = 'SPAM REPORTS FOUND';
          sharedClassification = 'SUSPICIOUS';
          riskScore = spamScore;
          explanation = `Elevated unwanted robocall / telemarketing activity reported (${spamScore}/100).`;
          evidence.push({
            id: 'ev-prov-spam',
            name: 'Telemarketing / Robocall Flag',
            category: 'REPUTATION',
            status: 'WARNING',
            detail: `Elevated spam frequency (${spamScore}/100).`,
            sourceChecked: provider.name,
            timestamp: now,
          });
        } else {
          reputationStatus = 'NO KNOWN REPORTS FOUND IN CHECKED SOURCES';
          sharedClassification = 'AUTHENTICITY_VERIFIED';
          riskScore = 12;
          explanation = `Checked in ${provider.name}. No active spam reports or fraud complaints registered.`;
          evidence.push({
            id: 'ev-prov-clean',
            name: 'Clean Reputation Query',
            category: 'REPUTATION',
            status: 'PASSED',
            detail: 'Zero spam or fraud reports in verified telecom directory.',
            sourceChecked: provider.name,
            timestamp: now,
          });
        }
      }
    } catch (err: any) {
      providerResponseStatus = 'ERROR';
      reputationStatus = 'CHECK UNAVAILABLE';
      sharedClassification = 'CHECK_UNAVAILABLE';
      explanation = `Provider check failure: ${err.message || 'Unknown error'}`;
    }
  }

  const safetyRecommendations = [
    'Do NOT share OTPs, PINs, passwords, Aadhaar details, or banking information over incoming calls.',
    'Beware of urgency: Government agencies, police, power departments, and banks never demand immediate money transfers over phone calls.',
    'If the caller claims to represent an institution, disconnect and call the verified number published on the official organization website.',
  ];

  return {
    rawInput: trimmed,
    maskedNumber,
    countryCode,
    countryName,
    nationalNumber: nationalDigits,
    e164Format: e164,
    isValidFormat,
    numberingPlan,
    lineTypeDetected,
    suspiciousPatterns,
    reputationStatus,
    sharedClassification,
    riskScore,
    explanation,
    sourcesChecked,
    evidence,
    limitations,
    safetyRecommendations,
    checkedAt: now,
    providerStatus: {
      name: provider.name,
      configured: isProviderConfigured,
      responseStatus: providerResponseStatus,
    },
  };
}
