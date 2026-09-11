import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { app } from "../src/app.js";
import { resetCertificateIssuerForTests, setCertificateIssuerForTests } from "../src/controllers/blockchain.controller.js";
import { assertSignerOwnsArtwork, resetPhase2ClientFactoryForTests, setPhase2ClientFactoryForTests, Phase2AuthorizationError } from "../src/services/blockchain/phase2.service.js";

const fingerprint = "a".repeat(64);
const metadataHash = `0x${"b".repeat(64)}`;
const creator = "0x0000000000000000000000000000000000000001";
const grantee = "0x0000000000000000000000000000000000000002";
const protectionHeaders = { "content-type": "application/json", authorization: "Bearer test-protection-token", "x-artshield-role": "operator" };
const registryHeaders = { "content-type": "application/json", authorization: "Bearer test-registry-token", "x-artshield-role": "operator" };
const ownershipHeaders = { "content-type": "application/json", authorization: "Bearer test-ownership-token", "x-artshield-role": "operator" };

function fakeClient() {
  return {
    async registerArtwork() { return { transactionHash: "0xregister" }; },
    async transferArtwork() { return { transactionHash: "0xtransfer" }; },
    async getArtwork() { return { currentOwner: creator }; },
    async getProvenance() { return [metadataHash]; },
    async issueRights() { return { transactionHash: "0xrights" }; },
    async verifyRights() { return true; },
    async revokeRights() { return { transactionHash: "0xrevoke" }; },
  };
}

