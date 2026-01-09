// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin libraries
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AcademicCredentialNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Certificate {
        string studentName;
        string degree;
        string university;
        bool exists;  // ✅ Track existence of certificate
    }

    mapping(uint256 => Certificate) private certificates;
    bool private contractPaused = false;  // ✅ Emergency stop mechanism

    event CertificateMinted(address indexed recipient, uint256 tokenId);
    event OwnershipUpdated(address indexed previousOwner, address indexed newOwner);
    event EmergencyStopActivated(address owner);

    constructor() ERC721("AcademicCredentialNFT", "ACNFT") Ownable(msg.sender) {}

    // ✅ Emergency stop modifier
    modifier whenNotPaused() {
        require(!contractPaused, "Contract is paused");
        _;
    }

    // ✅ Custom function to check existence
    function _certificateExists(uint256 tokenId) internal view returns (bool) {
        return certificates[tokenId].exists;
    }

    // ✅ Mint a certificate (Only Owner)
    function mintCertificate(
        address recipient,
        string memory studentName,
        string memory degree,
        string memory university,
        string memory certificateURI
    ) public onlyOwner whenNotPaused {
        require(bytes(studentName).length <= 50, "Student name too long");  // ✅ Validate input length
        require(bytes(degree).length > 0, "Degree cannot be empty");
        require(bytes(university).length > 0, "University cannot be empty");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, certificateURI);

        certificates[tokenId] = Certificate(studentName, degree, university, true);
        emit CertificateMinted(recipient, tokenId);
    }

    // ✅ Get certificate details (Only Owner)
    function getCertificateDetails(uint256 tokenId)
        public
        view
        whenNotPaused
        returns (string memory studentName, string memory degree, string memory university, string memory ipfsHash)
    {
        require(_certificateExists(tokenId), "Certificate does not exist");
        require(msg.sender == owner(), "Only the contract's owner can access this data"); // ✅ Access control

        Certificate memory cert = certificates[tokenId];
        return (cert.studentName, cert.degree, cert.university, tokenURI(tokenId));
    }

    // ✅ NEW: Public verification function (Anyone can call this)
    function verifyCertificate(uint256 tokenId)
        public
        view
        returns (string memory studentName, string memory degree, string memory university, string memory ipfsHash)
    {
        require(_certificateExists(tokenId), "Certificate does not exist");

        Certificate memory cert = certificates[tokenId];
        return (cert.studentName, cert.degree, cert.university, tokenURI(tokenId));
    }

    // ✅ Update contract ownership (restricted)
    function updateOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        transferOwnership(newOwner);
        emit OwnershipUpdated(msg.sender, newOwner);
    }

    // ✅ Implement emergency stop
    function emergencyStop() public onlyOwner {
        contractPaused = true;
        emit EmergencyStopActivated(msg.sender);
    }

    // ✅ Resume contract operations
    function resumeContract() public onlyOwner {
        contractPaused = false;
    }

    // ✅ Override required ERC721 functions
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