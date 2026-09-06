// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IArtShieldOwnership {
	function currentOwner(bytes32 artworkHash) external view returns (address);
}

contract UsageRightsToken is ERC721, Ownable {
	uint256 public constant VIEWING = 1;
	uint256 public constant PERSONAL_USE = 2;
	uint256 public constant COMMERCIAL_USE = 4;
	uint256 public constant DERIVATIVE_USE = 8;
	uint256 public constant REDISTRIBUTION = 16;
	uint256 public constant AI_TRAINING = 32;
	uint256 private constant ALL_RIGHTS = 63;

	struct Rights {
		bytes32 artworkHash;
		address issuer;
		address grantee;
		uint256 rightsMask;
		uint64 expiresAt;
		bool revoked;
	}

	IArtShieldOwnership public immutable ownership;
	uint256 private _nextTokenId = 1;
	mapping(uint256 tokenId => Rights rights) private _rights;
	mapping(bytes32 artworkHash => uint256[]) private _rightsForArtwork;

	error InvalidRightsMask();
	error InvalidExpiration();
	error InvalidAddress();
	error ArtworkOwnerOnly();
	error RightsConflict();
	error RightsNotFound();
	error RightsAlreadyRevoked();

	event RightsIssued(uint256 indexed tokenId, bytes32 indexed artworkHash, address indexed grantee, address issuer, uint256 rightsMask, uint64 expiresAt);
	event RightsRevoked(uint256 indexed tokenId, bytes32 indexed artworkHash, address indexed revoker);

	constructor(address ownershipAddress) ERC721("ArtShield Usage Rights", "ASHRIGHT") Ownable(msg.sender) {
		if (ownershipAddress == address(0)) revert InvalidAddress();
		ownership = IArtShieldOwnership(ownershipAddress);
	}

	function issueRights(bytes32 artworkHash, address grantee, uint256 rightsMask, uint64 expiresAt, string calldata) external returns (uint256 tokenId) {
		if (grantee == address(0)) revert InvalidAddress();
		if (rightsMask == 0 || rightsMask & ~ALL_RIGHTS != 0) revert InvalidRightsMask();
		if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidExpiration();
		if (ownership.currentOwner(artworkHash) != msg.sender) revert ArtworkOwnerOnly();
		uint256[] storage existing = _rightsForArtwork[artworkHash];
		for (uint256 index = 0; index < existing.length; index++) {
			Rights storage prior = _rights[existing[index]];
			if (!prior.revoked && prior.grantee == grantee && prior.rightsMask == rightsMask && (prior.expiresAt == 0 || prior.expiresAt >= block.timestamp)) revert RightsConflict();
		}
		tokenId = _nextTokenId++;
		_safeMint(grantee, tokenId);
		_rights[tokenId] = Rights(artworkHash, msg.sender, grantee, rightsMask, expiresAt, false);
		existing.push(tokenId);
		emit RightsIssued(tokenId, artworkHash, grantee, msg.sender, rightsMask, expiresAt);
	}

	function revokeRights(uint256 tokenId) external {
		Rights storage right = _rights[tokenId];
		if (right.grantee == address(0)) revert RightsNotFound();
		if (right.revoked) revert RightsAlreadyRevoked();
		if (ownership.currentOwner(right.artworkHash) != msg.sender) revert ArtworkOwnerOnly();
		right.revoked = true;
		emit RightsRevoked(tokenId, right.artworkHash, msg.sender);
	}

	function verifyRights(uint256 tokenId, uint256 requestedMask) external view returns (bool) {
		Rights storage right = _rights[tokenId];
		if (right.grantee == address(0)) return false;
		if (right.revoked || requestedMask == 0 || requestedMask & ~ALL_RIGHTS != 0) return false;
		if (right.expiresAt != 0 && right.expiresAt < block.timestamp) return false;
		return right.rightsMask & requestedMask == requestedMask;
	}

	function rights(uint256 tokenId) external view returns (Rights memory) {
		if (_rights[tokenId].grantee == address(0)) revert RightsNotFound();
		return _rights[tokenId];
	}

	function rightsForArtwork(bytes32 artworkHash) external view returns (uint256[] memory) {
		return _rightsForArtwork[artworkHash];
	}

	function transferFrom(address, address, uint256) public pure override {
		revert("rights are non-transferable");
	}

	function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
		revert("rights are non-transferable");
	}
}
