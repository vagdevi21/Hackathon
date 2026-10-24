/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Security Domain Types
 */

import { SeverityLevel, UserRole, PatchStage } from '../utils/security-engine';

export type AlertType = 
  | 'MALWARE' 
  | 'PHISHING' 
  | 'SUSPICIOUS_LOGIN' 
  | 'DATA_EXFILTRATION' 
  | 'POLICY_VIOLATION' 
  | 'UNUSUAL_TRAFFIC'
  | 'RANSOMWARE'
  | 'ZERO_DAY';

export type AlertStatus = 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'SIMULATED';

export interface ThreatAlert {
  id: string;
  title: string;
  type: AlertType;
  severity: SeverityLevel;
  confidence: number; // 0-100%
  timestamp: string;
  sourceIp: string;
  sourceCountry: string;
  sourceCountryCode: string;
  targetAsset: {
    id: string;
    name: string;
    ip: string;
    type: 'FIREWALL' | 'PROD_DB' | 'AUTH_SERVER' | 'APP_GATEWAY' | 'WORKSTATION' | 'K8S_NODE';
    criticality: 'MISSION_CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  status: AlertStatus;
  mitreTactic: string;
  mitreTechnique: string;
  description: string;
  payloadSummary: string;
  recommendedAction: string;
  playbookId: string;
  requiresHumanApproval: boolean;
  aiExplanation?: string;
}

export interface VulnerabilityItem {
  id: string;
  cveId: string;
  title: string;
  component: string;
  affectedVersion: string;
  fixedVersion: string;
  cvssScore: number;
  epssScore: number;
  vprScore: number;
  severity: SeverityLevel;
  exploitStatus: 'Active in Wild' | 'PoC Available' | 'Theoretical' | 'None';
  isInternetFacing: boolean;
  affectedNodesCount: number;
  patchStatus: 'NOT_PATCHED' | 'TESTING' | 'PATCHED' | 'SCHEDULED';
  remediationSlaHours: number;
  description: string;
  mitigationSteps: string[];
}

export interface PatchDeployment {
  id: string;
  cveId: string;
  packageName: string;
  version: string;
  targetFleet: string;
  currentStage: PatchStage;
  progressPercent: number;
  nodesTotal: number;
  nodesUpdated: number;
  healthScore: number;
  autoRollbackArmed: boolean;
  lastUpdated: string;
  logs: string[];
}

export interface SIEMConnector {
  id: string;
  name: string;
  type: 'Splunk' | 'Elastic SIEM' | 'Microsoft Sentinel' | 'AWS CloudWatch' | 'Datadog' | 'Kafka Telemetry';
  icon: string;
  status: 'CONNECTED' | 'SYNCING' | 'PAUSED';
  eventsPerSec: number;
  totalIngested24h: number;
  latencyMs: number;
  filteringNoiseReductionPercent: number;
  lastHeartbeat: string;
}

export interface NetworkHealthMetric {
  overallHealthPercent: number;
  totalThreats: number;
  threatsDeltaPercent: number;
  blockedAttacks: number;
  blockedDeltaPercent: number;
  atRiskSystems: number;
  atRiskDeltaPercent: number;
  activeAnomalies: number;
  siemThroughputEps: number;
  mttrMinutes: number; // Mean Time to Respond
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  result: 'SUCCESS' | 'APPROVAL_PENDING' | 'REJECTED' | 'SIMULATED';
  hash: string;
  prevHash: string;
}

export interface ResponsePlaybook {
  id: string;
  name: string;
  category: 'CONTAINMENT' | 'ERADICATION' | 'PATCHING' | 'INVESTIGATION';
  description: string;
  steps: string[];
  automatedSafe: boolean;
  estimatedExecutionSeconds: number;
  successRatePercent: number;
}
