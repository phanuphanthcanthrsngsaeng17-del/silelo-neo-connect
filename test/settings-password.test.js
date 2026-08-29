const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(root, 'public', 'chat.html'), 'utf8');

test('settings save and password change controls are present and protected', () => {
  assert.match(server, /\/api\/auth\/change-password/);
  assert.match(server, /requireAuth, requireOwner/);
  assert.match(server, /CURRENT_PASSWORD_INVALID/);
  assert.match(server, /PASSWORD_TOO_SHORT/);
  assert.match(server, /PASSWORD_CONFIRM_MISMATCH/);
  assert.match(server, /passwordVersion/);
  for (const marker of ['saveSettingsBtn', 'settingsSaveStatus', 'currentPassword', 'newPassword', 'confirmPassword', 'changePasswordBtn']) assert.match(chat, new RegExp(marker));
  assert.match(chat, /localStorage\.setItem\('nc_settings_saved'/);
});
