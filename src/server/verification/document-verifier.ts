/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Document & Exam Paper Verification Service
 * Supports PDF, PNG, and JPG verification with size bounds, cryptographic SHA-256
 * integrity hashing, metadata analysis, sample/mock test recognition, and
 * authoritative institutional comparison.
 */

import crypto from 'crypto';
import { DocumentVerificationResult, DocumentVerificationStatus, SharedClassification, VerificationEvidenceItem } from './types';

export interface AuthoritativeDocumentRecord {
  id: string;
  sha256Hash: string;
  title: string;
  issuingOrganization: string;
  examCodeOrId: string;
  officialDate: string;
}

export interface DocumentVerificationInput {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  extractedTextHint?: string;
  claimedIssuer?: string;
  claimedExamId?: string;
}

// Known authoritative registry for unit tests and official matches
export const AUTHORITATIVE_REGISTRY: AuthoritativeDocumentRecord[] = [
  {
    id: 'AUTH-CBSE-2026-X1',
    sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    title: 'All India Secondary School Examination 2026 - Mathematics Standard',
    issuingOrganization: 'Central Board of Secondary Education (CBSE)',
    examCodeOrId: 'CBSE-MATH-2026-041',
    officialDate: '2026-03-12',
  },
  {
    id: 'AUTH-GATE-2026-CS',
    sha256Hash: 'f0e1d2c3b4a596877869504132231405f0e1d2c3b4a596877869504132231405',
    title: 'Graduate Aptitude Test in Engineering (GATE 2026) - Computer Science',
    issuingOrganization: 'IIT Roorkee / GATE Examination Board',
    examCodeOrId: 'GATE-CS-2026',
    officialDate: '2026-02-08',
  },
];

// Helper to check magic bytes
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): { valid: boolean; detected: string } {
  if (buffer.length < 4) {
    return { valid: false, detected: 'Buffer too small' };
  }

  // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detected: 'application/pdf' };
  }

  // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, detected: 'image/png' };
  }

  // JPEG magic bytes: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detected: 'image/jpeg' };
  }

  return { valid: false, detected: 'Unknown file signature' };
}

// Sample or practice document heuristic detector
export function detectSampleOrPractice(text: string, fileName: string): { isSample: boolean; indicators: string[] } {
  const indicators: string[] = [];
  const combined = `${fileName} ${text}`.toLowerCase();

  const keywords = [
    'sample paper',
    'sample question paper',
    'mock test',
    'practice paper',
    'practice test',
    'model question paper',
    'model paper',
    'specimen paper',
    'for practice only',
    'not for examination',
    'sample copy',
  ];

  for (const kw of keywords) {
    if (combined.includes(kw)) {
      indicators.push(`Explicit sample designation: Contains term '${kw.toUpperCase()}'`);
    }
  }

  return {
    isSample: indicators.length > 0,
    indicators,
  };
}

