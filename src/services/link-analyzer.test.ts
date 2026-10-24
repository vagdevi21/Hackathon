/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Intelligent URL & Phone Risk Analyzer Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  analyzeWebsiteUrl, 
  analyzePhoneNumber, 
  isPrivateOrBlockedHost, 
  maskPhoneNumber 
} from './link-analyzer.ts';

test('isPrivateOrBlockedHost blocks SSRF targets, loopbacks, and cloud metadata', () => {
  assert.equal(isPrivateOrBlockedHost('localhost'), true);
  assert.equal(isPrivateOrBlockedHost('127.0.0.1'), true);
  assert.equal(isPrivateOrBlockedHost('169.254.169.254'), true);
  assert.equal(isPrivateOrBlockedHost('10.0.0.5'), true);
  assert.equal(isPrivateOrBlockedHost('192.168.1.1'), true);
  assert.equal(isPrivateOrBlockedHost('172.16.0.1'), true);
  assert.equal(isPrivateOrBlockedHost('internal-service.local'), true);

  assert.equal(isPrivateOrBlockedHost('google.com'), false);
  assert.equal(isPrivateOrBlockedHost('github.com'), false);
});

test('maskPhoneNumber masks sensitive caller digits while preserving country code', () => {
  const masked = maskPhoneNumber('+1 800 555-0199');
  assert.ok(masked.includes('***'));
  assert.ok(masked.startsWith('+1 8'));
});

test('analyzeWebsiteUrl flags phishing credential harvesters with high risk score', () => {
  const res = analyzeWebsiteUrl('http://secure-login-wellsfargo-verify.account-update.top/auth/login.html');
  assert.equal(res.riskTier, 'HIGH');
  assert.ok(res.estimatedRiskScore !== null && res.estimatedRiskScore >= 60);
  assert.ok(res.statusLabel.length > 0);
  assert.equal(res.threatDistribution.hasData, true);
  assert.ok(res.threatDistribution.breakdown.length > 0);
  assert.ok(res.riskFactors.some((rf) => rf.result === 'THREAT_DETECTED' || rf.result === 'WARNING'));
});

test('analyzeWebsiteUrl detects verified legitimate domains and honors data honesty', () => {
  const res = analyzeWebsiteUrl('https://github.com/torvalds/linux');
  assert.equal(res.riskTier, 'LOW');
  assert.ok(res.estimatedRiskScore !== null && res.estimatedRiskScore <= 29);
  // Clean analysis provides honest empty evidence message instead of fake malware percentages
  assert.equal(res.threatDistribution.hasData, false);
  assert.ok(res.threatDistribution.emptyReason?.includes('Insufficient evidence'));
});

test('analyzePhoneNumber flags IRS robocalls and evaluates STIR/SHAKEN attestation', () => {
  const res = analyzePhoneNumber('+1 (800) 555-0199');
  assert.equal(res.riskTier, 'HIGH');
  assert.ok(res.estimatedRiskScore !== null && res.estimatedRiskScore >= 60);
  assert.equal(res.statusLabel, 'Do Not Proceed');
  assert.ok(res.riskFactors.some((rf) => rf.name.includes('STIR/SHAKEN')));
});
