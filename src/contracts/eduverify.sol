// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* ============================
   OpenZeppelin Imports
============================ */
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/* ============================
   Academic Credential NFT
============================ */
contract AcademicCredentialNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    /* ============================
       Certificate Structure
    ============================ */
    struct Certificate {
        string studentName;
        string degree;
        string university;
        bool exists;
    }

    /* ============================
       Storage
    ============================ */
    mapping(uint256 => Certificate) private certificates;

    // Authorized institution wallets
    mapping(address => bool) public authorizedIssuers;

    bool private contractPaused = false;

    /* ============================
       Events
    ============================ */
    event CertificateMinted(address indexed recipient, uint256 indexed tokenId);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event OwnershipUpdated(address indexed previousOwner, address indexed newOwner);
    event EmergencyStopActivated(address indexed owner);
    event EmergencyStopReleased(address indexed owner);

    /* ============================
       Constructor
    ============================ */
    constructor() ERC721("AcademicCredentialNFT", "ACNFT") Ownable(msg.sender) {}

    /* ============================
       Modifiers
    ============================ */
    modifier whenNotPaused() {
        require(!contractPaused, "Contract is paused");
        _;
    }

    modifier onlyIssuer() {
        require(
            msg.sender == owner() || authorizedIssuers[msg.sender],
            "Not authorized issuer"
        );
        _;
    }

    /* ============================
       Internal Helpers
    ============================ */
    function _certificateExists(uint256 tokenId) internal view returns (bool) {
        return certificates[tokenId].exists;
    }

    /* ============================
       Issuer Management (ADMIN)
    ============================ */
    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    /* ============================
       Mint Certificate (CORE)
    ============================ */
    function mintCertificate(
        address recipient,
        string memory studentName,
        string memory degree,
        string memory university,
        string memory certificateURI
    )
        public
        onlyIssuer
        whenNotPaused
    {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(studentName).length > 0 && bytes(studentName).length <= 50, "Invalid student name");
        require(bytes(degree).length > 0, "Degree cannot be empty");
        require(bytes(university).length > 0, "University cannot be empty");
        require(bytes(certificateURI).length > 0, "URI required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, certificateURI);

        certificates[tokenId] = Certificate({
            studentName: studentName,
            degree: degree,
            university: university,
            exists: true
        });

        emit CertificateMinted(recipient, tokenId);
    }
// Accept ETH transfers (optional, future-proof)
receive() external payable {}

fallback() external payable {}

    /* ============================
       Admin-Only Certificate Data
    ============================ */
    function getCertificateDetails(uint256 tokenId)
        public
        view
        whenNotPaused
        returns (
            string memory studentName,
            string memory degree,
            string memory university,
            string memory uri
        )
    {
        require(_certificateExists(tokenId), "Certificate does not exist");
        require(msg.sender == owner(), "Admin only");

        Certificate memory cert = certificates[tokenId];
        return (
            cert.studentName,
            cert.degree,
            cert.university,
            tokenURI(tokenId)
        );
    }

    /* ============================
       Public Verification (SAFE)
    ============================ */
    function verifyCertificate(uint256 tokenId)
        public
        view
        returns (
            string memory studentName,
            string memory degree,
            string memory university,
            string memory uri
        )
    {
        require(_certificateExists(tokenId), "Certificate does not exist");

        Certificate memory cert = certificates[tokenId];
        return (
            cert.studentName,
            cert.degree,
            cert.university,
            tokenURI(tokenId)
        );
    }

    /* ============================
       Admin Controls
    ============================ */
    function updateOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner();
        transferOwnership(newOwner);
        emit OwnershipUpdated(oldOwner, newOwner);
    }

    function emergencyStop() public onlyOwner {
        contractPaused = true;
        emit EmergencyStopActivated(msg.sender);
    }

    function resumeContract() public onlyOwner {
        contractPaused = false;
        emit EmergencyStopReleased(msg.sender);
    }

    /* ============================
       Overrides
    ============================ */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
