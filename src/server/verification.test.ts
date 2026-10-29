/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Verification Center Test Suite (PASS 2 Verification)
 * Covers all 14 mandatory test cases:
 * 1. Invalid URL syntax
 * 2. Malicious URL returned by mocked threat intelligence provider
 * 3. Unknown URL without reputation data
 * 4. Invalid Indian phone number input
 * 5. Sequential or repeated-digit test number
 * 6. Structurally valid-looking Indian number whose assignment has not been verified
 * 7. Number with reputation reports from a mocked provider
 * 8. No configured phone-reputation provider
 * 9. Phone-reputation provider timeout
 * 10. Sample exam paper with no official source
 * 11. Document with a confirmed mismatch in an authoritative test fixture
 * 12. Missing or unavailable external verification service
 * 13. Readable error messages instead of [object Object]
 * 14. SSRF protection (Loopback & Cloud Metadata blocking)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPhoneNumber, PhoneReputationProvider } from './verification/phone-verifier.ts';
import { verifyUrl, UrlReputationProvider } from './verification/url-verifier.ts';
import { verifyDocument, AuthoritativeDocumentRecord } from './verification/document-verifier.ts';

// ============================================================================
// URL VERIFICATION TESTS (Scenarios 1, 2, 3, 14)
// ============================================================================

test('Scenario 1: Invalid URL syntax is caught and rejected', async () => {
  const res = await verifyUrl('ht tp://invalid url with spaces.com');
  assert.equal(res.isValidSyntax, false);
  assert.equal(res.sharedClassification, 'SUSPICIOUS');
  assert.match(res.explanation, /Invalid URL syntax/i);
  assert.equal(typeof res.explanation, 'string');
  assert.doesNotMatch(res.explanation, /\[object Object\]/);
});

test('Scenario 2: Malicious URL returned by mocked threat intelligence provider', async () => {
  const mockThreatProvider: UrlReputationProvider = {
    name: 'Mock VirusTotal Feed',
    isConfigured: () => true,
    lookup: async (url: string) => ({
      status: 'SUCCESS',
      isMalicious: true,
      threatType: 'Phishing Credential Harvester',
    }),
  };

  const res = await verifyUrl('https://suspicious-target-bank-login.com/login', mockThreatProvider);
  assert.equal(res.sharedClassification, 'MALICIOUS_FRAUD_CONFIRMED');
  assert.equal(res.riskScore, 95);
  assert.match(res.explanation, /flagged as malicious/i);
});

test('Scenario 3: Unknown URL without reputation data returns UNVERIFIED with valid syntax', async () => {
  const unconfiguredProvider: UrlReputationProvider = {
    name: 'Mock Empty Provider',
    isConfigured: () => false,
    lookup: async () => ({ status: 'ERROR' }),
  };

  const res = await verifyUrl('https://brand-new-startup-portfolio.org/about', unconfiguredProvider);
  assert.equal(res.isValidSyntax, true);
  assert.equal(res.sharedClassification, 'VALID_INPUT');
  assert.equal(res.riskScore, null); // Honest unrated
  assert.match(res.explanation, /UNVERIFIED/);
});

test('Scenario 14: SSRF protection blocks loopbacks, private IPs, and cloud metadata', async () => {
  // Test AWS/GCP instance metadata IP
  const metadataRes = await verifyUrl('http://169.254.169.254/latest/meta-data/');
  assert.equal(metadataRes.isSsrfBlocked, true);
  assert.equal(metadataRes.sharedClassification, 'SUSPICIOUS');
  assert.match(metadataRes.ssrfBlockReason!, /metadata/i);

  // Test local loopback IP
  const loopbackRes = await verifyUrl('http://127.0.0.1:8080/admin');
  assert.equal(loopbackRes.isSsrfBlocked, true);
  assert.match(loopbackRes.ssrfBlockReason!, /loopback/i);

  // Test localhost hostname
  const localhostRes = await verifyUrl('http://localhost:3000/api/keys');
  assert.equal(localhostRes.isSsrfBlocked, true);
});

// ============================================================================
// PHONE NUMBER VERIFICATION TESTS (Scenarios 4, 5, 6, 7, 8, 9)
// ============================================================================

