"use strict";

const OWNER_ONLY_PATHS = new Set([
  "/code",
  "/run",
  "/db",
  "/codetool",
  "/sandbox/exec",
  "/sandbox/write",
  "/sandbox/install",
  "/install",
]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function ownerModeEnabled(value) {
  return !["0", "false", "off", "no"].includes(normalize(value));
}

function isOwnerIdentity(user, { ownerEmails = [], ownerLineIds = [], loginEmail = "" } = {}) {
  if (!user || typeof user !== "object") return false;
  const email = normalize(user.e);
  const userId = String(user.u || "");
  const provider = normalize(user.p);
  const normalizedOwners = new Set(ownerEmails.map(normalize).filter(Boolean));
  const normalizedLogin = normalize(loginEmail);

  if (email && (normalizedOwners.has(email) || email === normalizedLogin)) return true;
  if (provider === "password" && normalizedLogin && email === normalizedLogin) return true;
  if (provider === "line") {
    const lineId = userId.replace(/^line:/i, "");
    return ownerLineIds.includes(lineId);
  }
  return false;
}

function requiresOwner(path, body) {
  if (OWNER_ONLY_PATHS.has(path)) return true;
  return path === "/chat" && body && body.runCode === true;
}

module.exports = { OWNER_ONLY_PATHS, isOwnerIdentity, ownerModeEnabled, requiresOwner };
