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

console.log('web tests passed');
