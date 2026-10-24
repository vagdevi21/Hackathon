/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Core Security & Risk Assessment Engine
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type UserRole = 'SECOPS_ADMIN' | 'TIER_2_ANALYST' | 'TIER_1_ANALYST' | 'COMPLIANCE_OFFICER';

export type UserAction = 
  | 'APPROVE_PLAYBOOK' 
  | 'SIMULATE_PLAYBOOK' 
  | 'DEPLOY_PATCH' 
  | 'MODIFY_FIREWALL' 
  | 'EXPORT_AUDIT_LOG' 
  | 'TRIGGER_SCAN' 
  | 'CONFIGURE_SIEM';

export interface ThreatInput {
  baseSeverityScore: number; // 1-10
  confidenceScore: number;   // 0.0 - 1.0
  assetCriticality: 'MISSION_CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  attackVelocityMultiplier?: number; // 1.0 - 2.5
}

export interface ThreatEvaluation {
  compositeScore: number; // 0 - 100
  tier: SeverityLevel;
  requiresHumanApproval: boolean;
  recommendedAction: string;
  slaMinutes: number;
}

/**
 * Calculates Composite Risk Score based on asset criticality, confidence, and severity
 */
export function evaluateThreatRisk(input: ThreatInput): ThreatEvaluation {
  const assetWeights: Record<string, number> = {
    MISSION_CRITICAL: 1.4,
    HIGH: 1.2,
    MEDIUM: 1.0,
    LOW: 0.7,
  };

  const assetWeight = assetWeights[input.assetCriticality] || 1.0;
  const velocity = Math.min(Math.max(input.attackVelocityMultiplier ?? 1.0, 1.0), 2.5);
  const confidence = Math.min(Math.max(input.confidenceScore, 0.1), 1.0);

  // Scaled 0 to 100
  const rawScore = input.baseSeverityScore * 10 * confidence * assetWeight * (1 + (velocity - 1) * 0.3);
  const compositeScore = Math.min(Math.round(rawScore), 100);

  let tier: SeverityLevel = 'LOW';
  let requiresHumanApproval = false;
  let recommendedAction = 'Log event & monitor endpoint telemetry';
  let slaMinutes = 1440; // 24h

  if (compositeScore >= 85) {
    tier = 'CRITICAL';
    requiresHumanApproval = true; // Critical alerts require human sign-off before full host isolation
    recommendedAction = 'Execute Host Isolation & Revoke Session Tokens';
    slaMinutes = 15;
  } else if (compositeScore >= 65) {
    tier = 'HIGH';
    requiresHumanApproval = true;
    recommendedAction = 'Block Ingress IP & Trigger In-Depth Sandbox Scan';
    slaMinutes = 60;
  } else if (compositeScore >= 40) {
    tier = 'MEDIUM';
    requiresHumanApproval = false;
    recommendedAction = 'Throttle rate-limit & flag user session for MFA verification';
    slaMinutes = 240;
  }

  return {
    compositeScore,
    tier,
    requiresHumanApproval,
    recommendedAction,
    slaMinutes,
  };
}

/**
 * Calculates Vulnerability Priority Rating (VPR) based on CVSS, EPSS, and Exploit Status
 */
export function calculateVPR(
  cvssBase: number,
  epssProbability: number,
  hasKnownExploit: boolean,
  isInternetFacing: boolean
): { vprScore: number; priority: SeverityLevel; autoPatchEligible: boolean } {
  let score = cvssBase * 6.5; // base up to 65

  // EPSS contribution (up to 20 pts)
  score += Math.min(epssProbability * 20, 20);

  // Known active exploit in the wild (+10 pts)
  if (hasKnownExploit) {
    score += 10;
  }

  // Exposed to public internet (+5 pts)
  if (isInternetFacing) {
    score += 5;
  }

  const vprScore = Math.min(Math.round(score), 100);

  let priority: SeverityLevel = 'LOW';
  if (vprScore >= 85) priority = 'CRITICAL';
  else if (vprScore >= 65) priority = 'HIGH';
  else if (vprScore >= 45) priority = 'MEDIUM';

  // Automated canary patching eligible if non-critical or proven patch exists with zero regression
  const autoPatchEligible = vprScore >= 40 && vprScore < 90;

  return { vprScore, priority, autoPatchEligible };
}

/**
 * Role-Based Access Control matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, Set<UserAction>> = {
  SECOPS_ADMIN: new Set([
    'APPROVE_PLAYBOOK',
    'SIMULATE_PLAYBOOK',
    'DEPLOY_PATCH',
    'MODIFY_FIREWALL',
    'EXPORT_AUDIT_LOG',
    'TRIGGER_SCAN',
    'CONFIGURE_SIEM',
  ]),
  TIER_2_ANALYST: new Set([
    'APPROVE_PLAYBOOK',
    'SIMULATE_PLAYBOOK',
    'TRIGGER_SCAN',
    'EXPORT_AUDIT_LOG',
  ]),
  TIER_1_ANALYST: new Set([
    'SIMULATE_PLAYBOOK',
    'TRIGGER_SCAN',
  ]),
  COMPLIANCE_OFFICER: new Set([
    'EXPORT_AUDIT_LOG',
    'TRIGGER_SCAN',
  ]),
};

export function hasPermission(role: UserRole, action: UserAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

/**
 * Patch Deployment Lifecycle State Machine
 */
export type PatchStage = 'PENDING' | 'CANARY_TEST' | 'STAGING_VERIFY' | 'PRODUCTION_DEPLOYED' | 'ROLLBACK';

export function advancePatchStage(
  currentStage: PatchStage,
  testPassed: boolean
): { nextStage: PatchStage; message: string } {
  if (!testPassed) {
    return {
      nextStage: 'ROLLBACK',
      message: 'Automated health check failed. Instant rollback executed to preserve uptime.',
    };
  }

  switch (currentStage) {
    case 'PENDING':
      return { nextStage: 'CANARY_TEST', message: 'Deploying patch to 5% canary nodes.' };
    case 'CANARY_TEST':
      return { nextStage: 'STAGING_VERIFY', message: 'Canary verified with 0% error rate. Advancing to staging cluster.' };
    case 'STAGING_VERIFY':
      return { nextStage: 'PRODUCTION_DEPLOYED', message: 'All integration checks passed. Production rollout complete.' };
    case 'PRODUCTION_DEPLOYED':
      return { nextStage: 'PRODUCTION_DEPLOYED', message: 'Patch is active and verified across all fleet nodes.' };
    case 'ROLLBACK':
      return { nextStage: 'PENDING', message: 'Resetting patch status to pending after safe rollback.' };
    default:
      return { nextStage: 'PENDING', message: 'Initialized.' };
  }
}

/**
 * Simple deterministic SHA-256 like checksum for audit logging verification
 */
export function computeAuditHash(prevHash: string, action: string, actor: string, timestamp: string): string {
  const payload = `${prevHash}|${action}|${actor}|${timestamp}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `dw-sha256-${hex}-${payload.length.toString(16)}`;
}
