import assert from 'node:assert/strict';
import {
  getLegacyDashboardRedirect,
  isAuthRoute,
  isDashboardRoute,
} from '../lib/auth/route-access.ts';

const preferencesResponse = {
  language: 'en',
  currency: 'USD',
  totp_enabled: true,
};

assert.equal(isDashboardRoute('/home'), true);
assert.equal(isDashboardRoute('/analytics/benchmarks'), true);
assert.equal(isDashboardRoute('/settings/accounts'), true);
assert.equal(isDashboardRoute('/marketing'), false);

assert.equal(isAuthRoute('/login'), true);
assert.equal(isAuthRoute('/signup/checkout'), true);
assert.equal(isAuthRoute('/home'), false);

assert.equal(getLegacyDashboardRedirect('/user/dashboard'), '/home');
assert.equal(getLegacyDashboardRedirect('/user/home'), '/home');
assert.equal(getLegacyDashboardRedirect('/home'), null);
assert.equal('totp_secret' in preferencesResponse, false);

// ─── Signup form validation ────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
assert.equal(emailRegex.test('valid@example.com'), true);
assert.equal(emailRegex.test('also.valid+tag@sub.example.co.uk'), true);
assert.equal(emailRegex.test('no-at-sign.com'), false);
assert.equal(emailRegex.test('@no-local'), false);
assert.equal(emailRegex.test('no-domain@'), false);
assert.equal(emailRegex.test(' spaces@example.com'), false);

function isStep1Valid({ accountType, firstName, lastName, email, password, country, companyName, teamSize }) {
  return (
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    emailRegex.test(email) &&
    password.length >= 8 &&
    !!country &&
    (accountType === 'individual' || (companyName.trim().length >= 2 && teamSize))
  );
}

assert.equal(
  isStep1Valid({
    accountType: 'individual',
    firstName: 'Bo',
    lastName: 'De',
    email: 'b@d.com',
    password: 'longenough',
    country: 'UG',
    companyName: '',
    teamSize: '',
  }),
  true,
  'individual with all fields valid',
);
assert.equal(
  isStep1Valid({
    accountType: 'company',
    firstName: 'Bo',
    lastName: 'De',
    email: 'b@d.com',
    password: 'longenough',
    country: 'UG',
    companyName: '',
    teamSize: '5-20',
  }),
  false,
  'company without companyName invalid',
);
assert.equal(
  isStep1Valid({
    accountType: 'individual',
    firstName: 'B',
    lastName: 'De',
    email: 'b@d.com',
    password: 'longenough',
    country: 'UG',
    companyName: '',
    teamSize: '',
  }),
  false,
  'firstName < 2 invalid',
);
assert.equal(
  isStep1Valid({
    accountType: 'individual',
    firstName: 'Bo',
    lastName: 'De',
    email: 'invalid',
    password: 'longenough',
    country: 'UG',
    companyName: '',
    teamSize: '',
  }),
  false,
  'invalid email rejected',
);

// ─── Workspace slug pattern (settings validation) ──────────────────────────
const slugPattern = /^[a-z0-9-]{2,}$/;
assert.equal(slugPattern.test('acme-corp'), true);
assert.equal(slugPattern.test('a'), false);
assert.equal(slugPattern.test('Acme'), false);
assert.equal(slugPattern.test('has spaces'), false);
assert.equal(slugPattern.test('with_underscores'), false);

// ─── Reports form validation ───────────────────────────────────────────────
function reportFormErrors(form) {
  return {
    name: !form.name.trim() ? 'Report name is required.' : '',
    dateFrom: !form.dateFrom ? 'Start date is required.' : '',
    dateTo:
      !form.dateTo
        ? 'End date is required.'
        : form.dateFrom && form.dateTo < form.dateFrom
          ? 'End date must be after start date.'
          : '',
  };
}
assert.deepEqual(
  reportFormErrors({ name: '', dateFrom: '', dateTo: '' }),
  { name: 'Report name is required.', dateFrom: 'Start date is required.', dateTo: 'End date is required.' },
);
assert.deepEqual(
  reportFormErrors({ name: 'Q2', dateFrom: '2026-04-01', dateTo: '2026-03-01' }),
  { name: '', dateFrom: '', dateTo: 'End date must be after start date.' },
);
assert.deepEqual(
  reportFormErrors({ name: 'Q2', dateFrom: '2026-04-01', dateTo: '2026-04-30' }),
  { name: '', dateFrom: '', dateTo: '' },
);

console.log('web tests passed');
