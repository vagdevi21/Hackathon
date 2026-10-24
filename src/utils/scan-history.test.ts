/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Scan History Store & Fraud Forensics Tests
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { getScanHistory, saveScanHistoryItem, deleteScanHistoryItem, seedSampleScans } from './scan-history-store.ts';

test('getScanHistory returns clean list when unseeded and supports seedSampleScans', () => {
  const history = getScanHistory();
  assert.ok(Array.isArray(history));
  const seeded = seedSampleScans();
  assert.ok(seeded.length >= 4, 'Should contain realistic threat telemetry when sample data is loaded');
  assert.ok(seeded.some(x => x.targetType === 'URL'));
  assert.ok(seeded.some(x => x.targetType === 'PHONE'));
});

test('saveScanHistoryItem prepends new record with generated ID and timestamp', () => {
  const item = saveScanHistoryItem({
    query: '+1 (800) 123-4567',
    targetType: 'PHONE',
    scamRating: 95,
    verdict: 'CRITICAL_SCAM',
    category: 'Fake Bank Fraud Alert',
    summary: 'Automated SMS urging immediate phone call to cancel fake wire transfer',
    blacklistsFlagged: ['FCC Robocall Registry', 'Truecaller Flagged'],
    totalBlacklistsChecked: 6,
    carrierOrRegistrar: 'VoIP Pool',
    country: 'United States',
  });

  assert.ok(item.id.startsWith('HIST-'));
  assert.strictEqual(item.query, '+1 (800) 123-4567');
  assert.strictEqual(item.scamRating, 95);
  assert.strictEqual(item.verdict, 'CRITICAL_SCAM');
});
