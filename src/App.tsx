/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - AI-Powered Cyber Early Warning System
 * Team SYNORA: Vagdevi, Vamsi, Surya, Tabasum, Harini
 */

import React, { useState, useEffect } from 'react';
import { Header, AppTheme } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/views/DashboardView';
import { ThreatTriageView } from './components/views/ThreatTriageView';
import { VulnerabilityView } from './components/views/VulnerabilityView';
import { PatchManagementView } from './components/views/PatchManagementView';
import { SiemPipelineView } from './components/views/SiemPipelineView';
import { AiPlaybooksView } from './components/views/AiPlaybooksView';
import { GovernanceAuditView } from './components/views/GovernanceAuditView';
import { LinkRiskScannerView } from './components/views/LinkRiskScannerView';
import { AuthenticityVerificationView } from './components/views/AuthenticityVerificationView';
import { AttackMapView } from './components/views/AttackMapView';
import { ThreatHeatmapView } from './components/views/ThreatHeatmapView';
import { ThreatTrendsView } from './components/views/ThreatTrendsView';
import { ThreatDistributionView } from './components/views/ThreatDistributionView';
import { ThreatForecastingView } from './components/views/ThreatForecastingView';
import { NetworkTopologyView } from './components/views/NetworkTopologyView';
import { ThreatFeedView } from './components/views/ThreatFeedView';
import { ScanHistoryView } from './components/views/ScanHistoryView';
import { AccountSettingsView } from './components/views/AccountSettingsView';
import { ThreatDetailDrawer } from './components/ThreatDetailDrawer';
import { SimulateAttackModal } from './components/SimulateAttackModal';
import { PitchDeckModal } from './components/PitchDeckModal';
import { ScanHistoryDrawer } from './components/ScanHistoryDrawer';
import { LoginModal } from './components/LoginModal';
import { Presentation, History, ShieldAlert, ArrowLeft } from 'lucide-react';

