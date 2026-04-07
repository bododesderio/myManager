import assert from 'node:assert/strict';

// ─── i18n: language detection + fallback ─────────────────────────────────
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'ar', 'sw'];
function pickInitialLanguage(stored, deviceLocale) {
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  if (deviceLocale && SUPPORTED_LANGUAGES.includes(deviceLocale)) return deviceLocale;
  return 'en';
}
assert.equal(pickInitialLanguage('fr', 'es'), 'fr', 'stored takes precedence');
assert.equal(pickInitialLanguage(null, 'es'), 'es', 'falls back to device locale');
assert.equal(pickInitialLanguage(null, 'de'), 'en', 'unsupported locale falls to en');
assert.equal(pickInitialLanguage('xx', 'es'), 'es', 'invalid stored falls to device');

// ─── Calendar: date bucketing ─────────────────────────────────────────────
function bucketPostsByDate(posts) {
  const map = {};
  for (const p of posts) {
    if (!p.scheduled_at) continue;
    const key = p.scheduled_at.slice(0, 10);
    (map[key] ||= []).push(p);
  }
  return map;
}
const buckets = bucketPostsByDate([
  { id: '1', scheduled_at: '2026-04-15T10:00:00Z' },
  { id: '2', scheduled_at: '2026-04-15T15:30:00Z' },
  { id: '3', scheduled_at: '2026-04-16T09:00:00Z' },
  { id: '4' },
]);
assert.equal(buckets['2026-04-15'].length, 2);
assert.equal(buckets['2026-04-16'].length, 1);
assert.equal(Object.keys(buckets).length, 2);

// ─── Notifications: relative time formatter ───────────────────────────────
function relTime(iso, nowMs = Date.now()) {
  const diff = nowMs - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
const fixed = new Date('2026-04-15T12:00:00Z').getTime();
assert.equal(relTime('2026-04-15T11:59:30Z', fixed), 'now');
assert.equal(relTime('2026-04-15T11:55:00Z', fixed), '5m ago');
assert.equal(relTime('2026-04-15T09:00:00Z', fixed), '3h ago');
assert.equal(relTime('2026-04-13T12:00:00Z', fixed), '2d ago');

// ─── Email validation (signup + invite reuses same regex) ────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
assert.equal(emailRegex.test('valid@example.com'), true);
assert.equal(emailRegex.test('invalid'), false);
assert.equal(emailRegex.test('@no-local'), false);

// ─── Period → date range (analytics screen) ─────────────────────────────
function periodToDates(period, nowMs = Date.now()) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const end = new Date(nowMs);
  const start = new Date(nowMs);
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
const range = periodToDates('30d', new Date('2026-04-30T12:00:00Z').getTime());
assert.equal(range.startDate, '2026-03-31');
assert.equal(range.endDate, '2026-04-30');

console.log('mobile tests passed');