test('Scenario 4: Invalid Indian phone-number input (invalid prefix or wrong length)', async () => {
  // Mobile starting with invalid digit '1'
  const res1 = await verifyPhoneNumber('1234567890', '+91');
  assert.equal(res1.isValidFormat, false);
  assert.equal(res1.reputationStatus, 'INVALID NUMBER FORMAT');

  // Too short
  const res2 = await verifyPhoneNumber('98765', '+91');
  assert.equal(res2.isValidFormat, false);
  assert.equal(res2.reputationStatus, 'INVALID NUMBER FORMAT');
});

test('Scenario 5: Sequential or repeated-digit test number produces SUSPICIOUS NUMBER PATTERN', async () => {
  // Sequential descending digits
  const seqRes = await verifyPhoneNumber('9876543210', '+91');
  assert.equal(seqRes.isValidFormat, true);
  assert.equal(seqRes.reputationStatus, 'SUSPICIOUS NUMBER PATTERN');
  assert.equal(seqRes.sharedClassification, 'SUSPICIOUS');
  assert.ok(seqRes.suspiciousPatterns.length > 0);

  // Repeated identical digits
  const repRes = await verifyPhoneNumber('9999999999', '+91');
  assert.equal(repRes.isValidFormat, true);
  assert.equal(repRes.reputationStatus, 'SUSPICIOUS NUMBER PATTERN');
  assert.ok(repRes.suspiciousPatterns.some((p) => p.includes('identical')));
});

test('Scenario 6: Structurally valid Indian number whose assignment has not been verified', async () => {
  const unconfiguredProvider: PhoneReputationProvider = {
    name: 'Unconfigured Provider',
    isConfigured: () => false,
    lookup: async () => ({ status: 'ERROR' }),
  };

  const res = await verifyPhoneNumber('9849012345', '+91', unconfiguredProvider);
  assert.equal(res.isValidFormat, true);
  assert.equal(res.reputationStatus, 'NUMBER FORMAT VALID — ASSIGNMENT UNVERIFIED');
  assert.equal(res.sharedClassification, 'VALID_INPUT');
  assert.equal(res.riskScore, null); // Unrated honesty
  assert.match(res.maskedNumber, /\*\*\*/); // Digits masked for privacy
});

test('Scenario 7: Number with reputation reports from a mocked provider', async () => {
  const mockSpamProvider: PhoneReputationProvider = {
    name: 'Mock TRAI / Telecom Feed',
    isConfigured: () => true,
    lookup: async (number: string) => ({
      status: 'SUCCESS',
      spamScore: 88,
      scamReports: 14,
      carrier: 'VoIP Pool',
      lineType: 'Virtual Cloud PBX',
    }),
  };

  const res = await verifyPhoneNumber('9123456789', '+91', mockSpamProvider);
  assert.equal(res.reputationStatus, 'SCAM RISK INDICATORS FOUND');
  assert.equal(res.sharedClassification, 'MALICIOUS_FRAUD_CONFIRMED');
  assert.equal(res.riskScore, 88);
  assert.match(res.explanation, /14 confirmed scam complaints/);
});

test('Scenario 8: No configured phone-reputation provider reports CHECK UNAVAILABLE for external checks', async () => {
  const noKeyProvider: PhoneReputationProvider = {
    name: 'Telecom Provider Adapter',
    isConfigured: () => false,
    lookup: async () => ({ status: 'ERROR' }),
  };

  const res = await verifyPhoneNumber('9811223344', '+91', noKeyProvider);
  assert.equal(res.providerStatus.configured, false);
  assert.equal(res.providerStatus.responseStatus, 'NOT_CONFIGURED');
  assert.ok(res.evidence.some((e) => e.status === 'UNAVAILABLE'));
});

test('Scenario 9: Phone-reputation provider timeout produces CHECK UNAVAILABLE', async () => {
  const timeoutProvider: PhoneReputationProvider = {
    name: 'Slow Provider',
    isConfigured: () => true,
    lookup: async () => ({
      status: 'TIMEOUT',
      errorDetail: 'Request timed out after 4000ms',
    }),
  };

  const res = await verifyPhoneNumber('9822334455', '+91', timeoutProvider);
  assert.equal(res.reputationStatus, 'CHECK UNAVAILABLE');
  assert.equal(res.sharedClassification, 'CHECK_UNAVAILABLE');
  assert.match(res.explanation, /timed out/i);
});

