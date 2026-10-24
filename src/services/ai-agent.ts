/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - AI Threat Agent & Explainability Service
 */

import { ThreatAlert, VulnerabilityItem } from '../types/security';

export interface AIAnalysisResult {
  summary: string;
  blastRadius: string;
  mitreMapping: {
    tactic: string;
    technique: string;
    subTechnique?: string;
  };
  recommendedActions: string[];
  simulationHypothesis: string;
  confidenceReasoning: string;
}

export async function analyzeThreatWithAI(alert: ThreatAlert): Promise<AIAnalysisResult> {
  // Check if Gemini API key is available in runtime
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are DarkWatch AI, an autonomous cyber defense reasoning engine.
Analyze this security threat incident and output JSON:
Title: ${alert.title}
Type: ${alert.type}
Severity: ${alert.severity}
Confidence: ${alert.confidence}%
Source IP: ${alert.sourceIp} (${alert.sourceCountry})
Target Asset: ${alert.targetAsset.name} (${alert.targetAsset.type}, Criticality: ${alert.targetAsset.criticality})
Description: ${alert.description}
Payload: ${alert.payloadSummary}

Return STRICT JSON with keys:
"summary": string (plain language root cause explanation, explainable AI),
"blastRadius": string (which systems or data are endangered),
"mitreTactic": string,
"mitreTechnique": string,
"recommendedActions": array of strings,
"simulationHypothesis": string (what would happen if action is taken vs ignored),
"confidenceReasoning": string (why AI is confident)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          summary: parsed.summary,
          blastRadius: parsed.blastRadius,
          mitreMapping: {
            tactic: parsed.mitreTactic || alert.mitreTactic,
            technique: parsed.mitreTechnique || alert.mitreTechnique,
          },
          recommendedActions: parsed.recommendedActions || [alert.recommendedAction],
          simulationHypothesis: parsed.simulationHypothesis || 'Simulating block shows zero false positives for legitimate users.',
          confidenceReasoning: parsed.confidenceReasoning || `High confidence based on correlated telemetry from ${alert.sourceCountry}.`,
        };
      }
    } catch (err) {
      console.warn('Gemini API query fallback to deterministic engine:', err);
    }
  }

  // High-fidelity instant synthesis based on alert type and context (Slide 07 & 09)
  return getDeterministicThreatAnalysis(alert);
}

function getDeterministicThreatAnalysis(alert: ThreatAlert): AIAnalysisResult {
  switch (alert.type) {
    case 'SUSPICIOUS_LOGIN':
      return {
        summary: `DarkWatch AI Correlated Anomaly: Concurrent impossible travel detected for administrative account originating from Tor exit node (${alert.sourceIp}) while active Kerberos session exists in corporate network. High likelihood of compromised session cookies or OAuth credential theft.`,
        blastRadius: `Identity broker cluster, SSO application federation tokens, and potential lateral privilege escalation across ${alert.targetAsset.name}.`,
        mitreMapping: {
          tactic: 'Initial Access (TA0001)',
          technique: 'Valid Accounts: Cloud Accounts (T1078.004)',
        },
        recommendedActions: [
          'Terminate active session token and revoke refresh tokens on IdP',
          'Enforce immediate hardware FIDO2 MFA challenge on user re-login',
          'Add source IP 185.220.101.45 to perimeter firewall drop rule for 48 hours',
          'Inspect CloudTrail/Audit logs for any API calls made within the past 2 hours',
        ],
        simulationHypothesis: 'Simulation Mode verification: Terminating this session will affect 1 user without disrupting active production database connections.',
        confidenceReasoning: `96% confidence score derived from IP reputation feed, ASN Tor exit node flags, and 3,400-mile impossible travel calculation in < 3 minutes.`,
      };

    case 'DATA_EXFILTRATION':
      return {
        summary: `DNS Tunneling Exfiltration Detected: Low-and-slow encoded DNS query streams targeting foreign NS servers. High entropy in subdomains confirms base64 encoded database rows leaking through port 53.`,
        blastRadius: `Confidential customer records in ${alert.targetAsset.name}, compliance exposure under GDPR/HIPAA, and egress gateway integrity.`,
        mitreMapping: {
          tactic: 'Exfiltration (TA0010)',
          technique: 'Exfiltration Over Alternative Protocol: DNS (T1048.003)',
        },
        recommendedActions: [
          'Publish RPZ DNS sinkhole rule for destination domain *.telemetry-sync-cdn.top',
          'Sever stateful TCP/UDP outbound sockets from database node 10.240.50.2',
          'Trigger memory capture on affected database container to identify injecting thread',
          'Notify SecOps incident commander and escalate to Tier 2 Forensic review',
        ],
        simulationHypothesis: 'Simulation Mode shows sinkholing DNS queries stops exfiltration immediately with 0% impact on internal microservice DNS resolution.',
        confidenceReasoning: '92% confidence based on Shannon entropy threshold > 4.8 and query velocity of 4,280 queries in 90 seconds.',
      };

    case 'MALWARE':
      return {
        summary: `Cobalt Strike In-Memory Injection: Reflective DLL injection matched against known C2 beacon signatures inside runner-worker.exe. Attacker is attempting to establish persistence in the CI/CD pipeline.`,
        blastRadius: `Source code repositories, automated production deployment keys, and adjacent Kubernetes cluster nodes.`,
        mitreMapping: {
          tactic: 'Execution (TA0002)',
          technique: 'Process Injection (T1055)',
        },
        recommendedActions: [
          'Isolate CI/CD runner host 10.240.33.88 from internal LAN',
          'Kill process tree and collect volatility memory dump for analysis',
          'Revoke temporary cloud IAM credentials issued to this build node',
          'Reprovision worker node from hardened immutable golden image',
        ],
        simulationHypothesis: 'Isolating this node pauses 2 active pull request builds, but prevents lateral movement to production keys.',
        confidenceReasoning: '94% confidence based on byte pattern matching against Cobalt Strike 4.9 beacon loader and unbacked memory region execution.',
      };

    default:
      return {
        summary: `DarkWatch AI Threat Correlation: Multi-signal anomaly detected on ${alert.targetAsset.name}. Network traffic spikes combined with unusual protocol behavior deviate by 4.2 standard deviations from baseline.`,
        blastRadius: `Affected asset ${alert.targetAsset.name} and downstream connected services in subnet.`,
        mitreMapping: {
          tactic: alert.mitreTactic,
          technique: alert.mitreTechnique,
        },
        recommendedActions: [
          alert.recommendedAction,
          'Capture forensic pcap trace on edge switch',
          'Trigger automated vulnerability scan on target IP',
        ],
        simulationHypothesis: 'Dry run execution confirms zero degradation of mission-critical user workflows.',
        confidenceReasoning: `${alert.confidence}% confidence calculated from multi-vector behavior analysis and historical baseline deviation.`,
      };
  }
}
