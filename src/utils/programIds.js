import { PublicKey } from "@solana/web3.js";

export const WRAPPED_SOL_MINT = new PublicKey(
    'So11111111111111111111111111111111111111112',
  );
  
  export const TOKEN_PROGRAM_ID = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );
  
  
  export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );
  
  export const BPF_UPGRADE_LOADER_ID = new PublicKey(
    'BPFLoaderUpgradeab1e11111111111111111111111',
  );
  
  export const MEMO_ID = new PublicKey(
    'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  );
  
  export const METADATA_PROGRAM_ID =
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
  
  export const METAPLEX_ID =
    'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98';
  
  export const TOKEN_RECEIVER_ID = 
    '62AtDMhgaW1YQZCxv7hGBE7HDTU67L71vs4VQrRVBq3p' //on devnet of solana

  export const SYSTEM = new PublicKey('11111111111111111111111111111111');
export const programIds = {
      token: TOKEN_PROGRAM_ID,
      associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
      system: SYSTEM,
      metadata: METADATA_PROGRAM_ID,
      memo: MEMO_ID,
      metaplex: METAPLEX_ID,
      tokenReceiverId: TOKEN_RECEIVER_ID
  };