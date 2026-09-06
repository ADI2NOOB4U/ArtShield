import { expect } from "chai";
import { ethers } from "hardhat";

describe("UsageRightsToken", function () {
  async function deployed() {
    const [admin, artist, grantee, other] = await ethers.getSigners();
    const ownershipFactory = await ethers.getContractFactory("ArtShieldOwnership");
    const ownership = await ownershipFactory.deploy();
    await ownership.waitForDeployment();
    const rightsFactory = await ethers.getContractFactory("UsageRightsToken");
    const rights = await rightsFactory.deploy(await ownership.getAddress());
    await rights.waitForDeployment();
    const artworkHash = ethers.keccak256(ethers.toUtf8Bytes("artwork"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
    await ownership.registerArtwork(artworkHash, metadataHash, 1, artist.address);
    return { ownership, rights, admin, artist, grantee, other, artworkHash };
  }

  it("issues and verifies explicit usage rights", async function () {
    const { rights, artist, grantee, artworkHash } = await deployed();
    const commercial = await rights.COMMERCIAL_USE();
    await expect(rights.connect(artist).issueRights(artworkHash, grantee.address, commercial, 0, "uri"))
      .to.emit(rights, "RightsIssued");
    expect(await rights.ownerOf(1)).to.equal(grantee.address);
    expect(await rights.verifyRights(1, commercial)).to.equal(true);
    expect(await rights.verifyRights(1, await rights.AI_TRAINING())).to.equal(false);
  });

  it("rejects unauthorized, invalid, and conflicting rights", async function () {
    const { rights, artist, grantee, other, artworkHash } = await deployed();
    const viewing = await rights.VIEWING();
    await expect(rights.connect(other).issueRights(artworkHash, grantee.address, viewing, 0, "uri"))
      .to.be.revertedWithCustomError(rights, "ArtworkOwnerOnly");
    await expect(rights.connect(artist).issueRights(artworkHash, grantee.address, 0, 0, "uri"))
      .to.be.revertedWithCustomError(rights, "InvalidRightsMask");
    await rights.connect(artist).issueRights(artworkHash, grantee.address, viewing, 0, "uri");
    await expect(rights.connect(artist).issueRights(artworkHash, grantee.address, viewing, 0, "uri"))
      .to.be.revertedWithCustomError(rights, "RightsConflict");
  });

  it("supports expiration and authorized revocation only", async function () {
    const { rights, ownership, artist, grantee, other, artworkHash } = await deployed();
    const viewing = await rights.VIEWING();
    const latest = await ethers.provider.getBlock("latest");
    const expiry = BigInt((latest?.timestamp ?? 0) + 60);
    await rights.connect(artist).issueRights(artworkHash, grantee.address, viewing, expiry, "uri");
    await expect(rights.connect(other).revokeRights(1)).to.be.revertedWithCustomError(rights, "ArtworkOwnerOnly");
    await expect(rights.connect(artist).revokeRights(1)).to.emit(rights, "RightsRevoked");
    expect(await rights.verifyRights(1, viewing)).to.equal(false);
    await ownership.connect(artist).transferArtwork(artworkHash, other.address);
    const secondBlock = await ethers.provider.getBlock("latest");
    const secondExpiry = BigInt((secondBlock?.timestamp ?? 0) + 60);
    await rights.connect(other).issueRights(artworkHash, grantee.address, viewing, secondExpiry, "uri");
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);
    expect(await rights.verifyRights(2, viewing)).to.equal(false);
  });

  it("rejects zero grantees and invalid expirations", async function () {
    const { rights, artist, artworkHash } = await deployed();
    const viewing = await rights.VIEWING();
    await expect(rights.connect(artist).issueRights(artworkHash, ethers.ZeroAddress, viewing, 0, "uri"))
      .to.be.revertedWithCustomError(rights, "InvalidAddress");
    const latest = await ethers.provider.getBlock("latest");
    await expect(rights.connect(artist).issueRights(artworkHash, artist.address, viewing, latest?.timestamp ?? 0, "uri"))
      .to.be.revertedWithCustomError(rights, "InvalidExpiration");
  });
});
