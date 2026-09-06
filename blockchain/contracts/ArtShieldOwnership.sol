// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArtShieldOwnership is Ownable {
	struct Artwork {
		address creator;
		address currentOwner;
		bytes32 metadataHash;
		uint256 certificateTokenId;
		uint64 registeredAt;
		bool registered;
	}

	mapping(bytes32 artworkHash => Artwork artwork) private _artworks;
	mapping(bytes32 artworkHash => bytes32[]) private _provenance;

	error ArtworkAlreadyRegistered(bytes32 artworkHash);
	error ArtworkNotRegistered(bytes32 artworkHash);
	error EmptyArtworkHash();
	error EmptyMetadataHash();
	error InvalidAddress();
	error UnauthorizedOwner();

	event ArtworkRegistered(bytes32 indexed artworkHash, address indexed creator, address indexed owner, bytes32 metadataHash, uint256 certificateTokenId);
	event OwnershipTransferredForArtwork(bytes32 indexed artworkHash, address indexed previousOwner, address indexed newOwner);
	event ProvenanceRecorded(bytes32 indexed artworkHash, bytes32 indexed metadataHash, address indexed actor, bytes32 eventReference);

	constructor() Ownable(msg.sender) {}

	function registerArtwork(bytes32 artworkHash, bytes32 metadataHash, uint256 certificateTokenId, address creator) external onlyOwner {
		if (artworkHash == bytes32(0)) revert EmptyArtworkHash();
		if (metadataHash == bytes32(0)) revert EmptyMetadataHash();
		if (creator == address(0)) revert InvalidAddress();
		if (_artworks[artworkHash].registered) revert ArtworkAlreadyRegistered(artworkHash);
		_artworks[artworkHash] = Artwork(creator, creator, metadataHash, certificateTokenId, uint64(block.timestamp), true);
		_provenance[artworkHash].push(metadataHash);
		emit ArtworkRegistered(artworkHash, creator, creator, metadataHash, certificateTokenId);
		emit ProvenanceRecorded(artworkHash, metadataHash, creator, keccak256(abi.encodePacked(block.number, artworkHash)));
	}

	function transferArtwork(bytes32 artworkHash, address newOwner) external {
		Artwork storage record = _artworks[artworkHash];
		if (!record.registered) revert ArtworkNotRegistered(artworkHash);
		if (msg.sender != record.currentOwner) revert UnauthorizedOwner();
		if (newOwner == address(0)) revert InvalidAddress();
		address previousOwner = record.currentOwner;
		record.currentOwner = newOwner;
		emit OwnershipTransferredForArtwork(artworkHash, previousOwner, newOwner);
		_provenance[artworkHash].push(record.metadataHash);
		emit ProvenanceRecorded(artworkHash, record.metadataHash, msg.sender, keccak256(abi.encodePacked(previousOwner, newOwner, block.number)));
	}

	function artwork(bytes32 artworkHash) external view returns (Artwork memory) {
		if (!_artworks[artworkHash].registered) revert ArtworkNotRegistered(artworkHash);
		return _artworks[artworkHash];
	}

	function currentOwner(bytes32 artworkHash) external view returns (address) {
		if (!_artworks[artworkHash].registered) revert ArtworkNotRegistered(artworkHash);
		return _artworks[artworkHash].currentOwner;
	}

	function provenance(bytes32 artworkHash) external view returns (bytes32[] memory) {
		if (!_artworks[artworkHash].registered) revert ArtworkNotRegistered(artworkHash);
		return _provenance[artworkHash];
	}
}
