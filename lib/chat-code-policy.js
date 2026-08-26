'use strict';

const CODE_FENCE = /```([a-zA-Z0-9+#.-]*)[ \t]*\n?([\s\S]*?)```/g;

function extractCodeBlocks(text) {
  const blocks = [];
  const source = String(text || '');
  let match;
  while ((match = CODE_FENCE.exec(source)) !== null) {
    const lang = (match[1] || 'python').toLowerCase().trim() || 'python';
    const code = match[2].trim();
    if (code) blocks.push({ lang, src: code });
  }
  CODE_FENCE.lastIndex = 0;
  return blocks;
}

function chatCodeRequested(body) {
  // A dedicated flag is required. A markdown fence alone must never execute.
  return !!body && body.runCode === true;
}

function validateChatCodeBlocks(blocks, limits) {
  const maxBlocks = limits && Number.isInteger(limits.maxBlocks) ? limits.maxBlocks : 2;
  const maxSource = limits && Number.isInteger(limits.maxSource) ? limits.maxSource : 12000;
  if (blocks.length > maxBlocks) return { ok: false, reason: `มี code block มากเกินขีดจำกัด ${maxBlocks} บล็อก` };
  if (blocks.some((block) => block.src.length > maxSource)) {
    return { ok: false, reason: `โค้ดยาวเกินขีดจำกัด ${maxSource} ตัวอักษรต่อบล็อก` };
  }
  return { ok: true };
}

module.exports = { extractCodeBlocks, chatCodeRequested, validateChatCodeBlocks };
