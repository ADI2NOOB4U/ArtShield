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
    const certificateInterface = new ethers.Interface(["event CertificateIssued(uint256 indexed tokenId,bytes32 indexed artworkHash,bytes32 indexed metadataHash,address creator,address recipient)"]);
    const ownershipContract = new ethers.Contract(process.env.OWNERSHIP_CONTRACT_ADDRESS!, [
      "function artwork(bytes32) view returns (address creator,address currentOwner,bytes32 metadataHash,uint256 certificateTokenId,uint64 registeredAt,bool registered)",
      "function provenance(bytes32) view returns (bytes32[])",
    ], provider);
    const rightsInterface = new ethers.Interface(["event RightsIssued(uint256 indexed tokenId,bytes32 indexed artworkHash,address indexed grantee,address issuer,uint256 rightsMask,uint64 expiresAt,string metadataUri)"]);
    const rightsContract = new ethers.Contract(process.env.RIGHTS_CONTRACT_ADDRESS!, [
      "function rights(uint256) view returns (tuple(bytes32 artworkHash,address issuer,address grantee,uint256 rightsMask,uint64 expiresAt,bool revoked,string metadataUri))",
      "function ownerOf(uint256) view returns (address)",
      "function rightsForArtwork(bytes32) view returns (uint256[])",
    ], provider);
    const registryHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.ARTSHIELD_REGISTRY_TOKEN}`,
      "x-artshield-role": process.env.ARTSHIELD_MUTATION_ROLE ?? "operator",
    };
    const ownershipHeaders = { ...registryHeaders, authorization: `Bearer ${process.env.ARTSHIELD_OWNERSHIP_TOKEN}` };
    const certificates: Array<{ fingerprint: string; metadata: Record<string, string>; metadataUri: string; body: any }> = [];
    for (const label of ["A", "B", "C", "D", "E"]) {
      const fingerprint = ethers.keccak256(ethers.toUtf8Bytes(`e2e-${label}-${Date.now()}`)).slice(2);
      const metadata = { title: `Local E2E ${label}`, artist: "ArtShield" };
      const metadataUri = `local://e2e-${label}`;
      const certificateResponse = await fetch(`${address}/api/certificates`, {
        method: "POST",
        headers: registryHeaders,
        body: JSON.stringify({ recipient: signer.address, artworkFingerprint: fingerprint, metadata, metadataUri }),
      });
      assert.equal(certificateResponse.status, 201);
      const body = await certificateResponse.json();
      assert.match(body.tokenId, /^\d+$/);
      assert.match(body.transactionHash, /^0x[0-9a-f]{64}$/i);
      const receipt = await provider.getTransactionReceipt(body.transactionHash);
      assert.ok(receipt);
      const events = receipt.logs.flatMap((log) => {
        try { const parsed = certificateInterface.parseLog(log); return parsed?.name === "CertificateIssued" ? [parsed] : []; } catch { return []; }
      });
      assert.equal(events.length, 1);
      assert.equal(events[0].args.tokenId.toString(), body.tokenId);
      assert.equal(events[0].args.artworkHash, `0x${fingerprint}`);
      assert.equal(events[0].args.metadataHash, body.metadataHash);
      const certificateContract = new ethers.Contract(process.env.CERTIFICATE_CONTRACT_ADDRESS!, [
        "function ownerOf(uint256) view returns (address)",
        "function tokenURI(uint256) view returns (string)",
        "function certificate(uint256) view returns (bytes32 artworkHash,bytes32 metadataHash,uint64 issuedAt,address creator)",
        "function certificateForArtwork(bytes32) view returns (uint256)",
      ], provider);
      const onChain = await certificateContract.certificate(body.tokenId);
      assert.equal(onChain.artworkHash, `0x${fingerprint}`);
      assert.equal(await certificateContract.ownerOf(body.tokenId), signer.address);
      assert.equal(await certificateContract.tokenURI(body.tokenId), metadataUri);
      assert.equal((await certificateContract.certificateForArtwork(`0x${fingerprint}`)).toString(), body.tokenId);
      assert.equal(onChain.creator, signer.address);
      assert.ok(Number(onChain.issuedAt) > 0);
      certificates.push({ fingerprint, metadata, metadataUri, body });
    }
    assert.equal(new Set(certificates.map((entry) => entry.body.tokenId)).size, 5);
    const duplicate = await fetch(`${address}/api/certificates`, {
      method: "POST",
      headers: registryHeaders,
      body: JSON.stringify({ recipient: signer.address, artworkFingerprint: certificates[0].fingerprint, metadata: certificates[0].metadata, metadataUri: certificates[0].metadataUri }),
    });
    assert.equal(duplicate.status, 409);
    const fingerprint = certificates[0].fingerprint;
    const certificate = certificates[0].body;

    const registrationResponse = await fetch(`${address}/api/artworks/register`, {
      method: "POST",
      headers: registryHeaders,
      body: JSON.stringify({
        artworkFingerprint: fingerprint,
        metadataHash: certificate.metadataHash,
        certificateTokenId: certificate.tokenId,
        creator: signer.address,
      }),
    });
    assert.equal(registrationResponse.status, 201);
    assert.match((await registrationResponse.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    for (const entry of certificates.slice(1, 3)) {
      const independentRegistration = await fetch(`${address}/api/artworks/register`, {
        method: "POST",
        headers: registryHeaders,
        body: JSON.stringify({ artworkFingerprint: entry.fingerprint, metadataHash: entry.body.metadataHash, certificateTokenId: entry.body.tokenId, creator: signer.address }),
      });
      assert.equal(independentRegistration.status, 201);
    }
    const duplicateRegistration = await fetch(`${address}/api/artworks/register`, {
      method: "POST",
      headers: registryHeaders,
      body: JSON.stringify({ artworkFingerprint: fingerprint, metadataHash: certificate.metadataHash, certificateTokenId: certificate.tokenId, creator: signer.address }),
    });
    assert.equal(duplicateRegistration.status, 409);
    for (const entry of certificates.slice(0, 3)) {
      const lookup = await fetch(`${address}/api/artworks/${entry.fingerprint}`);
      assert.equal(lookup.status, 200);
      const apiArtwork = await lookup.json();
      const directArtwork = await ownershipContract.artwork(`0x${entry.fingerprint}`);
      assert.equal(apiArtwork.currentOwner, directArtwork.currentOwner);
      assert.equal(apiArtwork.creator, directArtwork.creator);
      assert.equal(apiArtwork.metadataHash, directArtwork.metadataHash);
      assert.equal(apiArtwork.certificateTokenId, directArtwork.certificateTokenId.toString());
      assert.equal(apiArtwork.registered, directArtwork.registered);
      const history = await fetch(`${address}/api/artworks/${entry.fingerprint}/provenance`);
      assert.deepEqual(await history.json(), (await ownershipContract.provenance(`0x${entry.fingerprint}`)).map((value: string) => value.toLowerCase()));
    }

    const unauthorizedRights = await fetch(`${address}/api/rights`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://unauthorized" }) });
    assert.equal(unauthorizedRights.status, 401);
    const wrongRoleRights = await fetch(`${address}/api/rights`, { method: "POST", headers: { ...ownershipHeaders, "x-artshield-role": "viewer" }, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://wrong-role" }) });
    assert.equal(wrongRoleRights.status, 403);
    const rightsResponse = await fetch(`${address}/api/rights`, {
      method: "POST",
      headers: ownershipHeaders,
      body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://e2e-rights" }),
    });
    assert.equal(rightsResponse.status, 201);
    const rights = await rightsResponse.json();
    assert.match(rights.tokenId, /^\d+$/);
    const rightsReceipt = await provider.getTransactionReceipt(rights.transactionHash);
    assert.ok(rightsReceipt);
    const rightsEvents = rightsReceipt.logs.flatMap((log) => { try { const parsed = rightsInterface.parseLog(log); return parsed?.name === "RightsIssued" ? [parsed] : []; } catch { return []; } });
    assert.equal(rightsEvents.length, 1);
    assert.equal(rightsEvents[0].args.tokenId.toString(), rights.tokenId);
    const directRights = await rightsContract.rights(rights.tokenId);
    assert.equal(directRights[0], `0x${fingerprint}`);
    assert.equal(directRights[2], signer.address);
    assert.equal(directRights[3], 4n);
    assert.equal(directRights[6], "local://e2e-rights");
    assert.equal(await rightsContract.ownerOf(rights.tokenId), signer.address);
    assert.deepEqual((await rightsContract.rightsForArtwork(`0x${fingerprint}`)).map((value: bigint) => value.toString()), [rights.tokenId]);
    const secondRightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 1, metadataUri: "local://e2e-viewing" }) });
    assert.equal(secondRightsResponse.status, 201);
    const secondRights = await secondRightsResponse.json();
    assert.notEqual(secondRights.tokenId, rights.tokenId);
    const independentRightsResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: certificates[1].fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://e2e-independent" }) });
    assert.equal(independentRightsResponse.status, 201);
    const independentRights = await independentRightsResponse.json();
    const conflictRights = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 4, metadataUri: "local://e2e-conflict" }) });
    assert.equal(conflictRights.status, 409);
    const rightsVerification = await fetch(`${address}/api/rights/${rights.tokenId}/verify?rightsMask=4`);
    assert.deepEqual(await rightsVerification.json(), { valid: true });
    const secondRightsVerification = await fetch(`${address}/api/rights/${secondRights.tokenId}/verify?rightsMask=1`);
    assert.deepEqual(await secondRightsVerification.json(), { valid: true });
    const independentRightsVerification = await fetch(`${address}/api/rights/${independentRights.tokenId}/verify?rightsMask=4`);
    assert.deepEqual(await independentRightsVerification.json(), { valid: true });
    const latest = await provider.getBlock("latest");
    const expiringResponse = await fetch(`${address}/api/rights`, { method: "POST", headers: ownershipHeaders, body: JSON.stringify({ artworkFingerprint: fingerprint, grantee: signer.address, rightsMask: 8, expiresAt: Number(latest!.timestamp) + 30, metadataUri: "local://e2e-expiring" }) });
    assert.equal(expiringResponse.status, 201);
    const expiringRights = await expiringResponse.json();
    assert.deepEqual(await (await fetch(`${address}/api/rights/${expiringRights.tokenId}/verify?rightsMask=8`)).json(), { valid: true });
    await provider.send("evm_increaseTime", [31]);
    await provider.send("evm_mine", []);
    assert.deepEqual(await (await fetch(`${address}/api/rights/${expiringRights.tokenId}/verify?rightsMask=8`)).json(), { valid: false });
    const revocation = await fetch(`${address}/api/rights/${rights.tokenId}/revoke`, { method: "POST", headers: ownershipHeaders });
    assert.equal(revocation.status, 200);
    assert.match(rights.transactionHash, /^0x[0-9a-f]{64}$/i);
    assert.match((await revocation.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    const revokedVerification = await fetch(`${address}/api/rights/${rights.tokenId}/verify?rightsMask=4`);
    assert.deepEqual(await revokedVerification.json(), { valid: false });
    assert.deepEqual(await (await fetch(`${address}/api/rights/${secondRights.tokenId}/verify?rightsMask=1`)).json(), { valid: true });
    assert.deepEqual(await (await fetch(`${address}/api/rights/${independentRights.tokenId}/verify?rightsMask=4`)).json(), { valid: true });

    const newOwner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const transfer = await fetch(`${address}/api/artworks/transfer`, {
      method: "POST",
      headers: ownershipHeaders,
      body: JSON.stringify({ artworkFingerprint: fingerprint, newOwner }),
    });
    assert.equal(transfer.status, 200);
    assert.match((await transfer.json()).transactionHash, /^0x[0-9a-f]{64}$/i);
    const transferredLookup = await fetch(`${address}/api/artworks/${fingerprint}`);
    const transferredApiArtwork = await transferredLookup.json();
    const transferredDirectArtwork = await ownershipContract.artwork(`0x${fingerprint}`);
    assert.equal(transferredApiArtwork.currentOwner, transferredDirectArtwork.currentOwner);
    assert.equal(transferredApiArtwork.currentOwner, newOwner);
    const transferredHistory = await fetch(`${address}/api/artworks/${fingerprint}/provenance`);
    assert.deepEqual(await transferredHistory.json(), (await ownershipContract.provenance(`0x${fingerprint}`)).map((value: string) => value.toLowerCase()));
    for (const entry of certificates.slice(1, 3)) {
      const unchangedLookup = await fetch(`${address}/api/artworks/${entry.fingerprint}`);
      assert.equal((await unchangedLookup.json()).currentOwner, signer.address);
    }
  });
});
