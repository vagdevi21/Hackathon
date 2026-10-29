/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Authenticity, Scam & Threat Verification Center Types
 * Shared models for URL, Phone (+91 first), and Document/Exam Paper verification.
 */

export type SharedClassification =
  | 'VALID_INPUT'
  | 'AUTHENTICITY_VERIFIED'
  | 'SUSPICIOUS'
  | 'MALICIOUS_FRAUD_CONFIRMED'
  | 'UNVERIFIED'
  | 'CHECK_UNAVAILABLE';

export type PhoneRiskStatus =
  | 'INVALID NUMBER FORMAT'
  | 'SUSPICIOUS NUMBER PATTERN'
  | 'SPAM REPORTS FOUND'
  | 'SCAM RISK INDICATORS FOUND'
  | 'LOW REPORTED RISK — LIMITED EVIDENCE'
  | 'NO KNOWN REPORTS FOUND IN CHECKED SOURCES'
  | 'NUMBER FORMAT VALID — ASSIGNMENT UNVERIFIED'
  | 'UNVERIFIED'
  | 'CHECK UNAVAILABLE';

export type DocumentVerificationStatus =
  | 'OFFICIALLY VERIFIED'
  | 'SUSPICIOUS — REVIEW REQUIRED'
  | 'CONFIRMED MISMATCH'
  | 'SAMPLE / PRACTICE DOCUMENT'
  | 'UNVERIFIED'
  | 'CHECK UNAVAILABLE';

export interface VerificationEvidenceItem {
  id: string;
  name: string;
  category: 'FORMAT' | 'PATTERN' | 'REPUTATION' | 'INTEGRITY' | 'DOCUMENT_METADATA' | 'PROVIDER';
  status: 'PASSED' | 'FLAGGED' | 'WARNING' | 'UNAVAILABLE';
  detail: string;
  sourceChecked: string;
  timestamp: string;
}

export interface PhoneVerificationResult {
  rawInput: string;
  maskedNumber: string;
  countryCode: string;
  countryName: string;
  nationalNumber: string;
  e164Format: string | null;
  isValidFormat: boolean;
  numberingPlan: string;
  lineTypeDetected: string;
  suspiciousPatterns: string[];
  reputationStatus: PhoneRiskStatus;
  sharedClassification: SharedClassification;
  riskScore: number | null; // 0-100 or null if unverified
  explanation: string;
  sourcesChecked: string[];
  evidence: VerificationEvidenceItem[];
  limitations: string[];
  safetyRecommendations: string[];
  checkedAt: string;
  providerStatus: {
    name: string;
    configured: boolean;
    responseStatus: 'SUCCESS' | 'NOT_CONFIGURED' | 'TIMEOUT' | 'ERROR';
  };
}

export interface UrlVerificationResult {
  inputUrl: string;
  normalizedUrl: string | null;
  protocol: string | null;
  hostname: string | null;
  domain: string | null;
  isValidSyntax: boolean;
  isSsrfBlocked: boolean;
  ssrfBlockReason?: string;
  punycodeOrLookalike: boolean;
  suspiciousIndicators: string[];
  sharedClassification: SharedClassification;
  riskScore: number | null;
  explanation: string;
  sourcesChecked: string[];
  evidence: VerificationEvidenceItem[];
  limitations: string[];
  recommendations: string[];
  checkedAt: string;
  providerStatus: {
    name: string;
    configured: boolean;
    responseStatus: 'SUCCESS' | 'NOT_CONFIGURED' | 'TIMEOUT' | 'ERROR';
  };
}

export interface DocumentVerificationResult {
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
  sha256Hash: string;
  isValidFormat: boolean;
  detectedType: 'EXAM_PAPER' | 'CERTIFICATE' | 'OFFICIAL_ORDER' | 'UNKNOWN';
  isSampleOrPractice: boolean;
  sampleIndicators: string[];
  extractedMetadata: {
    title?: string;
    issuingOrganization?: string;
    examCodeOrId?: string;
    issueDate?: string;
    hasWatermarkOrSeal?: boolean;
    hasDigitalSignature?: boolean;
  };
  inconsistenciesFound: string[];
  verificationStatus: DocumentVerificationStatus;
  sharedClassification: SharedClassification;
  explanation: string;
  sourcesChecked: string[];
  evidence: VerificationEvidenceItem[];
  limitations: string[];
  recommendations: string[];
  checkedAt: string;
}
