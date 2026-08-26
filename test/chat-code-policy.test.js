'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractCodeBlocks,
  chatCodeRequested,
  validateChatCodeBlocks,
} = require('../lib/chat-code-policy');

test('extracts fenced code with a safe default language', () => {
  assert.deepEqual(extractCodeBlocks('ลองดู\n```\nconsole.log("ok")\n```'), [
    { lang: 'python', src: 'console.log("ok")' },
  ]);
});

test('does not request execution from markdown alone', () => {
  assert.equal(chatCodeRequested({}), false);
  assert.equal(chatCodeRequested({ super: true }), false);
  assert.equal(chatCodeRequested({ runCode: true }), true);
});

test('enforces block and source limits', () => {
  assert.deepEqual(validateChatCodeBlocks([{ src: 'x', lang: 'python' }], { maxBlocks: 1, maxSource: 2 }), { ok: true });
  assert.equal(validateChatCodeBlocks([{ src: 'xxx', lang: 'python' }], { maxBlocks: 1, maxSource: 2 }).ok, false);
  assert.equal(validateChatCodeBlocks([{ src: 'x', lang: 'python' }, { src: 'y', lang: 'python' }], { maxBlocks: 1, maxSource: 10 }).ok, false);
});
