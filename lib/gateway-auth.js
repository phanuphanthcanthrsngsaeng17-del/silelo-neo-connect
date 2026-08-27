"use strict";

const crypto = require("crypto");

function readBearerToken(header) {
  const value = String(header || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : "";
}

function matchesGatewayApiKey(candidate, configured) {
  const left = Buffer.from(String(candidate || ""));
  const right = Buffer.from(String(configured || ""));
  if (!left.length || !right.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function gatewayUserFromRequest(req, env = process.env) {
  const configured = String(env.NEO_CONNECT_API_KEY || "").trim();
  if (!configured) return null;
  const candidate = readBearerToken(req && req.headers ? req.headers.authorization : "");
  if (!matchesGatewayApiKey(candidate, configured)) return null;
  return { u: "gateway:neo-connect", e: "", p: "gateway", gateway: true };
}

module.exports = { readBearerToken, matchesGatewayApiKey, gatewayUserFromRequest };