import { 
  INITIAL_VULNERABILITIES, 
  INITIAL_PATCH_PIPELINE, 
  INITIAL_AUDIT_LOGS 
} from './data/mock-security-data';
import { ThreatAlert, VulnerabilityItem, PatchDeployment, AuditRecord } from './types/security';
import { UserRole, computeAuditHash } from './utils/security-engine';
import { cyberAudio } from './utils/cyber-audio';
import { ScanHistoryRecord, getScanHistory } from './utils/scan-history-store';
import { UserProfile, getStoredUser, logoutUser } from './utils/auth-store';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Real Data Discipline: initial alerts start empty so new sessions show honest empty states
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityItem[]>(INITIAL_VULNERABILITIES);
  const [patchPipeline, setPatchPipeline] = useState<PatchDeployment[]>(INITIAL_PATCH_PIPELINE);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);

  // Authentication State: null triggers dedicated full-screen LoginScreen
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => getStoredUser()?.role || 'SECOPS_ADMIN');
  
  // Sidebar & Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Operational toggles
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [historyCount, setHistoryCount] = useState<number>(() => getScanHistory().length);

  // Modals & Drawers
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);
  const [isAttackModalOpen, setIsAttackModalOpen] = useState<boolean>(false);
  const [isPitchDeckOpen, setIsPitchDeckOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [scannerQuery, setScannerQuery] = useState<string>('');

  // Live UTC Clock for footer
  const [utcTime, setUtcTime] = useState<string>(new Date().toISOString().substring(11, 19));
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync history count
  useEffect(() => {
    const updateCount = () => {
      setHistoryCount(getScanHistory().length);
    };
    updateCount();
    window.addEventListener('darkwatch_history_updated', updateCount);
    return () => window.removeEventListener('darkwatch_history_updated', updateCount);
  }, []);

  // Listen to auth profile updates
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        setCurrentRole(e.detail.role);
      } else {
        setCurrentUser(null);
      }
    };
    window.addEventListener('darkwatch_auth_updated', handleAuthChange);
    return () => window.removeEventListener('darkwatch_auth_updated', handleAuthChange);
  }, []);

  // Manage Dark / Light / System Adaptive Theme
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.body.classList.remove('light');
      } else {
        document.body.classList.add('light');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [theme]);

  // Check URL query parameters for direct tab navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'link-scanner', 'triage', 'vulnerabilities', 'patches', 'siem', 'playbooks', 'audit'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Helper to append tamper-evident SHA-256 audit entry
  const recordAudit = (action: string, target: string, result: 'SUCCESS' | 'APPROVAL_PENDING' | 'REJECTED' | 'SIMULATED') => {
    const lastHash = auditLogs[0]?.hash || 'dw-sha256-00000000-00';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const newHash = computeAuditHash(lastHash, action, currentRole, timestamp);

    const newEntry: AuditRecord = {
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      timestamp,
      actor: `${currentUser?.username || currentRole.toLowerCase()}@darkwatch.corp`,
      role: currentRole,
      action,
      target,
      result,
      hash: newHash,
      prevHash: lastHash,
    };

    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    recordAudit('MFA_ZERO_TRUST_LOGIN', `${user.username} (${user.authMethod} Auth)`, 'SUCCESS');
  };

  const handleLogout = () => {
    if (currentUser) {
      recordAudit('USER_LOGOUT', `${currentUser.username}`, 'SUCCESS');
    }
    logoutUser();
    setCurrentUser(null);
  };

  // Inject a newly simulated threat from the adversary simulator
  const handleInjectThreat = (newThreat: ThreatAlert) => {
    setAlerts((prev) => [newThreat, ...prev]);
    recordAudit('ADVERSARY_THREAT_SIMULATION', `${newThreat.id} (${newThreat.title})`, 'SIMULATED');
    if (soundEnabled) {
      cyberAudio.playAlertChirp();
    }
    setSelectedAlert(newThreat);
  };

  // Simulate mitigation (Dry run)
  const handleSimulateMitigation = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'SIMULATED' } : a))
    );
    recordAudit('SIMULATE_MITIGATION', alertId, 'SIMULATED');
    if (soundEnabled) {
      cyberAudio.playMitigateSuccess();
    }
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: 'SIMULATED' } : null));
    }
  };

  // Live approval & mitigation execution (Human-in-the-Loop)
  const handleApproveMitigation = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'MITIGATED' } : a))
    );
    recordAudit('LIVE_MITIGATION_EXECUTION', alertId, 'SUCCESS');
    if (soundEnabled) {
      cyberAudio.playMitigateSuccess();
    }
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: 'MITIGATED' } : null));
    }
  };

  // Deploy patch from Vulnerability view
  const handleDeployPatch = (vuln: VulnerabilityItem) => {
    const existing = patchPipeline.find((p) => p.cveId === vuln.cveId);

    if (existing) {
      setPatchPipeline((prev) =>
        prev.map((p) =>
          p.cveId === vuln.cveId
            ? {
                ...p,
                currentStage: 'PRODUCTION_DEPLOYED',
                progressPercent: 100,
                nodesUpdated: p.nodesTotal,
                logs: [`[${new Date().toISOString().substring(11, 19)} UTC] Staged canary completed. Production fleet rollout 100% verified.`, ...p.logs],
              }
            : p
        )
      );
    } else {
      const newPatch: PatchDeployment = {
        id: `PATCH-${Math.floor(100 + Math.random() * 900)}`,
        cveId: vuln.cveId,
        packageName: `${vuln.component}-hotfix`,
        version: vuln.fixedVersion,
        targetFleet: 'Discovered Vulnerable Fleet',
        currentStage: 'CANARY_TEST',
        progressPercent: 35,
        nodesTotal: vuln.affectedNodesCount,
        nodesUpdated: Math.max(1, Math.round(vuln.affectedNodesCount * 0.2)),
        healthScore: 99.8,
        autoRollbackArmed: true,
        lastUpdated: 'Just now',
        logs: [
          `[${new Date().toISOString().substring(11, 19)} UTC] Initiated 1-click automated canary rollout for ${vuln.cveId}`,
          'Pre-patch signature hash verified against upstream vendor checksum',
        ],
      };
      setPatchPipeline((prev) => [newPatch, ...prev]);
    }

    setVulnerabilities((prev) =>
      prev.map((v) => (v.id === vuln.id ? { ...v, patchStatus: 'PATCHED' } : v))
    );

    recordAudit('AUTOMATED_PATCH_DEPLOY', `${vuln.cveId} (${vuln.component})`, 'SUCCESS');
    if (soundEnabled) {
      cyberAudio.playMitigateSuccess();
    }
    setActiveTab('patches');
  };

  // Playbook execution log callback
  const handleExecutePlaybookLog = (playbookName: string, isSimulation: boolean) => {
    recordAudit(
      isSimulation ? 'PLAYBOOK_SIMULATION' : 'PLAYBOOK_LIVE_EXECUTION',
      playbookName,
      isSimulation ? 'SIMULATED' : 'SUCCESS'
    );
    if (soundEnabled) {
      cyberAudio.playMitigateSuccess();
    }
  };

  const handleSelectHistoryRecord = (record: ScanHistoryRecord) => {
    setScannerQuery(record.query);
    setActiveTab('link-scanner');
  };

  const unresolvedThreats = alerts.filter((a) => a.status === 'ACTIVE').length;

  // 1. Show Dedicated Full-Screen Login Page if unauthenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Authenticated Dashboard with Collapsible Sidebar & Clean Minimal Header
  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white relative">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        unresolvedThreatCount={unresolvedThreats}
        historyCount={historyCount}
        simulationMode={simulationMode}
        onToggleSimulationMode={() => setSimulationMode((prev) => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        theme={theme}
        onThemeChange={setTheme}
        onOpenSimulateAttack={() => setIsAttackModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenPitchDeck={() => setIsPitchDeckOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Container with dynamic left margin matching sidebar collapse */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Minimal Clean Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          currentUser={currentUser}
          unresolvedThreatCount={unresolvedThreats}
          theme={theme}
          onThemeChange={setTheme}
          onLogout={handleLogout}
          onOpenPitchDeck={() => setIsPitchDeckOpen(true)}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Tab Content Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab !== 'dashboard' && (
            <div className="sticky top-[65px] z-30 p-3 bg-[#050814]/95 dark:bg-[#050814]/95 light:bg-white/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl flex items-center justify-between shadow-xl mb-4 transition-all">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-cyan active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Back to Dashboard</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-black text-slate-900 dark:text-slate-100 capitalize">
                  {activeTab.replace(/-/g, ' ')}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  ACTIVE VIEW
                </span>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              alerts={alerts}
              onSelectAlert={setSelectedAlert}
              onOpenSimulateAttack={() => setIsAttackModalOpen(true)}
              onNavigateToTab={(tab, query) => {
                if (query) setScannerQuery(query);
                setActiveTab(tab);
              }}
              onOpenHistory={() => setActiveTab('scan-history')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'authenticity-verification' && (
            <AuthenticityVerificationView 
              onBackToDashboard={() => setActiveTab('dashboard')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'link-scanner' && (
            <LinkRiskScannerView 
              initialQuery={scannerQuery}
              initialType="URL"
              onOpenHistory={() => setActiveTab('scan-history')}
              onBackToDashboard={() => setActiveTab('dashboard')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'phone-analysis' && (
            <LinkRiskScannerView 
              initialQuery={scannerQuery}
              initialType="PHONE"
              onOpenHistory={() => setActiveTab('scan-history')}
              onBackToDashboard={() => setActiveTab('dashboard')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'scan-history' && (
            <ScanHistoryView
              onNavigateToScan={(target, type) => {
                setScannerQuery(target);
                setActiveTab(type === 'PHONE' ? 'phone-analysis' : 'link-scanner');
              }}
              onBackToDashboard={() => setActiveTab('dashboard')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'attack-map' && (
            <AttackMapView
              alerts={alerts}
              onSelectAlert={setSelectedAlert}
              onOpenSimulateAttack={() => setIsAttackModalOpen(true)}
            />
          )}

          {activeTab === 'threat-heatmap' && <ThreatHeatmapView />}

          {activeTab === 'triage' && (
            <ThreatTriageView
              alerts={alerts}
              onSelectAlert={setSelectedAlert}
              onOpenSimulateAttack={() => setIsAttackModalOpen(true)}
            />
          )}

          {activeTab === 'threat-distribution' && <ThreatDistributionView />}

          {activeTab === 'threat-trends' && <ThreatTrendsView />}

          {activeTab === 'forecasting' && <ThreatForecastingView />}

          {activeTab === 'network-topology' && <NetworkTopologyView />}

          {activeTab === 'threat-feed' && (
            <ThreatFeedView
              alerts={alerts}
              onSelectAlert={setSelectedAlert}
              onOpenSimulateAttack={() => setIsAttackModalOpen(true)}
            />
          )}

          {activeTab === 'vulnerabilities' && (
            <VulnerabilityView
              vulnerabilities={vulnerabilities}
              currentRole={currentRole}
              onDeployPatch={handleDeployPatch}
            />
          )}

          {activeTab === 'patches' && (
            <PatchManagementView
              patchPipeline={patchPipeline}
              onUpdatePipeline={setPatchPipeline}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'siem' && <SiemPipelineView />}

          {activeTab === 'account-settings' && (
            <AccountSettingsView
              currentUser={currentUser}
              onLogout={handleLogout}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'playbooks' && (
            <AiPlaybooksView
              currentRole={currentRole}
              simulationMode={simulationMode}
              onExecutePlaybookLog={handleExecutePlaybookLog}
            />
          )}

          {activeTab === 'audit' && (
            <GovernanceAuditView
              auditLogs={auditLogs}
              currentRole={currentRole}
            />
          )}
        </main>

        {/* Footer Telemetry & Attribution Strip */}
        <footer className="border-t border-purple-900/30 bg-[#060a18] text-xs text-slate-400 mt-auto">
          {/* Top telemetry bar */}
          <div className="px-4 py-2.5 bg-[#040711] border-b border-slate-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM ONLINE</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-cyan-300 font-semibold">TEAM SYNORA: Vagdevi • Vamsi • Surya • Tabasum • Harini</span>
            </div>
          </div>

          {/* Bottom copyright & quick actions */}
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <span>DarkWatch</span>
                <span className="not-italic px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-700/50 shadow-glow-cyan inline-block">
                  AI
                </span>
              </span>
              <span>— Cyber Threat Early Warning & Vulnerability Response</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-cyan-400 font-medium hidden sm:inline">
                Detect Early. Defend Smarter. Stay Secure.
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals & Interactive Drawers */}
      <ThreatDetailDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        currentRole={currentRole}
        simulationMode={simulationMode}
        onSimulateMitigation={handleSimulateMitigation}
        onApproveMitigation={handleApproveMitigation}
      />

      <SimulateAttackModal
        isOpen={isAttackModalOpen}
        onClose={() => setIsAttackModalOpen(false)}
        onInjectThreat={handleInjectThreat}
      />

      <PitchDeckModal
        isOpen={isPitchDeckOpen}
        onClose={() => setIsPitchDeckOpen(false)}
      />

      <ScanHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectRecord={handleSelectHistoryRecord}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentRole={currentRole}
      />
    </div>
  );
}
