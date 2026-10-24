import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateThreatRisk,
  calculateVPR,
  hasPermission,
  advancePatchStage,
  computeAuditHash,
} from './security-engine.ts';

test('evaluateThreatRisk flags mission-critical high severity alerts as CRITICAL with human approval', () => {
  const result = evaluateThreatRisk({
    baseSeverityScore: 9,
    confidenceScore: 0.95,
    assetCriticality: 'MISSION_CRITICAL',
    attackVelocityMultiplier: 1.5,
  });

  assert.equal(result.tier, 'CRITICAL');
  assert.equal(result.requiresHumanApproval, true);
  assert.ok(result.compositeScore >= 85);
  assert.equal(result.slaMinutes, 15);
});

test('evaluateThreatRisk evaluates low severity alert as LOW with no human approval required', () => {
  const result = evaluateThreatRisk({
    baseSeverityScore: 3,
    confidenceScore: 0.5,
    assetCriticality: 'LOW',
    attackVelocityMultiplier: 1.0,
  });

  assert.equal(result.tier, 'LOW');
  assert.equal(result.requiresHumanApproval, false);
  assert.ok(result.compositeScore < 40);
});

test('calculateVPR calculates weighted priority rating including EPSS and public exploit factors', () => {
  const zeroDay = calculateVPR(9.8, 0.85, true, true);
  assert.equal(zeroDay.priority, 'CRITICAL');
  assert.ok(zeroDay.vprScore >= 85);

  const internalLow = calculateVPR(4.0, 0.05, false, false);
  assert.equal(internalLow.priority, 'LOW');
  assert.ok(internalLow.vprScore < 40);
});

test('RBAC hasPermission enforces role boundaries accurately', () => {
  // SecOps Admin has full powers
  assert.equal(hasPermission('SECOPS_ADMIN', 'DEPLOY_PATCH'), true);
  assert.equal(hasPermission('SECOPS_ADMIN', 'APPROVE_PLAYBOOK'), true);

  // Tier 1 SOC Analyst can only simulate or scan, cannot deploy patch or approve live playbook
  assert.equal(hasPermission('TIER_1_ANALYST', 'DEPLOY_PATCH'), false);
  assert.equal(hasPermission('TIER_1_ANALYST', 'APPROVE_PLAYBOOK'), false);
  assert.equal(hasPermission('TIER_1_ANALYST', 'SIMULATE_PLAYBOOK'), true);

  // Compliance Officer can export audit logs, cannot deploy patch
  assert.equal(hasPermission('COMPLIANCE_OFFICER', 'EXPORT_AUDIT_LOG'), true);
  assert.equal(hasPermission('COMPLIANCE_OFFICER', 'DEPLOY_PATCH'), false);
});

test('advancePatchStage handles progressive rollout and rollback on failure', () => {
  const canary = advancePatchStage('PENDING', true);
  assert.equal(canary.nextStage, 'CANARY_TEST');

  const staging = advancePatchStage('CANARY_TEST', true);
  assert.equal(staging.nextStage, 'STAGING_VERIFY');

  const prod = advancePatchStage('STAGING_VERIFY', true);
  assert.equal(prod.nextStage, 'PRODUCTION_DEPLOYED');

  // Failure triggers instant rollback
  const failure = advancePatchStage('CANARY_TEST', false);
  assert.equal(failure.nextStage, 'ROLLBACK');
});

test('computeAuditHash creates deterministic tamper-evident cryptographic hash', () => {
  const hash1 = computeAuditHash('GENESIS_BLOCK', 'ISOLATE_HOST', 'admin@darkwatch.ai', '2026-10-17T06:00:00Z');
  const hash2 = computeAuditHash('GENESIS_BLOCK', 'ISOLATE_HOST', 'admin@darkwatch.ai', '2026-10-17T06:00:00Z');
  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('dw-sha256-'));
});

test('calculateLinkRiskScore flags deceptive phishing URL as CRITICAL_SCAM', async () => {
  const { calculateLinkRiskScore } = await import('../services/link-analyzer.ts');
  const phishing = calculateLinkRiskScore('http://secure-paypal-login-verify-account.xyz/auth');
  assert.equal(phishing.riskLevel, 'CRITICAL_SCAM');
  assert.ok(phishing.score >= 80);

  const safe = calculateLinkRiskScore('https://google.com/search');
  assert.equal(safe.riskLevel, 'VERIFIED_SAFE');
  assert.ok(safe.score < 35);
});

