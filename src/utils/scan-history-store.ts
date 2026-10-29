/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Persistent Search & Scan History Store
 * Persistent database for URL/phone scans, incident investigations, and bookmarked threats
 */

export interface BlacklistHit {
  feedName: string;
  status: 'FLAGGED' | 'CLEAN';
  details?: string;
}

export interface ScanHistoryRecord {
  id: string;
  query: string;
  targetType: 'URL' | 'PHONE';
  timestamp: string;
  isoDate: string;
  scamRating: number; // 0 to 100
  verdict: 'CRITICAL_SCAM' | 'HIGH_RISK' | 'SUSPICIOUS' | 'VERIFIED_SAFE';
  category: string;
  summary: string;
  blacklistsFlagged: string[];
  totalBlacklistsChecked: number;
  carrierOrRegistrar?: string;
  country?: string;
  isSaved?: boolean;
  notes?: string;
  username?: string;
}

const STORAGE_KEY = 'darkwatch_scan_history_v1';

const INITIAL_SEEDED_HISTORY: ScanHistoryRecord[] = [
  {
    id: 'HIST-901',
    query: 'http://secure-login-wellsfargo-verify.account-update.top/auth/login.html',
    targetType: 'URL',
    timestamp: 'Today at 14:15 UTC',
    isoDate: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    scamRating: 98,
    verdict: 'CRITICAL_SCAM',
    category: 'Phishing Credential Harvester',
    summary: 'Impersonates Wells Fargo Online Banking. Domain age 2 days, unencrypted HTTP, flagged on 6 global threat blacklists.',
    blacklistsFlagged: ['Google Safe Browsing', 'VirusTotal (14/68)', 'Spamhaus DBL', 'PhishTank', 'AbuseIPDB', 'URLhaus'],
    totalBlacklistsChecked: 9,
    carrierOrRegistrar: 'NameSilo LLC (Suspicious TLD .top)',
    country: 'Russia / Seychellen IP Proxy',
    isSaved: true,
    notes: 'Saved threat: High risk credential harvester. Firewall perimeter rule deployed.',
  },
  {
    id: 'HIST-902',
    query: '+1 (800) 555-0199',
    targetType: 'PHONE',
    timestamp: 'Today at 13:42 UTC',
    isoDate: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    scamRating: 94,
    verdict: 'CRITICAL_SCAM',
    category: 'IRS & Tax Authority Impersonation',
    summary: 'VoIP Robocall spoofing IRS agents demanding immediate prepaid debit card payment. STIR/SHAKEN Attestation C (Unauthenticated).',
    blacklistsFlagged: ['FCC Robocall Registry', 'FTC Consumer Fraud Reports', 'Truecaller High-Spam Alert', 'Twilio Carrier Spam Filter'],
    totalBlacklistsChecked: 6,
    carrierOrRegistrar: 'Twilio / Bandwidth VoIP Virtual Line',
    country: 'United States (VoIP Redirect)',
    isSaved: true,
    notes: 'Saved threat: Robocall ring targeting enterprise employees.',
  },
  {
    id: 'HIST-903',
    query: 'https://claim-free-eth-airdrop-bonus2026.xyz/connect-wallet',
    targetType: 'URL',
    timestamp: 'Yesterday at 21:10 UTC',
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    scamRating: 92,
    verdict: 'CRITICAL_SCAM',
    category: 'Web3 / Crypto Wallet Drainer',
    summary: 'Fake token airdrop script requesting permit2 / setApprovalForAll signature to siphon ERC-20 balances.',
    blacklistsFlagged: ['VirusTotal (21/68)', 'Chainabuse Web3 Blacklist', 'PhishTank', 'Google Safe Browsing'],
    totalBlacklistsChecked: 9,
    carrierOrRegistrar: 'Hostinger Russia / Cloudflare Proxy',
    country: 'Panama Hosted',
    isSaved: false,
  },
  {
    id: 'HIST-904',
    query: '+91 98765 43210',
    targetType: 'PHONE',
    timestamp: '2 days ago',
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    scamRating: 88,
    verdict: 'HIGH_RISK',
    category: 'WhatsApp Electricity Bill / KYC Suspension Scam',
    summary: 'Automated SMS blast claiming power disconnection due to pending unpaid bill with APK malware download link.',
    blacklistsFlagged: ['TRAI DND Violation Registry', 'Chakshu Telecom Fraud Portal', 'Truecaller Community Flagged'],
    totalBlacklistsChecked: 6,
    carrierOrRegistrar: 'Bharti Airtel Virtual SIM pool',
    country: 'India',
    isSaved: true,
    notes: 'Saved for telecom regulator reporting.',
  },
  {
    id: 'HIST-905',
    query: 'https://github.com/torvalds/linux',
    targetType: 'URL',
    timestamp: '3 days ago',
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    scamRating: 2,
    verdict: 'VERIFIED_SAFE',
    category: 'Legitimate Open Source Repository',
    summary: 'Official GitHub infrastructure with valid High-Assurance EV TLS certificate and clean global reputation.',
    blacklistsFlagged: [],
    totalBlacklistsChecked: 9,
    carrierOrRegistrar: 'GitHub Inc. / Microsoft Corporation',
    country: 'United States',
    isSaved: false,
  },
];

