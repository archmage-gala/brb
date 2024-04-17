import stringify from 'json-stringify-deterministic';
import { ethers, id } from 'ethers';
import { ec } from 'elliptic';

const EC = new ec('secp256k1');

export class GalachainWeb3WalletSigner {
  constructor(public readonly wallet: ethers.HDNodeWallet) {}

  // GalaChain expects a 130 byte 'uncompressed' public key
  get uncompressedPublicKey() {
    const publicKey = EC.keyFromPublic(
      this.wallet.publicKey.substring(2),
      'hex',
    );
    return publicKey.getPublic(false, 'hex');
  }

  get address() {
    return this.wallet.address;
  }

  sign(dto: { signature?: string }) {
    // stringify in alphabetic order, GalaChain does the same
    const serialized = stringify(dto);

    // keccak256 hash
    const hashed = id(serialized);

    // sign it
    dto.signature = this.wallet.signingKey.sign(hashed).serialized.substring(2);
    return dto;
  }
}
