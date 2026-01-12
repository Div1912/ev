/**
 * IPFS Service for uploading and retrieving files
 * Uses Pinata as the IPFS pinning service
 */

const PINATA_API_URL = 'https://api.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface CredentialMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  studentName: string;
  degree: string;
  university: string;
  issuedAt: string;
  issuerAddress: string;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(
  file: File,
  pinataApiKey: string,
  pinataSecretKey: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      type: 'credential-document',
      uploadedAt: new Date().toISOString(),
    },
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', options);

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload file to IPFS');
  }

  const data: PinataResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Upload credential metadata to IPFS
 */
export async function uploadCredentialMetadata(
  metadata: CredentialMetadata,
  pinataApiKey: string,
  pinataSecretKey: string
): Promise<string> {
  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretKey,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `credential-${metadata.studentName}-${Date.now()}`,
        keyvalues: {
          type: 'credential-metadata',
          student: metadata.studentName,
          university: metadata.university,
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload metadata to IPFS');
  }

  const data: PinataResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Create credential metadata object
 */
export function createCredentialMetadata(params: {
  studentName: string;
  degree: string;
  university: string;
  issuerAddress: string;
  documentHash?: string;
}): CredentialMetadata {
  return {
    name: `${params.degree} - ${params.studentName}`,
    description: `Academic credential issued by ${params.university} to ${params.studentName} for ${params.degree}.`,
    image: params.documentHash,
    attributes: [
      { trait_type: 'Degree', value: params.degree },
      { trait_type: 'University', value: params.university },
      { trait_type: 'Student', value: params.studentName },
      { trait_type: 'Issued Date', value: new Date().toISOString().split('T')[0] },
    ],
    studentName: params.studentName,
    degree: params.degree,
    university: params.university,
    issuedAt: new Date().toISOString(),
    issuerAddress: params.issuerAddress,
  };
}

/**
 * Get IPFS gateway URL from hash
 */
export function getIPFSGatewayUrl(hash: string): string {
  const cleanHash = hash.replace('ipfs://', '');
  return `https://gateway.pinata.cloud/ipfs/${cleanHash}`;
}

/**
 * Validate if a string is a valid IPFS hash
 */
export function isValidIPFSHash(hash: string): boolean {
  if (!hash) return false;
  const cleaned = hash.replace('ipfs://', '');
  // CIDv0 starts with Qm, CIDv1 starts with b
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cleaned) || /^b[a-z2-7]{58,}$/.test(cleaned);
}