export const getScanHistory = (username?: string): ScanHistoryRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: ScanHistoryRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    if (!username) {
      return parsed;
    }

    const cleanUser = username.toLowerCase().trim();
    // Return items tagged with this username OR general seeded items with no username attached
    return parsed.filter(
      (item) => !item.username || item.username.toLowerCase().trim() === cleanUser
    );
  } catch {
    return [];
  }
};

export const seedSampleScans = (username?: string): ScanHistoryRecord[] => {
  if (typeof window !== 'undefined') {
    try {
      const seeded = INITIAL_SEEDED_HISTORY.map((item) => ({ ...item, username }));
      const existing = getScanHistory();
      const merged = [...seeded, ...existing.filter((e) => !INITIAL_SEEDED_HISTORY.some((s) => s.id === e.id))];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: merged }));
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_SEEDED_HISTORY;
};

export const saveScanHistoryItem = (
  item: Omit<ScanHistoryRecord, 'id' | 'timestamp' | 'isoDate'>,
  username?: string
): ScanHistoryRecord => {
  let allRecords: ScanHistoryRecord[] = [];
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const currentRaw = localStorage.getItem(STORAGE_KEY);
      allRecords = currentRaw ? JSON.parse(currentRaw) : [];
      if (!Array.isArray(allRecords)) allRecords = [];
    } catch {
      allRecords = [];
    }
  }

  const now = new Date();
  const recordUser = username || item.username;
  const newRecord: ScanHistoryRecord = {
    ...item,
    id: `HIST-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: `Just now (${now.toISOString().substring(11, 16)} UTC)`,
    isoDate: now.toISOString(),
    isSaved: item.isSaved ?? true, // Auto-save by default to meet user requirement
    username: recordUser,
  };

  // Prepend new item and limit total history size to 100
  const updated = [newRecord, ...allRecords.filter((x) => x.query !== item.query)].slice(0, 100);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: updated }));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    if (typeof fetch !== 'undefined') {
      try {
        const token = sessionStorage.getItem('darkwatch_auth_token') || localStorage.getItem('darkwatch_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        fetch('/api/scans', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            target: item.query,
            targetType: item.targetType,
            isSaved: item.isSaved ?? true,
            notes: item.notes,
          }),
        }).catch(() => {});
      } catch {
        // Non-blocking network sync
      }
    }
  }

  return newRecord;
};

export const toggleSaveScanHistoryItem = (id: string): boolean => {
  const current = getScanHistory();
  let newStatus = false;
  const updated = current.map((item) => {
    if (item.id === id) {
      newStatus = !item.isSaved;
      return { ...item, isSaved: newStatus };
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  }

  return newStatus;
};

export const updateScanHistoryNotes = (id: string, notes: string): void => {
  const current = getScanHistory();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, notes, isSaved: true };
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  }
};

export const deleteScanHistoryItem = (id: string): void => {
  const current = getScanHistory();
  const updated = current.filter((x) => x.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  }
};

export const clearAllScanHistory = (username?: string): void => {
  if (typeof window !== 'undefined') {
    try {
      if (!username) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: [] }));
      } else {
        const cleanUser = username.toLowerCase().trim();
        const current = getScanHistory();
        const remaining = current.filter(
          (item) => item.username && item.username.toLowerCase().trim() !== cleanUser
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        window.dispatchEvent(new CustomEvent('darkwatch_history_updated', { detail: remaining }));
      }
    } catch (e) {
      console.error(e);
    }
  }
};
