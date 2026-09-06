import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtShieldOwnership", function () {
  async function deployed() {
    const [admin, artist, buyer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ArtShieldOwnership");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return { contract, admin, artist, buyer, other };
  }

  it("registers an artwork and records provenance", async function () {
    const { contract, admin, artist } = await deployed();
    const artworkHash = ethers.keccak256(ethers.toUtf8Bytes("artwork"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
    await expect(contract.registerArtwork(artworkHash, metadataHash, 1, artist.address))
      .to.emit(contract, "ArtworkRegistered")
      .withArgs(artworkHash, artist.address, artist.address, metadataHash, 1);
    expect(await contract.currentOwner(artworkHash)).to.equal(artist.address);
    expect((await contract.provenance(artworkHash)).length).to.equal(1);
    await expect(contract.registerArtwork(artworkHash, metadataHash, 1, artist.address))
      .to.be.revertedWithCustomError(contract, "ArtworkAlreadyRegistered");
    expect(await contract.owner()).to.equal(admin.address);
  });

  it("allows only the current artwork owner to transfer ownership", async function () {
    const { contract, artist, buyer, other } = await deployed();
    const artworkHash = ethers.keccak256(ethers.toUtf8Bytes("artwork"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
    await contract.registerArtwork(artworkHash, metadataHash, 1, artist.address);
    await expect(contract.connect(other).transferArtwork(artworkHash, buyer.address))
      .to.be.revertedWithCustomError(contract, "UnauthorizedOwner");
    await expect(contract.connect(artist).transferArtwork(artworkHash, buyer.address))
      .to.emit(contract, "OwnershipTransferredForArtwork");
    expect(await contract.currentOwner(artworkHash)).to.equal(buyer.address);
    expect((await contract.provenance(artworkHash)).length).to.equal(2);
    await expect(contract.connect(artist).transferArtwork(artworkHash, other.address))
      .to.be.revertedWithCustomError(contract, "UnauthorizedOwner");
  });

  it("rejects zero and unknown artwork identities", async function () {
    const { contract, artist } = await deployed();
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
    await expect(contract.registerArtwork(ethers.ZeroHash, metadataHash, 1, artist.address))
      .to.be.revertedWithCustomError(contract, "EmptyArtworkHash");
    await expect(contract.currentOwner(ethers.ZeroHash))
      .to.be.revertedWithCustomError(contract, "ArtworkNotRegistered");
  });
});