describe("Phase 2 backend boundary", () => {
  let server: ReturnType<typeof app.listen>;
  let address: string;
  before(() => {
    process.env.ARTSHIELD_PROTECTION_TOKEN = "test-protection-token";
    process.env.ARTSHIELD_REGISTRY_TOKEN = "test-registry-token";
    process.env.ARTSHIELD_OWNERSHIP_TOKEN = "test-ownership-token";
    process.env.ARTSHIELD_MUTATION_ROLE = "operator";
    setPhase2ClientFactoryForTests(fakeClient);
    setCertificateIssuerForTests(async () => ({ tokenId: "1", transactionHash: "0xcertificate", contractAddress: "0xcontract", chainId: "31337", artworkHash: `0x${fingerprint}`, metadataHash, metadataUri: "local://test" }));
    server = app.listen(0);
    const bound = server.address();
    if (!bound || typeof bound === "string") throw new Error("test server did not bind");
    address = `http://127.0.0.1:${bound.port}`;
  });
  after(() => { resetPhase2ClientFactoryForTests(); resetCertificateIssuerForTests(); delete process.env.ARTSHIELD_PROTECTION_TOKEN; delete process.env.ARTSHIELD_REGISTRY_TOKEN; delete process.env.ARTSHIELD_OWNERSHIP_TOKEN; delete process.env.ARTSHIELD_MUTATION_ROLE; server.close(); });

  it("rejects transfer authorization when the backend signer is not the current owner", () => {
    assert.throws(() => assertSignerOwnsArtwork(grantee, creator), Phase2AuthorizationError);
  });

  it("returns JSON 404 and 405 responses for unsupported API paths and methods", async () => {
    const missing = await fetch(`${address}/api/does-not-exist`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "Not Found", code: "NOT_FOUND" });

    const unsupported = await fetch(`${address}/api/system-status`, { method: "PUT", headers: { "content-type": "application/json" }, body: "{}" });
    assert.equal(unsupported.status, 405);
    assert.equal(unsupported.headers.get("allow"), "GET");
    assert.deepEqual(await unsupported.json(), { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
  });

  it("returns only the bounded public system status shape", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      if (String(input).endsWith("/v1/health")) return new Response("{}", { status: 200 });
      return originalFetch(input, init);
    };
    try {
      const response = await fetch(`${address}/api/system-status`);
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(await response.json()).sort(), ["backend", "blockchain", "ml"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("sanitizes malformed request errors", async () => {
    const response = await fetch(`${address}/api/system-status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"internalSecret":"do-not-leak"',
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid request", code: "INVALID_REQUEST" });
  });

  it("rejects privileged credentials outside their mutation scope", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const registerBody = JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1", creator });
    const protectionBody = JSON.stringify({ imageBase64: "aGVsbG8=", watermark: "x", metadata: {} });
    const rightsBody = JSON.stringify({ artworkFingerprint: fingerprint, grantee, rightsMask: 4, metadataUri: "ipfs://rights" });

    try {
      assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: protectionHeaders, body: registerBody })).status, 401);
      assert.equal((await fetch(`${address}/api/rights`, { method: "POST", headers: registryHeaders, body: rightsBody })).status, 401);
      assert.equal((await fetch(`${address}/api/protection`, { method: "POST", headers: ownershipHeaders, body: protectionBody })).status, 401);
      assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { ...registryHeaders, authorization: "Bearer test-mutation-token" }, body: registerBody })).status, 401);
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("registers, queries provenance, issues, verifies, and revokes rights", async () => {
    const registerResponse = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: registryHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1", creator }) });
    assert.equal(registerResponse.status, 201);
    assert.equal((await registerResponse.json()).transactionHash, "0xregister");
    assert.equal((await fetch(`${address}/api/artworks/${fingerprint}/provenance`)).status, 200);
    const rightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee, rightsMask: 4, metadataUri: "ipfs://rights" }) });
    assert.equal(rightsResponse.status, 201);
    const verifyResponse = await fetch(`${address}/api/rights/1/verify?rightsMask=4`);
    assert.deepEqual(await verifyResponse.json(), { valid: true });
    assert.equal((await fetch(`${address}/api/rights/1/revoke`, { method: "POST", headers: ownershipHeaders })).status, 200);
  });

  it("rejects invalid hashes, zero addresses, and invalid rights", async () => {
    const response = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: registryHeaders, body: JSON.stringify({ artworkFingerprint: "../secret", metadataHash, certificateTokenId: "1", creator }) });
    assert.equal(response.status, 422);
    const rightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: "0x0000000000000000000000000000000000000000", rightsMask: 0, metadataUri: "" }) });
    assert.equal(rightsResponse.status, 422);
    const missingRights = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({}) });
    assert.equal(missingRights.status, 422);
    const invalidRightsUri = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee, rightsMask: 1, metadataUri: "not-a-uri" }) });
    assert.equal(invalidRightsUri.status, 422);
    const verifyResponse = await fetch(`${address}/api/rights/not-a-token/verify?rightsMask=4`);
    assert.equal(verifyResponse.status, 422);
    const missingRegistration = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: registryHeaders, body: JSON.stringify({}) });
    assert.equal(missingRegistration.status, 422);
    const invalidTokenId = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: registryHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "not-a-number", creator }) });
    assert.equal(invalidTokenId.status, 422);
    const oversizedTokenId = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: registryHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1".repeat(80), creator }) });
    assert.equal(oversizedTokenId.status, 422);
    const oversizedRightsToken = await fetch(`${address}/api/rights/${"1".repeat(80)}/verify?rightsMask=4`);
    assert.equal(oversizedRightsToken.status, 422);
    const missingLookup = await fetch(`${address}/api/artworks/${encodeURIComponent(undefined as never)}`);
    assert.equal(missingLookup.status, 422);
  });

  it("supports ownership transfer through the backend boundary", async () => {
    const response = await fetch(`${address}/api/artworks/transfer`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, newOwner: grantee }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).transactionHash, "0xtransfer");
  });

  it("protects signer-backed mutations with 401 and 403 responses", async () => {
    const body = JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1", creator });
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { "content-type": "application/json" }, body })).status, 401);
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer wrong", "x-artshield-role": "operator" }, body })).status, 401);
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { ...registryHeaders, "x-artshield-role": "viewer" }, body })).status, 403);
    const certificate = await fetch(`${address}/api/certificates`, { method: "POST", headers: registryHeaders, body: JSON.stringify({ recipient: creator, artworkFingerprint: fingerprint, metadata: { title: "test" }, metadataUri: "local://test" }) });
    assert.equal(certificate.status, 201);
    assert.equal((await certificate.json()).transactionHash, "0xcertificate");
  });
});
