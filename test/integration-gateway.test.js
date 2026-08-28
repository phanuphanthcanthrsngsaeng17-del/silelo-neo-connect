"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const http = require("node:http");
const { operationAllowed, operationNeedsConfirmation, requestGateway, gatewayStatus } = require("../lib/integration-gateway");

function startGateway(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

test("allowlists real integration operations and marks writes for confirmation", () => {
  assert.equal(operationAllowed("gmail", "search_messages"), true);
  assert.equal(operationAllowed("shopify", "list_products"), true);
  assert.equal(operationAllowed("unknown", "search"), false);
  assert.equal(operationNeedsConfirmation("search_messages"), false);
  assert.equal(operationNeedsConfirmation("send_messages"), true);
});

test("does not call upstream when gateway is not configured", async () => {
  const result = await requestGateway({ service: "gmail", action: "search_messages", payload: {}, env: {} });
  assert.equal(result.ok, false);
  assert.equal(result.error, "GATEWAY_NOT_CONFIGURED");
});

test("requires explicit confirmation before write operations", async () => {
  const result = await requestGateway({ service: "gmail", action: "send_messages", payload: {}, env: { CONNECTOR_GATEWAY_URL: "http://127.0.0.1:1", CONNECTOR_GATEWAY_TOKEN: "server-secret" } });
  assert.equal(result.ok, false);
  assert.equal(result.error, "CONFIRMATION_REQUIRED");
});

test("forwards a read operation to the configured gateway without exposing token in response", async (t) => {
  let received = null;
  const { server, url } = await startGateway(async (req, res) => {
    received = { method: req.method, path: req.url, auth: req.headers.authorization, user: req.headers["x-neo-connect-user"] };
    let body = "";
    for await (const chunk of req) body += chunk;
    received.body = JSON.parse(body);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, items: [{ id: "real-upstream-result" }] }));
  });
  t.after(() => server.close());

  const result = await requestGateway({
    service: "gmail",
    action: "search_messages",
    payload: { q: "is:unread", max_results: 2 },
    user: "user@example.com",
    env: { CONNECTOR_GATEWAY_URL: url, CONNECTOR_GATEWAY_TOKEN: "server-secret" },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.items, [{ id: "real-upstream-result" }]);
  assert.deepEqual(received, {
    method: "POST",
    path: "/v1/integrations/gmail/search_messages",
    auth: "Bearer server-secret",
    user: "user@example.com",
    body: { payload: { q: "is:unread", max_results: 2 } },
  });
  assert.equal(JSON.stringify(result).includes("server-secret"), false);
});

test("reports gateway status without returning the configured token", async (t) => {
  const { server, url } = await startGateway((req, res) => {
    assert.equal(req.headers.authorization, "Bearer server-secret");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ providers: { gmail: "connected" } }));
  });
  t.after(() => server.close());
  const result = await gatewayStatus({ CONNECTOR_GATEWAY_URL: url, CONNECTOR_GATEWAY_TOKEN: "server-secret" });
  assert.equal(result.state, "online");
  assert.deepEqual(result.data, { providers: { gmail: "connected" } });
  assert.equal(JSON.stringify(result).includes("server-secret"), false);
});