export async function verifyDocument(
  input: DocumentVerificationInput,
  authoritativeRecords: AuthoritativeDocumentRecord[] = AUTHORITATIVE_REGISTRY
): Promise<DocumentVerificationResult> {
  const now = new Date().toISOString();
  const { fileName, fileBuffer, mimeType, extractedTextHint = '', claimedIssuer, claimedExamId } = input;
  const evidence: VerificationEvidenceItem[] = [];
  const sourcesChecked: string[] = ['MIME Magic Byte Inspector', 'NIST FIPS 180-4 SHA-256 Digest'];
  const limitations: string[] = [
    'OCR and visual inspection cannot verify authenticity without an authoritative institutional match.',
    'Watermarks or seals on scanned images can be manipulated using image editing software.',
  ];
  const recommendations: string[] = [
    'Obtain examination question papers only through authorized institutional portals.',
    'Report any leaked question papers immediately to examination authorities.',
  ];

  // 1. Size constraint check (Max 15MB)
  const MAX_BYTES = 15 * 1024 * 1024;
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      fileName,
      fileSizeBytes: 0,
      fileMimeType: mimeType,
      sha256Hash: '',
      isValidFormat: false,
      detectedType: 'UNKNOWN',
      isSampleOrPractice: false,
      sampleIndicators: [],
      extractedMetadata: {},
      inconsistenciesFound: ['Empty or missing file payload'],
      verificationStatus: 'CHECK UNAVAILABLE',
      sharedClassification: 'CHECK_UNAVAILABLE',
      explanation: 'No file content was uploaded or file is 0 bytes.',
      sourcesChecked,
      evidence: [],
      limitations,
      recommendations,
      checkedAt: now,
    };
  }

  if (fileBuffer.length > MAX_BYTES) {
    return {
      fileName,
      fileSizeBytes: fileBuffer.length,
      fileMimeType: mimeType,
      sha256Hash: '',
      isValidFormat: false,
      detectedType: 'UNKNOWN',
      isSampleOrPractice: false,
      sampleIndicators: [],
      extractedMetadata: {},
      inconsistenciesFound: [`File size (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB) exceeds 15MB limit`],
      verificationStatus: 'CHECK UNAVAILABLE',
      sharedClassification: 'CHECK_UNAVAILABLE',
      explanation: 'File exceeds maximum upload boundary of 15MB.',
      sourcesChecked,
      evidence: [{
        id: 'ev-doc-size-fail',
        name: 'Upload Boundary Enforcement',
        category: 'FORMAT',
        status: 'FLAGGED',
        detail: `Size ${fileBuffer.length} bytes exceeds 15MB limit.`,
        sourceChecked: 'Upload Guard',
        timestamp: now,
      }],
      limitations,
      recommendations,
      checkedAt: now,
    };
  }

  // 2. Compute cryptographic SHA-256 digest
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  evidence.push({
    id: 'ev-doc-sha256',
    name: 'SHA-256 Cryptographic Fingerprint',
    category: 'INTEGRITY',
    status: 'PASSED',
    detail: `Digest: ${sha256}`,
    sourceChecked: 'Standard SHA-256 Engine',
    timestamp: now,
  });

  // 3. Magic bytes validation
  const magic = validateFileMagicBytes(fileBuffer, mimeType);
  if (!magic.valid) {
    return {
      fileName,
      fileSizeBytes: fileBuffer.length,
      fileMimeType: mimeType,
      sha256Hash: sha256,
      isValidFormat: false,
      detectedType: 'UNKNOWN',
      isSampleOrPractice: false,
      sampleIndicators: [],
      extractedMetadata: {},
      inconsistenciesFound: [`File signature mismatch: Claimed ${mimeType}, but header detected ${magic.detected}`],
      verificationStatus: 'CHECK UNAVAILABLE',
      sharedClassification: 'SUSPICIOUS',
      explanation: 'Uploaded document has an invalid or corrupted file header format.',
      sourcesChecked,
      evidence: [{
        id: 'ev-doc-magic-fail',
        name: 'File Format Signature Verification',
        category: 'FORMAT',
        status: 'FLAGGED',
        detail: `Invalid header magic bytes: ${magic.detected}`,
        sourceChecked: 'Magic Byte Validator',
        timestamp: now,
      }],
      limitations,
      recommendations,
      checkedAt: now,
    };
  }

  evidence.push({
    id: 'ev-doc-magic-ok',
    name: 'MIME Signature Verification',
    category: 'FORMAT',
    status: 'PASSED',
    detail: `Verified magic bytes matching valid ${magic.detected}`,
    sourceChecked: 'Header Signature Inspector',
    timestamp: now,
  });

  // 4. Sample / Practice Paper Detection
  const sampleCheck = detectSampleOrPractice(extractedTextHint, fileName);
  const inconsistencies: string[] = [];
  const extractedMetadata: DocumentVerificationResult['extractedMetadata'] = {
    title: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    issuingOrganization: claimedIssuer || (extractedTextHint.includes('CBSE') ? 'Central Board of Secondary Education' : undefined),
    examCodeOrId: claimedExamId,
    hasWatermarkOrSeal: extractedTextHint.toLowerCase().includes('watermark') || extractedTextHint.toLowerCase().includes('seal'),
  };

  // 5. Authoritative comparison against official records
  sourcesChecked.push('Institutional Examination Repository');
  const exactHashMatch = authoritativeRecords.find((rec) => rec.sha256Hash.toLowerCase() === sha256.toLowerCase());
  const idMatch = claimedExamId ? authoritativeRecords.find((rec) => rec.examCodeOrId.toLowerCase() === claimedExamId.toLowerCase()) : null;

  let verificationStatus: DocumentVerificationStatus = 'UNVERIFIED';
  let sharedClassification: SharedClassification = 'UNVERIFIED';
  let explanation = '';

  if (exactHashMatch) {
    verificationStatus = 'OFFICIALLY VERIFIED';
    sharedClassification = 'AUTHENTICITY_VERIFIED';
    explanation = `Cryptographic fingerprint matches official release in authoritative registry: "${exactHashMatch.title}" issued by ${exactHashMatch.issuingOrganization}.`;
    extractedMetadata.title = exactHashMatch.title;
    extractedMetadata.issuingOrganization = exactHashMatch.issuingOrganization;
    extractedMetadata.examCodeOrId = exactHashMatch.examCodeOrId;
    extractedMetadata.issueDate = exactHashMatch.officialDate;
    evidence.push({
      id: 'ev-doc-auth-match',
      name: 'Authoritative Document Registry Match',
      category: 'REPUTATION',
      status: 'PASSED',
      detail: `Verified match against record ID ${exactHashMatch.id} (${exactHashMatch.title})`,
      sourceChecked: 'Institutional Examination Repository',
      timestamp: now,
    });
  } else if (idMatch && idMatch.sha256Hash.toLowerCase() !== sha256.toLowerCase()) {
    // Exam ID was claimed, but the cryptographic hash does NOT match the official file
    verificationStatus = 'CONFIRMED MISMATCH';
    sharedClassification = 'MALICIOUS_FRAUD_CONFIRMED';
    inconsistencies.push(`Claimed Exam ID '${claimedExamId}' exists in registry, but file hash does NOT match official registered release.`);
    explanation = `CONFIRMED MISMATCH: The document claims to be Exam ID "${idMatch.examCodeOrId}" (${idMatch.title}), but the cryptographic hash does not match the official exam paper. Potential leaked draft or altered content.`;
    evidence.push({
      id: 'ev-doc-mismatch',
      name: 'Cryptographic Hash Mismatch with Claimed Official Record',
      category: 'INTEGRITY',
      status: 'FLAGGED',
      detail: `Official hash: ${idMatch.sha256Hash.slice(0, 16)}..., Uploaded hash: ${sha256.slice(0, 16)}...`,
      sourceChecked: 'Institutional Examination Repository',
      timestamp: now,
    });
  } else if (sampleCheck.isSample) {
    // Crucial rule: "A model exam paper, sample paper, mock test, or practice paper must not automatically be classified as fake merely because it is not an official exam paper."
    verificationStatus = 'SAMPLE / PRACTICE DOCUMENT';
    sharedClassification = 'VALID_INPUT';
    explanation = `Identified as a legitimate model exam paper or mock practice test (${sampleCheck.indicators[0]}). This is a study/practice document, not an official live exam paper.`;
    sampleCheck.indicators.forEach((ind, i) => {
      evidence.push({
        id: `ev-doc-sample-${i}`,
        name: 'Model / Sample Paper Indicator',
        category: 'DOCUMENT_METADATA',
        status: 'PASSED',
        detail: ind,
        sourceChecked: 'DarkWatch Document Heuristics',
        timestamp: now,
      });
    });
  } else if (authoritativeRecords.length === 0) {
    verificationStatus = 'CHECK UNAVAILABLE';
    sharedClassification = 'CHECK_UNAVAILABLE';
    explanation = 'Official examination verification service is unavailable. No authoritative repository connected.';
    limitations.push('Institutional repository check is unavailable.');
  } else {
    // No match, not sample, structurally valid
    verificationStatus = 'UNVERIFIED';
    sharedClassification = 'UNVERIFIED';
    explanation = 'Document structure is valid, but no corresponding official release was found in authoritative examination records. Status remains UNVERIFIED.';
    evidence.push({
      id: 'ev-doc-unverified',
      name: 'Institutional Repository Query',
      category: 'REPUTATION',
      status: 'UNAVAILABLE',
      detail: 'No registered institutional fingerprint found matching this document digest.',
      sourceChecked: 'Institutional Examination Repository',
      timestamp: now,
    });
  }

  return {
    fileName,
    fileSizeBytes: fileBuffer.length,
    fileMimeType: magic.detected,
    sha256Hash: sha256,
    isValidFormat: true,
    detectedType: fileName.toLowerCase().includes('exam') || extractedTextHint.toLowerCase().includes('exam') ? 'EXAM_PAPER' : 'OFFICIAL_ORDER',
    isSampleOrPractice: sampleCheck.isSample,
    sampleIndicators: sampleCheck.indicators,
    extractedMetadata,
    inconsistenciesFound: inconsistencies,
    verificationStatus,
    sharedClassification,
    explanation,
    sourcesChecked,
    evidence,
    limitations,
    recommendations,
    checkedAt: now,
  };
}
