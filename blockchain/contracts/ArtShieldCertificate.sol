// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArtShieldCertificate is ERC721URIStorage, Ownable {
    struct Certificate {
        bytes32 artworkHash;
        bytes32 metadataHash;
        uint64 issuedAt;
        address creator;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 tokenId => Certificate certificate) private _certificates;
    mapping(bytes32 artworkHash => uint256 tokenId) public certificateForArtwork;

    error ArtworkAlreadyCertified(bytes32 artworkHash);
    error EmptyArtworkHash();
    error EmptyMetadataHash();

    event CertificateIssued(
        uint256 indexed tokenId,
        bytes32 indexed artworkHash,
        bytes32 indexed metadataHash,
        address creator,
        address recipient
    );

    constructor() ERC721("ArtShield Certificate", "ASHCERT") Ownable(msg.sender) {}

    function issueCertificate(
        address recipient,
        bytes32 artworkHash,
        bytes32 metadataHash,
        string calldata metadataUri
    ) external onlyOwner returns (uint256 tokenId) {
        if (artworkHash == bytes32(0)) revert EmptyArtworkHash();
        if (metadataHash == bytes32(0)) revert EmptyMetadataHash();
        if (certificateForArtwork[artworkHash] != 0) revert ArtworkAlreadyCertified(artworkHash);

        tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataUri);
        _certificates[tokenId] = Certificate({
            artworkHash: artworkHash,
            metadataHash: metadataHash,
            issuedAt: uint64(block.timestamp),
            creator: recipient
        });
        certificateForArtwork[artworkHash] = tokenId;

        emit CertificateIssued(tokenId, artworkHash, metadataHash, recipient, recipient);
    }

    function certificate(uint256 tokenId) external view returns (Certificate memory) {
        _requireOwned(tokenId);
        return _certificates[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}