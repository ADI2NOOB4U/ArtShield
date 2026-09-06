import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { app } from "../src/app.js";
import { resetCertificateIssuerForTests, setCertificateIssuerForTests } from "../src/controllers/blockchain.controller.js";
import { resetPhase2ClientFactoryForTests, setPhase2ClientFactoryForTests } from "../src/services/blockchain/phase2.service.js";

const fingerprint = "a".repeat(64);
const metadataHash = `0x${"b".repeat(64)}`;
const creator = "0x0000000000000000000000000000000000000001";
const grantee = "0x0000000000000000000000000000000000000002";
const authHeaders = { "content-type": "application/json", authorization: "Bearer test-mutation-token", "x-artshield-role": "operator" };

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
    process.env.ARTSHIELD_MUTATION_TOKEN = "test-mutation-token";
    process.env.ARTSHIELD_MUTATION_ROLE = "operator";
    setPhase2ClientFactoryForTests(fakeClient);
    setCertificateIssuerForTests(async () => ({ tokenId: "1", transactionHash: "0xcertificate", contractAddress: "0xcontract", chainId: "31337", artworkHash: `0x${fingerprint}`, metadataHash, metadataUri: "local://test" }));
    server = app.listen(0);
    const bound = server.address();
    if (!bound || typeof bound === "string") throw new Error("test server did not bind");
    address = `http://127.0.0.1:${bound.port}`;
  });
  after(() => { resetPhase2ClientFactoryForTests(); resetCertificateIssuerForTests(); delete process.env.ARTSHIELD_MUTATION_TOKEN; delete process.env.ARTSHIELD_MUTATION_ROLE; server.close(); });

  it("registers, queries provenance, issues, verifies, and revokes rights", async () => {
    const registerResponse = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1", creator }) });
    assert.equal(registerResponse.status, 201);
    assert.equal((await registerResponse.json()).transactionHash, "0xregister");
    assert.equal((await fetch(`${address}/api/artworks/${fingerprint}/provenance`)).status, 200);
    const rightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee, rightsMask: 4, metadataUri: "ipfs://rights" }) });
    assert.equal(rightsResponse.status, 201);
    const verifyResponse = await fetch(`${address}/api/rights/1/verify?rightsMask=4`);
    assert.deepEqual(await verifyResponse.json(), { valid: true });
    assert.equal((await fetch(`${address}/api/rights/1/revoke`, { method: "POST", headers: authHeaders })).status, 200);
  });

  it("rejects invalid hashes, zero addresses, and invalid rights", async () => {
    const response = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: "../secret", metadataHash, certificateTokenId: "1", creator }) });
    assert.equal(response.status, 422);
    const rightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: "0x0000000000000000000000000000000000000000", rightsMask: 0, metadataUri: "" }) });
    assert.equal(rightsResponse.status, 422);
    const missingRights = await fetch(`${address}/api/rights`, { method: "POST", headers: authHeaders, body: JSON.stringify({}) });
    assert.equal(missingRights.status, 422);
    const invalidRightsUri = await fetch(`${address}/api/rights`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee, rightsMask: 1, metadataUri: "not-a-uri" }) });
    assert.equal(invalidRightsUri.status, 422);
    const verifyResponse = await fetch(`${address}/api/rights/not-a-token/verify?rightsMask=4`);
    assert.equal(verifyResponse.status, 422);
    const missingRegistration = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: authHeaders, body: JSON.stringify({}) });
    assert.equal(missingRegistration.status, 422);
    const invalidTokenId = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "not-a-number", creator }) });
    assert.equal(invalidTokenId.status, 422);
    const oversizedTokenId = await fetch(`${address}/api/artworks/register`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1".repeat(80), creator }) });
    assert.equal(oversizedTokenId.status, 422);
    const oversizedRightsToken = await fetch(`${address}/api/rights/${"1".repeat(80)}/verify?rightsMask=4`);
    assert.equal(oversizedRightsToken.status, 422);
    const missingLookup = await fetch(`${address}/api/artworks/${encodeURIComponent(undefined as never)}`);
    assert.equal(missingLookup.status, 422);
  });

  it("supports ownership transfer through the backend boundary", async () => {
    const response = await fetch(`${address}/api/artworks/transfer`, { method: "POST", headers: authHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, newOwner: grantee }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).transactionHash, "0xtransfer");
  });

  it("protects signer-backed mutations with 401 and 403 responses", async () => {
    const body = JSON.stringify({ artworkFingerprint: fingerprint, metadataHash, certificateTokenId: "1", creator });
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { "content-type": "application/json" }, body })).status, 401);
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer wrong", "x-artshield-role": "operator" }, body })).status, 401);
    assert.equal((await fetch(`${address}/api/artworks/register`, { method: "POST", headers: { ...authHeaders, "x-artshield-role": "viewer" }, body })).status, 403);
    const certificate = await fetch(`${address}/api/certificates`, { method: "POST", headers: authHeaders, body: JSON.stringify({ recipient: creator, artworkFingerprint: fingerprint, metadata: { title: "test" }, metadataUri: "local://test" }) });
    assert.equal(certificate.status, 201);
    assert.equal((await certificate.json()).transactionHash, "0xcertificate");
  });
});
