/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Persistent Database & Security Data Store
 * Provides persistent storage for users, dynamic OTPs, sessions, scans, threats,
 * vulnerabilities, patches, SIEM events, and cryptographic audit records.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { 
  INITIAL_VULNERABILITIES, 
  INITIAL_PATCH_PIPELINE, 
  INITIAL_AUDIT_LOGS,
  INITIAL_ALERTS 
} from '../data/mock-security-data.ts';
import { ThreatAlert, VulnerabilityItem, PatchDeployment, AuditRecord } from '../types/security.ts';
import { UserRole, computeAuditHash, standardSha256 } from '../utils/security-engine.ts';
import { ScanHistoryRecord } from '../utils/scan-history-store.ts';

export interface UserRecord {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  isVerified: boolean;
  registeredAt: string;
  currentLogin: string;
  previousLogin: string | null;
  failedAttempts: number;
  lockoutUntil: number | null;
  authMethod: string;
  phoneNumber?: string;
  mobileVerifiedAt?: string;
}

export interface PendingRegistration {
  challengeId: string;
  username: string;
  displayName: string;
  email?: string;
  phoneNumber: string; // E.164 normalized e.g. +919876543210
  passwordHash: string;
  salt: string;
  createdAt: number;
  lastOtpSentAt: number;
}

export interface OtpRecord {
  id: string;
  identifier: string; // normalized username, email, or E.164 phone number
  otpHash: string;
  salt: string;
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'MFA_STEPUP';
  expiresAt: number; // epoch ms
  attempts: number; // max 5
  isUsed: boolean;
  createdAt: number;
  channel?: 'SMS' | 'EMAIL';
}

export interface SessionRecord {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  expiresAt: number; // epoch ms (7 days)
  createdAt: number;
}

export interface SiemIngestEvent {
  id: string;
  timestamp: string;
  source: string;
  sourceIp: string;
  targetAsset: string;
  eventType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rawPayload: string;
  normalizedData: Record<string, any>;
}

export interface DarkWatchDatabaseSchema {
  version: number;
  users: Record<string, UserRecord>; // keyed by normalized username
  pendingRegistrations?: Record<string, PendingRegistration>; // keyed by normalized username or phone
  otps: OtpRecord[];
  sessions: Record<string, SessionRecord>; // keyed by token
  scans: ScanHistoryRecord[];
  threats: ThreatAlert[];
  vulnerabilities: VulnerabilityItem[];
  patches: PatchDeployment[];
  auditLogs: AuditRecord[];
  siemEvents: SiemIngestEvent[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'darkwatch-db.json');

// Cryptographic password hasher using PBKDF2-HMAC-SHA512
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: finalSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(hash, 'hex'));
}

export function hashOtp(otp: string, salt: string): string {
  return crypto.pbkdf2Sync(otp, salt, 10000, 32, 'sha256').toString('hex');
}