// ============================================================================
// DOCUMENT / EXAM PAPER VERIFICATION TESTS (Scenarios 10, 11, 12, 13)
// ============================================================================

test('Scenario 10: Sample exam paper with no official source classified as SAMPLE / PRACTICE DOCUMENT', async () => {
  // Valid PDF header "%PDF-"
  const pdfBuffer = Buffer.from('%PDF-1.4 sample exam content for mock preparation');
  const res = await verifyDocument({
    fileName: 'CBSE_Class10_Math_Sample_Question_Paper_2026.pdf',
    fileBuffer: pdfBuffer,
    mimeType: 'application/pdf',
    extractedTextHint: 'CBSE Class X Mathematics Model Question Paper for Practice Only',
  });

  assert.equal(res.isValidFormat, true);
  assert.equal(res.isSampleOrPractice, true);
  assert.equal(res.verificationStatus, 'SAMPLE / PRACTICE DOCUMENT');
  assert.equal(res.sharedClassification, 'VALID_INPUT');
  assert.match(res.explanation, /model exam paper or mock practice test/i);
});

test('Scenario 11: Document with confirmed mismatch in authoritative test fixture', async () => {
  // Altered content with valid PDF magic bytes
  const alteredBuffer = Buffer.from('%PDF-1.4 Altered Question 42 Content Leaked Version');
  
  const mockRegistry: AuthoritativeDocumentRecord[] = [
    {
      id: 'OFFICIAL-REC-1',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      title: 'State Public Service Commission Preliminary Exam 2026',
      issuingOrganization: 'State PSC',
      examCodeOrId: 'SPSC-PRE-2026',
      officialDate: '2026-05-15',
    },
  ];

  const res = await verifyDocument({
    fileName: 'SPSC_Prelims_Question_Paper.pdf',
    fileBuffer: alteredBuffer,
    mimeType: 'application/pdf',
    claimedExamId: 'SPSC-PRE-2026',
  }, mockRegistry);

  assert.equal(res.verificationStatus, 'CONFIRMED MISMATCH');
  assert.equal(res.sharedClassification, 'MALICIOUS_FRAUD_CONFIRMED');
  assert.match(res.explanation, /CONFIRMED MISMATCH/);
  assert.ok(res.inconsistenciesFound.length > 0);
});

test('Scenario 12: Missing or unavailable external verification service reports CHECK UNAVAILABLE', async () => {
  const dummyBuffer = Buffer.from('%PDF-1.5 General Document');
  const emptyRegistry: AuthoritativeDocumentRecord[] = [];

  const res = await verifyDocument({
    fileName: 'Unregistered_Doc.pdf',
    fileBuffer: dummyBuffer,
    mimeType: 'application/pdf',
  }, emptyRegistry);

  assert.equal(res.verificationStatus, 'CHECK UNAVAILABLE');
  assert.equal(res.sharedClassification, 'CHECK_UNAVAILABLE');
  assert.match(res.explanation, /unavailable/i);
});

test('Scenario 13: Readable human error messages without [object Object]', async () => {
  // Test invalid input to phone verifier
  const phoneRes = await verifyPhoneNumber('   ', '+91');
  assert.equal(typeof phoneRes.explanation, 'string');
  assert.doesNotMatch(phoneRes.explanation, /\[object Object\]/);

  // Test invalid input to URL verifier
  const urlRes = await verifyUrl('javascript:alert(1)');
  assert.equal(typeof urlRes.explanation, 'string');
  assert.doesNotMatch(urlRes.explanation, /\[object Object\]/);
  assert.ok(urlRes.explanation.length > 5);

  // Test empty buffer to document verifier
  const docRes = await verifyDocument({
    fileName: 'empty.pdf',
    fileBuffer: Buffer.alloc(0),
    mimeType: 'application/pdf',
  });
  assert.equal(typeof docRes.explanation, 'string');
  assert.doesNotMatch(docRes.explanation, /\[object Object\]/);
});
