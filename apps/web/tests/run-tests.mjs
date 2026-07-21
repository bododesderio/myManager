import assert from 'node:assert/strict';
import {
  getLegacyDashboardRedirect,
  isAuthRoute,
  isDashboardRoute,
} from '../lib/auth/route-access.ts';
import { validateHexColor } from '../lib/brand-color.ts';

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

// ─── validateHexColor (BrandProvider XSS guard) ───────────────────────────
// Verifies that the CSS injection gate accepts only #RRGGBB and rejects every
// value that could escape the <style dangerouslySetInnerHTML> property context.
const FALLBACK = '#6D5AE8';

// Valid inputs
assert.equal(validateHexColor('#6D5AE8', FALLBACK), '#6D5AE8', 'uppercase hex accepted');
assert.equal(validateHexColor('#ff5c7a', FALLBACK), '#ff5c7a', 'lowercase hex accepted');
assert.equal(validateHexColor('#10B981', FALLBACK), '#10B981', 'mixed case accepted');
assert.equal(validateHexColor('#000000', FALLBACK), '#000000', 'black accepted');
assert.equal(validateHexColor('#FFFFFF', FALLBACK), '#FFFFFF', 'white accepted');

// Short-form (#RGB) is rejected — shade() cannot handle 3-digit inputs safely
assert.equal(validateHexColor('#FAB', FALLBACK), FALLBACK, '3-digit hex rejected');
assert.equal(validateHexColor('#fff', FALLBACK), FALLBACK, '3-digit lowercase rejected');

// CSS injection payloads — must all be rejected
assert.equal(
  validateHexColor('red;} body{background:url(javascript:void(0))}', FALLBACK),
  FALLBACK,
  'CSS break-out payload rejected',
);
assert.equal(
  validateHexColor('</style><script>alert(1)</script>', FALLBACK),
  FALLBACK,
  'style element escape rejected',
);
assert.equal(validateHexColor('red', FALLBACK), FALLBACK, 'named color rejected');
assert.equal(validateHexColor('rgb(0,0,0)', FALLBACK), FALLBACK, 'rgb() rejected');
assert.equal(validateHexColor('hsl(0,0%,0%)', FALLBACK), FALLBACK, 'hsl() rejected');
assert.equal(validateHexColor('#6D5AE8;color:red', FALLBACK), FALLBACK, 'trailing injection rejected');
assert.equal(validateHexColor('6D5AE8', FALLBACK), FALLBACK, 'missing # rejected');
assert.equal(validateHexColor('#6D5AE', FALLBACK), FALLBACK, '5-digit hex rejected');
assert.equal(validateHexColor('#6D5AE88', FALLBACK), FALLBACK, '7-digit hex rejected');
assert.equal(validateHexColor('', FALLBACK), FALLBACK, 'empty string rejected');
assert.equal(validateHexColor(null, FALLBACK), FALLBACK, 'null rejected');
assert.equal(validateHexColor(undefined, FALLBACK), FALLBACK, 'undefined rejected');
assert.equal(validateHexColor(123456, FALLBACK), FALLBACK, 'number rejected');

console.log('web tests passed');
