const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/session-config');
const { isAuthenticated, isAdmin } = require('../src/middleware/auth');

test('session secret is mandatory', () => {
  assert.throws(() => config({}));
  assert.throws(() => config({ SESSION_SECRET: 'short' }));
});
test('production cookies require HTTPS and prevent script access', () => {
  const options = config({ SESSION_SECRET: 'x'.repeat(32), NODE_ENV: 'production' });
  assert.equal(options.cookie.secure, true);
  assert.equal(options.cookie.httpOnly, true);
  assert.equal(options.cookie.sameSite, 'lax');
  assert.equal(config({ SESSION_SECRET: 'x'.repeat(32) }).cookie.secure, false);
});
test('anonymous users are redirected and authenticated users proceed', () => {
  let redirected, passed = false;
  const res = { redirect: path => { redirected = path; } };
  isAuthenticated({ session: {}, flash() {} }, res, () => { passed = true; });
  assert.equal(redirected, '/auth/login');
  assert.equal(passed, false);
  isAuthenticated({ session: { userId: 1 } }, res, () => { passed = true; });
  assert.equal(passed, true);
});
test('admin middleware rejects ordinary users', () => {
  let passed = false, redirected;
  isAdmin({ session: { userRole: 'USER' }, flash() {} }, { redirect: path => { redirected = path; } }, () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(redirected, '/');
  isAdmin({ session: { userRole: 'ADMIN' } }, {}, () => { passed = true; });
  assert.equal(passed, true);
});
