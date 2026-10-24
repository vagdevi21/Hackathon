/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Custom Threat Blacklist Persistence Store
 * Allows users to add, manage, and persist custom flagged URLs, domains, and phone numbers.
 */

export interface BlacklistEntry {
  id: string;
  target: string;
  targetType: 'URL' | 'PHONE';
  category: string;
  reason: string;
  addedBy: string;
  timestamp: string;
  isoDate: string;
}

const BLACKLIST_STORAGE_KEY = 'darkwatch_custom_blacklist_v1';

const INITIAL_BLACKLIST_ENTRIES: BlacklistEntry[] = [
  {
    id: 'BLK-101',
    target: 'account-update.top',
    targetType: 'URL',
    category: 'Phishing Credential Harvester',
    reason: 'Active impersonation domain targeting banking credentials',
    addedBy: 'vagdevi.lead',
    timestamp: 'Today at 10:15 UTC',
    isoDate: new Date().toISOString(),
  },
  {
    id: 'BLK-102',
    target: '+1 (800) 555-0199',
    targetType: 'PHONE',
    category: 'IRS Robocall Ring',
    reason: 'VoIP Robocall spoofing IRS tax agents',
    addedBy: 'vamsi.soc2',
    timestamp: 'Yesterday at 16:30 UTC',
    isoDate: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const getCustomBlacklist = (): BlacklistEntry[] => {
  if (typeof window === 'undefined') return INITIAL_BLACKLIST_ENTRIES;
  try {
    const raw = localStorage.getItem(BLACKLIST_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(INITIAL_BLACKLIST_ENTRIES));
      return INITIAL_BLACKLIST_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_BLACKLIST_ENTRIES;
  } catch {
    return INITIAL_BLACKLIST_ENTRIES;
  }
};

export const addCustomBlacklistItem = (
  entry: Omit<BlacklistEntry, 'id' | 'timestamp' | 'isoDate'>
): BlacklistEntry => {
  const current = getCustomBlacklist();
  const now = new Date();
  const cleanTarget = entry.target.trim();

  // Normalize host / phone
  const cleanKey = cleanTarget.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

  const newEntry: BlacklistEntry = {
    ...entry,
    id: `BLK-${Math.floor(100 + Math.random() * 900)}`,
    target: cleanTarget,
    timestamp: `Just now (${now.toISOString().substring(11, 16)} UTC)`,
    isoDate: now.toISOString(),
  };

  // Prevent duplicates
  const filtered = current.filter(
    (b) => b.target.toLowerCase() !== cleanKey && b.target.toLowerCase() !== cleanTarget.toLowerCase()
  );
  const updated = [newEntry, ...filtered];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_blacklist_updated', { detail: updated }));
    } catch (e) {
      console.error('Failed to save to custom blacklist store', e);
    }
  }

  return newEntry;
};

export const removeCustomBlacklistItem = (id: string): void => {
  const current = getCustomBlacklist();
  const updated = current.filter((b) => b.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('darkwatch_blacklist_updated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  }
};

export const isTargetBlacklisted = (query: string): BlacklistEntry | null => {
  if (!query) return null;
  const list = getCustomBlacklist();
  const clean = query.trim().toLowerCase();
  
  // Extract hostname if URL
  let cleanHost = clean.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
  const queryDigits = clean.replace(/\D/g, '');

  for (const item of list) {
    const itemTarget = item.target.trim().toLowerCase();
    const itemHost = itemTarget.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
    const itemDigits = itemTarget.replace(/\D/g, '');

    // URL / Host match
    if (
      clean === itemTarget ||
      cleanHost === itemHost ||
      (cleanHost && itemHost && cleanHost.includes(itemHost))
    ) {
      return item;
    }

    // Phone digits match
    if (queryDigits.length >= 7 && itemDigits.length >= 7) {
      if (
        queryDigits === itemDigits ||
        queryDigits.endsWith(itemDigits) ||
        itemDigits.endsWith(queryDigits)
      ) {
        return item;
      }
    }
  }

  return null;
};