class DarkWatchDb {
  private data: DarkWatchDatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('Could not create data dir, using in-memory state', e);
      }
    }
  }

  private getInitialData(): DarkWatchDatabaseSchema {
    const defaultPassword = 'darkwatch123';
    const users: Record<string, UserRecord> = {};

    const initialAccounts: Array<{ username: string; email: string; name: string; role: UserRole }> = [
      { username: 'admin', email: 'admin@darkwatch.corp', name: 'SecOps Administrator', role: 'SECOPS_ADMIN' },
      { username: 'vagdevi.lead', email: 'vagdevi@darkwatch.corp', name: 'Vagdevi', role: 'SECOPS_ADMIN' },
      { username: 'vamsi.soc2', email: 'vamsi@darkwatch.corp', name: 'Vamsi', role: 'TIER_2_ANALYST' },
      { username: 'surya.hunter', email: 'surya@darkwatch.corp', name: 'Surya', role: 'TIER_2_ANALYST' },
      { username: 'tabasum.tier1', email: 'tabasum@darkwatch.corp', name: 'Tabasum', role: 'TIER_1_ANALYST' },
      { username: 'harini.audit', email: 'harini@darkwatch.corp', name: 'Harini', role: 'COMPLIANCE_OFFICER' },
    ];

    const now = new Date().toISOString();
    for (const acc of initialAccounts) {
      const { hash, salt } = hashPassword(defaultPassword);
      users[acc.username.toLowerCase()] = {
        id: `USR-${crypto.randomInt(1000, 9999)}`,
        username: acc.username,
        email: acc.email,
        displayName: acc.name,
        passwordHash: hash,
        salt,
        role: acc.role,
        isVerified: true,
        registeredAt: now,
        currentLogin: now,
        previousLogin: null,
        failedAttempts: 0,
        lockoutUntil: null,
        authMethod: 'PASSWORD_BIOMETRIC',
      };
    }

    return {
      version: 2,
      users,
      otps: [],
      sessions: {},
      scans: [],
      threats: INITIAL_ALERTS || [],
      vulnerabilities: INITIAL_VULNERABILITIES || [],
      patches: INITIAL_PATCH_PIPELINE || [],
      auditLogs: INITIAL_AUDIT_LOGS || [],
      siemEvents: [],
    };
  }

  private load(): DarkWatchDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading db file, seeding fresh database:', e);
    }
    const initial = this.getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DarkWatchDatabaseSchema) {
    try {
      this.ensureDataDir();
      const tmp = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.warn('Failed persisting database to disk:', e);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  // --- User Operations ---
  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users[username.toLowerCase().trim()];
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    const clean = email.toLowerCase().trim();
    return Object.values(this.data.users).find((u) => u.email && u.email.toLowerCase() === clean);
  }

  public getUserByPhoneNumber(phoneNumber: string): UserRecord | undefined {
    const clean = phoneNumber.replace(/[\s\-\(\)\.]/g, '').toLowerCase().trim();
    return Object.values(this.data.users).find((u) => {
      if (!u.phoneNumber) return false;
      const uPhone = u.phoneNumber.replace(/[\s\-\(\)\.]/g, '').toLowerCase().trim();
      return uPhone === clean;
    });
  }

  public findUser(identifier: string): UserRecord | undefined {
    const clean = identifier.toLowerCase().trim();
    return this.data.users[clean] || this.getUserByEmail(clean) || this.getUserByPhoneNumber(clean);
  }

  // --- Pending Registration Operations (Atomic until OTP is verified) ---
  public setPendingRegistration(pending: PendingRegistration): void {
    if (!this.data.pendingRegistrations) {
      this.data.pendingRegistrations = {};
    }
    // Store keyed by both username and normalized mobile number
    this.data.pendingRegistrations[pending.username.toLowerCase().trim()] = pending;
    this.data.pendingRegistrations[pending.phoneNumber.toLowerCase().trim()] = pending;
    this.save();
  }

  public getPendingRegistration(identifier: string): PendingRegistration | undefined {
    if (!this.data.pendingRegistrations) return undefined;
    return this.data.pendingRegistrations[identifier.toLowerCase().trim()];
  }

  public removePendingRegistration(pending: PendingRegistration): void {
    if (!this.data.pendingRegistrations) return;
    delete this.data.pendingRegistrations[pending.username.toLowerCase().trim()];
    delete this.data.pendingRegistrations[pending.phoneNumber.toLowerCase().trim()];
    this.save();
  }

  public createUser(user: UserRecord): UserRecord {
    const key = user.username.toLowerCase().trim();
    this.data.users[key] = user;
    this.save();
    return user;
  }

  public updateUser(username: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const key = username.toLowerCase().trim();
    const existing = this.data.users[key];
    if (!existing) return undefined;
    this.data.users[key] = { ...existing, ...updates };
    this.save();
    return this.data.users[key];
  }

  // --- Dynamic OTP Operations ---
  public createMobileOtp(
    phoneNumber: string,
    purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'MFA_STEPUP',
    expirySeconds = 300 // 5 minutes standard
  ): { code: string; record: OtpRecord } {
    const clean = phoneNumber.toLowerCase().trim();
    // Invalidate existing active OTPs for this phone number and purpose
    this.data.otps = this.data.otps.map((o) =>
      o.identifier === clean && o.purpose === purpose && !o.isUsed ? { ...o, isUsed: true } : o
    );

    // Cryptographically secure 6-digit random code
    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(code, salt);

    const record: OtpRecord = {
      id: `OTP-${crypto.randomInt(1000, 9999)}`,
      identifier: clean,
      otpHash,
      salt,
      purpose,
      expiresAt: Date.now() + expirySeconds * 1000,
      attempts: 0,
      isUsed: false,
      createdAt: Date.now(),
      channel: 'SMS',
    };

    this.data.otps.push(record);
    this.save();
    return { code, record };
  }

  public createOtp(
    identifier: string,
    purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'MFA_STEPUP'
  ): { code: string; record: OtpRecord } {
    const clean = identifier.toLowerCase().trim();
    // Invalidate existing active OTPs for this identifier and purpose
    this.data.otps = this.data.otps.map((o) =>
      o.identifier === clean && o.purpose === purpose && !o.isUsed ? { ...o, isUsed: true } : o
    );

    // Cryptographically secure 6-digit random code
    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(code, salt);

    const record: OtpRecord = {
      id: `OTP-${crypto.randomInt(1000, 9999)}`,
      identifier: clean,
      otpHash,
      salt,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      isUsed: false,
      createdAt: Date.now(),
      channel: 'EMAIL',
    };

    this.data.otps.push(record);
    this.save();
    return { code, record };
  }

  public verifyOtp(
    identifier: string,
    code: string,
    purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'MFA_STEPUP'
  ): { valid: boolean; error?: string } {
    const clean = identifier.toLowerCase().trim();
    const now = Date.now();

    // Find latest matching OTP record
    const record = [...this.data.otps]
      .reverse()
      .find((o) => o.identifier === clean && o.purpose === purpose && !o.isUsed);

    if (!record) {
      return { valid: false, error: 'No active OTP verification code found. Please request a new code.' };
    }

    if (now > record.expiresAt) {
      record.isUsed = true;
      this.save();
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (record.attempts >= 5) {
      record.isUsed = true;
      this.save();
      return { valid: false, error: 'Maximum verification attempts (5) exceeded. Code invalidated. Please request a new code.' };
    }

    record.attempts += 1;
    const computedHash = hashOtp(code.trim(), record.salt);

    if (computedHash !== record.otpHash) {
      this.save();
      const remaining = 5 - record.attempts;
      return { 
        valid: false, 
        error: `Incorrect OTP code (${record.attempts}/5 attempts). ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` 
      };
    }

    // Success! Mark consumed so it cannot be used again
    record.isUsed = true;
    this.save();
    return { valid: true };
  }

  // --- Session Operations ---
  public createSession(user: UserRecord): SessionRecord {
    const token = crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      userId: user.id,
      username: user.username,
      role: user.role,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    };
    this.data.sessions[token] = session;
    this.save();
    return session;
  }

  public getSession(token: string): SessionRecord | undefined {
    const session = this.data.sessions[token];
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  // --- Scans Operations ---
  public getScans(username?: string): ScanHistoryRecord[] {
    if (!username) return this.data.scans;
    const clean = username.toLowerCase().trim();
    return this.data.scans.filter(
      (s) => !s.username || s.username.toLowerCase().trim() === clean
    );
  }

  public saveScan(scan: ScanHistoryRecord): ScanHistoryRecord {
    this.data.scans = [scan, ...this.data.scans.filter((s) => s.id !== scan.id)].slice(0, 100);
    this.save();
    return scan;
  }

  public toggleSaveScan(id: string): boolean {
    let newStatus = false;
    this.data.scans = this.data.scans.map((s) => {
      if (s.id === id) {
        newStatus = !s.isSaved;
        return { ...s, isSaved: newStatus };
      }
      return s;
    });
    this.save();
    return newStatus;
  }

  public updateScanNotes(id: string, notes: string): boolean {
    let updated = false;
    this.data.scans = this.data.scans.map((s) => {
      if (s.id === id) {
        updated = true;
        return { ...s, notes, isSaved: true };
      }
      return s;
    });
    this.save();
    return updated;
  }

  public deleteScan(id: string): boolean {
    const before = this.data.scans.length;
    this.data.scans = this.data.scans.filter((s) => s.id !== id);
    this.save();
    return this.data.scans.length < before;
  }

  // --- Threats & Triage Operations ---
  public getThreats(): ThreatAlert[] {
    return this.data.threats;
  }

  public addThreat(threat: ThreatAlert): ThreatAlert {
    this.data.threats = [threat, ...this.data.threats];
    this.save();
    return threat;
  }

  public updateThreat(id: string, updates: Partial<ThreatAlert>): ThreatAlert | undefined {
    const index = this.data.threats.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    this.data.threats[index] = { ...this.data.threats[index], ...updates };
    this.save();
    return this.data.threats[index];
  }

  // --- Vulnerabilities & Patches ---
  public getVulnerabilities(): VulnerabilityItem[] {
    return this.data.vulnerabilities;
  }

  public getPatches(): PatchDeployment[] {
    return this.data.patches;
  }

  public updatePatch(id: string, updates: Partial<PatchDeployment>): PatchDeployment | undefined {
    const index = this.data.patches.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    this.data.patches[index] = { ...this.data.patches[index], ...updates };
    this.save();
    return this.data.patches[index];
  }

  // --- Audit Trail Operations with Real SHA-256 Hash Chaining ---
  public getAuditLogs(): AuditRecord[] {
    return this.data.auditLogs;
  }

  public appendAuditLog(
    action: string,
    actor: string,
    role: UserRole,
    target: string,
    result: 'SUCCESS' | 'APPROVAL_PENDING' | 'REJECTED' | 'SIMULATED'
  ): AuditRecord {
    const lastHash = this.data.auditLogs[0]?.hash || 'dw-sha256-0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const hash = computeAuditHash(lastHash, action, actor, timestamp, target, result);

    const record: AuditRecord = {
      id: `AUD-${crypto.randomInt(100, 999)}`,
      timestamp,
      actor,
      role,
      action,
      target,
      result,
      hash,
      prevHash: lastHash,
    };

    this.data.auditLogs = [record, ...this.data.auditLogs];
    this.save();
    return record;
  }

  // --- SIEM Telemetry Events ---
  public getSiemEvents(): SiemIngestEvent[] {
    return this.data.siemEvents;
  }

  public ingestSiemEvent(event: SiemIngestEvent): SiemIngestEvent {
    this.data.siemEvents = [event, ...this.data.siemEvents].slice(0, 500);
    this.save();
    return event;
  }
}

export const db = new DarkWatchDb();
