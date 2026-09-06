import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { ethers } from "ethers";

import { app } from "../src/app.js";

const enabled = process.env.ARTSHIELD_E2E_BLOCKCHAIN === "1";
const e2eTest = enabled ? it : it.skip;

describe("Phase 2 local blockchain integration", () => {
  let server: ReturnType<typeof app.listen>;
  let address: string;

  before(() => {
    if (!enabled) return;
    server = app.listen(0);
    const bound = server.address();
    if (!bound || typeof bound === "string") throw new Error("test server did not bind");
    address = `http://127.0.0.1:${bound.port}`;
  });

  after(() => server?.close());

  e2eTest("performs the real certificate, ownership, and rights workflow", async () => {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const signer = new ethers.Wallet(process.env.CERTIFICATE_SIGNER_PRIVATE_KEY!, provider);
    const fingerprint = ethers.keccak256(ethers.toUtf8Bytes(`e2e-${Date.now()}`)).slice(2);
    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.ARTSHIELD_MUTATION_TOKEN}`,
      "x-artshield-role": process.env.ARTSHIELD_MUTATION_ROLE ?? "operator",
    };
    const certificateResponse = await fetch(`${address}/api/certificates`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        recipient: signer.address,
        artworkFingerprint: fingerprint,
        metadata: { title: "Local E2E", artist: "ArtShield" },
        metadataUri: "local://e2e",
      }),
    });
    assert.equal(certificateResponse.status, 201);
    const certificate = await certificateResponse.json();
    assert.match(certificate.tokenId, /^\d+$/);
    assert.match(certificate.transactionHash, /^0x[0-9a-f]{64}$/i);

    const registrationResponse = await fetch(`${address}/api/artworks/register`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        artworkFingerprint: fingerprint,
        metadataHash: certificate.metadataHash,
        certificateTokenId: certificate.tokenId,
        creator: signer.address,
      }),
    });
    assert.equal(registrationResponse.status, 201);
    assert.match((await registrationResponse.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    const lookup = await fetch(`${address}/api/artworks/${fingerprint}`);
    assert.equal(lookup.status, 200);
    assert.equal((await lookup.json()).currentOwner, signer.address);

    const rightsResponse = await fetch(`${address}/api/rights`, {
      method: "POST",
      headers,
      body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://e2e-rights" }),
    });
    assert.equal(rightsResponse.status, 201);
    const rights = await rightsResponse.json();
    assert.match(rights.tokenId, /^\d+$/);
    const rightsVerification = await fetch(`${address}/api/rights/${rights.tokenId}/verify?rightsMask=4`);
    assert.deepEqual(await rightsVerification.json(), { valid: true });
    const revocation = await fetch(`${address}/api/rights/${rights.tokenId}/revoke`, { method: "POST", headers });
    assert.equal(revocation.status, 200);
    assert.match(rights.transactionHash, /^0x[0-9a-f]{64}$/i);
    assert.match((await revocation.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    const revokedVerification = await fetch(`${address}/api/rights/${rights.tokenId}/verify?rightsMask=4`);
    assert.deepEqual(await revokedVerification.json(), { valid: false });

    const newOwner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const transfer = await fetch(`${address}/api/artworks/transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({ artworkFingerprint: fingerprint, newOwner }),
    });
    assert.equal(transfer.status, 200);
    assert.match((await transfer.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    const transferredLookup = await fetch(`${address}/api/artworks/${fingerprint}`);
    assert.equal((await transferredLookup.json()).currentOwner, newOwner);
  });
});
