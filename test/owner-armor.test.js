"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isOwnerIdentity, ownerModeEnabled, requiresOwner } = require("../lib/owner-armor");

const policy = {
  ownerEmails: ["owner@example.com"],
  ownerLineIds: ["U-owner-line"],
  loginEmail: "admin@example.com",
};

test("recognizes configured owner email, password account, and LINE owner", () => {
  assert.equal(isOwnerIdentity({ e: "owner@example.com", p: "google" }, policy), true);
  assert.equal(isOwnerIdentity({ e: "admin@example.com", p: "password" }, policy), true);
  assert.equal(isOwnerIdentity({ u: "line:U-owner-line", p: "line" }, policy), true);
  assert.equal(isOwnerIdentity({ e: "other@example.com", p: "google" }, policy), false);
});

test("keeps armor enabled by default but permits an explicit emergency off switch", () => {
  assert.equal(ownerModeEnabled(undefined), true);
  assert.equal(ownerModeEnabled("on"), true);
  assert.equal(ownerModeEnabled("off"), false);
});

test("requires owner only for execution and data-changing routes or explicit chat execution", () => {
  assert.equal(requiresOwner("/chat", { runCode: true }), true);
  assert.equal(requiresOwner("/chat", { runCode: false }), false);
  assert.equal(requiresOwner("/sandbox/exec", {}), true);
  assert.equal(requiresOwner("/draw", {}), false);
});
