import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtShieldCertificate", function () {
  async function deployed() {
    const [owner, artist, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ArtShieldCertificate");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return { contract, owner, artist, other };
  }

  it("issues a provenance-bound ERC-721 certificate", async function () {
    const { contract, artist } = await deployed();
    const artworkHash = ethers.keccak256(ethers.toUtf8Bytes("artwork"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));

    await expect(contract.issueCertificate(artist.address, artworkHash, metadataHash, "ipfs://metadata"))
      .to.emit(contract, "CertificateIssued")
      .withArgs(1, artworkHash, metadataHash, artist.address, artist.address);

    expect(await contract.ownerOf(1)).to.equal(artist.address);
    expect(await contract.tokenURI(1)).to.equal("ipfs://metadata");
    expect(await contract.certificateForArtwork(artworkHash)).to.equal(1);
    const certificate = await contract.certificate(1);
    expect(certificate.artworkHash).to.equal(artworkHash);
    expect(certificate.metadataHash).to.equal(metadataHash);
    expect(certificate.creator).to.equal(artist.address);
  });

  it("rejects duplicate artwork certificates and unauthorized issuance", async function () {
    const { contract, artist, other } = await deployed();
    const artworkHash = ethers.keccak256(ethers.toUtf8Bytes("artwork"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));

    await expect(contract.connect(other).issueCertificate(artist.address, artworkHash, metadataHash, "uri"))
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    await contract.issueCertificate(artist.address, artworkHash, metadataHash, "uri");
    await expect(contract.issueCertificate(artist.address, artworkHash, metadataHash, "uri"))
      .to.be.revertedWithCustomError(contract, "ArtworkAlreadyCertified");
  });

  it("rejects empty hashes", async function () {
    const { contract, artist } = await deployed();
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
    await expect(contract.issueCertificate(artist.address, ethers.ZeroHash, metadataHash, "uri"))
      .to.be.revertedWithCustomError(contract, "EmptyArtworkHash");
  });
});