"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { readBearerToken, matchesGatewayApiKey, gatewayUserFromRequest } = require("../lib/gateway-auth");

test("reads a bearer token without accepting malformed schemes", () => {
  assert.equal(readBearerToken("Bearer demo-key"), "demo-key");
  assert.equal(readBearerToken("bearer demo-key"), "demo-key");
  assert.equal(readBearerToken("Basic demo-key"), "");
  assert.equal(readBearerToken(""), "");
});

test("matches only a configured gateway key", () => {
  assert.equal(matchesGatewayApiKey("demo-key", "demo-key"), true);
  assert.equal(matchesGatewayApiKey("wrong-key", "demo-key"), false);
  assert.equal(matchesGatewayApiKey("", "demo-key"), false);
  assert.equal(matchesGatewayApiKey("demo-key", ""), false);
});

test("authenticates an API gateway request without exposing the key", () => {
  const req = { headers: { authorization: "Bearer demo-key" } };
  const user = gatewayUserFromRequest(req, { NEO_CONNECT_API_KEY: "demo-key" });
  assert.deepEqual(user, { u: "gateway:neo-connect", e: "", p: "gateway", gateway: true });
  assert.equal(gatewayUserFromRequest(req, {}), null);
  assert.equal(gatewayUserFromRequest({ headers: { authorization: "Bearer wrong" } }, { NEO_CONNECT_API_KEY: "demo-key" }), null);
});
