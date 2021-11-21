import { BinaryReader, BinaryWriter } from 'borsh';
import base58 from 'bs58';
import * as splToken from '@solana/spl-token'
import crypto from 'crypto';
import BN from 'bn.js';
import { serialize } from 'borsh';
import {
    Keypair,
      PublicKey,
      Transaction,
      clusterApiUrl,
      SystemProgram,
      SYSVAR_RENT_PUBKEY,
      TransactionInstruction
    } from "@solana/web3.js";
import { sleepUtil } from './sleepUtil';

export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

const METADATA_PROGRAM_ID =
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

const programIds = {
  token: TOKEN_PROGRAM_ID,
  associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  metadata: METADATA_PROGRAM_ID,
  memo: MEMO_ID,
}

export const NETWORK = clusterApiUrl("devnet");
export const AR_SOL_HOLDER_ID = new PublicKey(
    'HvwC9QSAzvGXhhVrgPmauVwFWcYZhne3hVot9EbHuFTm',
);
export const METADATA_PREFIX = 'metadata';
export const EDITION = 'edition';
export const EDITION_MARKER_BIT_SIZE = 248;
export const DEFAULT_TIMEOUT = 15000;
export const RESERVED_TXN_MANIFEST = 'manifest.json';
export const MetadataKey = {
    Uninitialized : 0,
    MetadataV1 : 4,
    EditionV1 : 1,
    MasterEditionV1 : 2,
    MasterEditionV2 : 6,
    EditionMarker : 7,
}

/**
 * Classes to be used to create the NFT
 */

 class CreateMetadataArgs {
    instruction= 0;
    data;
    isMutable;
  
    constructor(args) {
      this.data = args.data;
      this.isMutable = args.isMutable;
    }
  }

  class UpdateMetadataArgs {
    instruction= 1;
    data;
    // Not used by this app, just required for instruction
    updateAuthority;
    primarySaleHappened;
    constructor(args) {
      this.data = args.data ? args.data : null;
      this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
      this.primarySaleHappened = args.primarySaleHappened;
    }
  }

  class CreateMasterEditionArgs {
    instruction = 10;
    maxSupply;
    constructor(args) {
      this.maxSupply = args.maxSupply;
    }
  }

  class Edition {
    key;
    /// Points at MasterEdition struct
    parent;
    /// Starting at 0 for master record, this is incremented for each edition minted.
    edition;
  
    constructor(args) {
      this.key = MetadataKey.EditionV1;
      this.parent = args.parent;
      this.edition = args.edition;
    }
  }
  export class Creator {
    address;
    verified;
    share;
  
    constructor(args) {
      this.address = args.address;
      this.verified = args.verified;
      this.share = args.share;
    }
  }
  
  class Data {
    name;
    symbol;
    uri;
    sellerFeeBasisPoints;
    creators;
    constructor(args) {
      this.name = args.name;
      this.symbol = args.symbol;
      this.uri = args.uri;
      this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
      this.creators = args.creators;
    }
  }
  
  class Metadata {
    key;
    updateAuthority;
    mint;
    data;
    primarySaleHappened;
    isMutable;
    editionNonce;
  
    // set lazy
    masterEdition;
    edition;
  
    constructor(args) {
      this.key = MetadataKey.MetadataV1;
      this.updateAuthority = args.updateAuthority;
      this.mint = args.mint;
      this.data = args.data;
      this.primarySaleHappened = args.primarySaleHappened;
      this.isMutable = args.isMutable;
      this.editionNonce = args.editionNonce;
    }
  
    async init() {
      const edition = await getEdition(this.mint);
      this.edition = edition;
      this.masterEdition = edition;
    }
  }

  class MintPrintingTokensArgs {
    instruction9;
    supply;
  
    constructor(args) {
      this.supply = args.supply;
    }
  }

  class MasterEditionV1 {
    key;
    supply;
    maxSupply;
    /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
    printingMint;
    /// If you don't know how many printing tokens you are going to need, but you do know
    /// you are going to need some amount in the future, you can use a token from this mint.
    /// Coming back to token metadata with one of these tokens allows you to mint (one time)
    /// any number of printing tokens you want. This is used for instance by Auction Manager
    /// with participation NFTs, where we dont know how many people will bid and need participation
    /// printing tokens to redeem, so we give it ONE of these tokens to use after the auction is over,
    /// because when the auction begins we just dont know how many printing tokens we will need,
    /// but at the end we will. At the end it then burns this token with token-metadata to
    /// get the printing tokens it needs to give to bidders. Each bidder then redeems a printing token
    /// to get their limited editions.
    oneTimePrintingAuthorizationMint;
  
    constructor(args) {
      this.key = MetadataKey.MasterEditionV1;
      this.supply = args.supply;
      this.maxSupply = args.maxSupply;
      this.printingMint = args.printingMint;
      this.oneTimePrintingAuthorizationMint =
        args.oneTimePrintingAuthorizationMint;
    }
  }
  
  class MasterEditionV2 {
    key;
    supply;
    maxSupply;
  
    constructor(args) {
      this.key = MetadataKey.MasterEditionV2;
      this.supply = args.supply;
      this.maxSupply = args.maxSupply;
    }
  }

  class EditionMarker {
    key;
    ledger;
  
    constructor(args) {
      this.key = MetadataKey.EditionMarker;
      this.ledger = args.ledger;
    }
  
    editionTaken(edition) {
      const editionOffset = edition % EDITION_MARKER_BIT_SIZE;
      const indexOffset = Math.floor(editionOffset / 8);
  
      if (indexOffset > 30) {
        throw Error('bad index for edition');
      }
  
      const positionInBitsetFromRight = 7 - (editionOffset % 8);
  
      const mask = Math.pow(2, positionInBitsetFromRight);
  
      const appliedMask = this.ledger[indexOffset] & mask;
  
      return appliedMask != 0;
    }
  }



/**
 * Helpder function to detect whether Phantom wallet extension installed or not
 * @param {*} connectToWallet 
 * @returns 
 */
export const connectOrGetPhantomProvider = (connectToWallet) => {
    if ("solana" in window) {
      const provider = window.solana;
      if(connectToWallet && !window.solana.isConnected){
            window.solana.connect();
        }
        if (provider.isPhantom) {
            return provider;
        }
    }else if(connectToWallet){
      alert(`Please install the phantom wallet from https://phantom.app/`);
    }
    
};

export const connectOrGetPhantomProviderTransient = () => {
  console.log(' connect connectOrGetPhantomProviderTransient called ')
  if ("solana" in window) {
          window.solana.connect({ onlyIfTrusted: true });
  }
}

/**
 * Helper function to convert base64 to file object
 * @param {*} dataurl 
 * @param {*} filename 
 * @returns 
 */
export const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
}

/**
 * Utility to add functionality to BinaryReader
 */
export const extendBorsh = () => {
(BinaryReader.prototype).readPubkey = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
};

(BinaryWriter.prototype).writePubkey = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer());
};

(BinaryReader.prototype).readPubkeyAsString = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return base58.encode(array);
};

(BinaryWriter.prototype).writePubkeyAsString = function (
    value,
) {
    const writer = this;
    writer.writeFixedArray(base58.decode(value));
};
};
extendBorsh();




  export const mintNFT = async function(
    connection,
    provider,
    env,
    files,
    metadata){

    const wallet = provider
    const metadataContent = {
          name: metadata.name,
          symbol: metadata.symbol,
          description: metadata.description,
          seller_fee_basis_points: metadata.sellerFeeBasisPoints,
          image: metadata.image,
          animation_url: metadata.animation_url,
          external_url: metadata.external_url,
          properties: {
            ...metadata.properties,
            creators: metadata.creators.map(creator => {
              return {
                address: creator.address,
                share: creator.share,
              };
            }),
          },
      };
    const realFiles = [
      ...files,
      new File([JSON.stringify(metadataContent)], 'metadata.json'),
    ];

    const { instructions: pushInstructions, signers: pushSigners } = await prepPayForFilesTxn(wallet, realFiles, metadata);


     // Allocate memory for the account
    const mintRent = await connection.getMinimumBalanceForRentExemption(
      splToken.MintLayout.span
    );

    const payerPublicKey = wallet.publicKey.toBase58();
    const instructions = [...pushInstructions];
    const signers = [...pushSigners];

     // This is only temporarily owned by wallet...transferred to program by createMasterEdition below
    const mintKey = createMint(
      instructions,
      wallet.publicKey,
      mintRent,
      0,
      // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
      new PublicKey(payerPublicKey),
      new PublicKey(payerPublicKey),
      signers,
    ).toBase58();

    const recipientKey = (
      await findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          programIds.token.toBuffer(),
          new PublicKey(mintKey).toBuffer(),
        ],
        programIds.associatedToken,
      )
    )[0];

    createAssociatedTokenAccountInstruction(
      instructions,
      new PublicKey(recipientKey),
      wallet.publicKey,
      wallet.publicKey,
      new PublicKey(mintKey),
    );
    const classData = new Data({
      symbol: metadata.symbol,
      name: metadata.name,
      uri:' '.repeat(64), // size of url for arweave
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      creators: metadata.creators,
    })
    const metadataAccount = await createMetadata(
      classData,
      payerPublicKey,
      mintKey,
      payerPublicKey,
      instructions,
      wallet.publicKey.toBase58(),
    );
    const { txid } = await sendTransactionWithRetry(
      connection,
      wallet,
      instructions,
      signers,
    );
    try {
      // return
     await connection.confirmTransaction(txid, 'max');
    } catch {
      // ignore
    }

    await connection.getParsedConfirmedTransaction(txid, 'confirmed');

    const data = new FormData();

    const tags = realFiles.reduce(
      (acc, f) => {
        acc[f.name] = [{ name: 'mint', value: mintKey }];
        return acc;
      },
      {},
    );
    data.append('tags', JSON.stringify(tags));
    data.append('transaction', txid);
    realFiles.map(f => data.append('file[]', f));

    const result = await (
      await fetch(
        'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2',
        {
          method: 'POST',
          body: data,
        },
      )
    ).json();

    const metadataFile = result.messages?.find(
      m => m.filename === RESERVED_TXN_MANIFEST,
    );
    let arweaveLink = ""
    if(metadataFile?.transactionId){
      const updateInstructions = [];
    const updateSigners= [];
    arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
    await updateMetadata(
      new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: arweaveLink,
        creators: metadata.creators,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      }),
      undefined,
      undefined,
      mintKey,
      payerPublicKey,
      updateInstructions,
      metadataAccount,
    );

    updateInstructions.push(
      splToken.Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        new PublicKey(mintKey),
        new PublicKey(recipientKey),
        new PublicKey(payerPublicKey),
        [],
        1,
      ),
    );

    await createMasterEdition(
      new BN(1),
      mintKey,
      payerPublicKey,
      payerPublicKey,
      payerPublicKey,
      updateInstructions,
    );

    await sendTransactionWithRetry(
      connection,
      wallet,
      updateInstructions,
      updateSigners,
    );}
    return { metadataAccount, arweaveLink, mintKey, account: recipientKey };
  }

  //END the mintNFT

  /**
   * 
   * @param {*} maxSupply 
   * @param {*} mintKey 
   * @param {*} updateAuthorityKey 
   * @param {*} mintAuthorityKey 
   * @param {*} payer 
   * @param {*} instructions 
   */

  async function createMasterEdition(
    maxSupply,
    mintKey,
    updateAuthorityKey,
    mintAuthorityKey,
    payer,
    instructions,
  ) {
    const metadataProgramId = programIds.metadata;
  
    const metadataAccount = (
      await findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(metadataProgramId).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
        ],
        new PublicKey(metadataProgramId),
      )
    )[0];
  
    const editionAccount = (
      await findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(metadataProgramId).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
          Buffer.from(EDITION),
        ],
        new PublicKey(metadataProgramId),
      )
    )[0];
  
    const value = new CreateMasterEditionArgs({ maxSupply: maxSupply || null });
    const data = Buffer.from(serialize(METADATA_SCHEMA, value));
  
    const keys = [
      {
        pubkey: new PublicKey(editionAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(mintKey),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(updateAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(mintAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(payer),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: false,
      },
  
      {
        pubkey: programIds.token,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
  
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: new PublicKey(metadataProgramId),
        data,
      }),
    );
  }

  const prepPayForFilesTxn = async (
    wallet,
    files,
    metadata,
  ) => {
    const memo = programIds.memo;
  
    const instructions= [];
    const signers= [];
  
    if (wallet.publicKey)
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: AR_SOL_HOLDER_ID,
          lamports: 100000000,
        }),
      );
  
    //Already uploading files on IPFS, hence no files to be transacted here
    for (let i = 0; i < files.length; i++) {
      const hashSum = crypto.createHash('sha256');
      hashSum.update(await files[i].text());
      const hex = hashSum.digest('hex');
      instructions.push(
        new TransactionInstruction({
          keys: [],
          programId: memo,
          data: Buffer.from(hex),
        }),
      );
    }
  
    return {
      instructions,
      signers,
    };
  };

  const findProgramAddress = async (
    seeds,
    programId,
  ) => {
    const result = await PublicKey.findProgramAddress(seeds, programId);
    return [result[0].toBase58(), result[1]];
  };

  function createMint(
    instructions,
    payer,
    mintRentExempt,
    decimals,
    owner,
    freezeAuthority,
    signers,
  ) {
    const account = createUninitializedMint(
      instructions,
      payer,
      mintRentExempt,
      signers,
    );
  
    instructions.push(
      splToken.Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        account,
        decimals,
        owner,
        freezeAuthority,
      ),
    );
  
    return account;
  }

  const createTokenAccount =(
    instructions,
    payer,
    accountRentExempt,
    mint,
    owner,
    signers,
  ) => {
    const account = createUninitializedAccount(
      instructions,
      payer,
      accountRentExempt,
      signers,
    );
  
    instructions.push(
      splToken.Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, account, owner),
    );
  
    return account;
  }

  function createUninitializedMint(
    instructions,
    payer,
    amount,
    signers,
  ) {
    const account = Keypair.generate();
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: splToken.MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
  
    signers.push(account);
  
    return account.publicKey;
  }

  function createUninitializedAccount(
    instructions,
    payer,
    amount,
    signers,
  ) {
    const account = Keypair.generate();
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: splToken.AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
  
    signers.push(account);
  
    return account.publicKey;
  }

  function createAssociatedTokenAccountInstruction(
    instructions,
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress,
  ) {
    const keys = [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: associatedTokenAddress,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: walletAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: splTokenMintAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: programIds.token,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: programIds.associatedToken,
        data: Buffer.from([]),
      }),
    );
  }

  const sendTransactionWithRetry = async (
    connection,
    wallet,
    instructions,
    signers,
    commitment = 'singleGossip',
    includesFeePayer = false,
    block,
    beforeSend,
  ) => {
    let transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    transaction.recentBlockhash = (
      block || (await connection.getRecentBlockhash(commitment))
    ).blockhash;
  
    if (includesFeePayer) {
      transaction.setSigners(...signers.map(s => s.publicKey));
    } else {
      transaction.setSigners(
        // fee payed by the wallet owner
        wallet.publicKey,
        ...signers.map(s => s.publicKey),
      );
    }
  
    if (signers.length > 0) {
      transaction.partialSign(...signers);
    }
    if (!includesFeePayer) {
      transaction = await wallet.signTransaction(transaction);
    }
  
    if (beforeSend) {
      beforeSend();
    }
  
    const { txid, slot } = await sendSignedTransaction({
      connection,
      signedTransaction: transaction,
    });
  
    return { txid, slot };
  };
  const getUnixTs = () => {
    return new Date().getTime() / 1000;
  };

  async function awaitTransactionSignatureConfirmation(
    txid,
    timeout,
    connection,
    commitment = 'recent',
    queryStatus = false,
  ) {
    let done = false;
    let status = {
      slot: 0,
      confirmations: 0,
      err: null,
    };
    let subId = 0;
    status = await new Promise(async (resolve, reject) => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Rejecting for timeout...');
        reject({ timeout: true });
      }, timeout);
      try {
        subId = connection.onSignature(
          txid,
          (result, context) => {
            done = true;
            status = {
              err: result.err,
              slot: context.slot,
              confirmations: 0,
            };
            if (result.err) {
              console.log('Rejected via websocket', result.err);
              reject(status);
            } else {
              console.log('Resolved via websocket', result);
              resolve(status);
            }
          },
          commitment,
        );
      } catch (e) {
        done = true;
        console.error('WS error in setup', txid, e);
      }
      while (!done && queryStatus) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            status = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!status) {
                console.log('REST null result for', txid, status);
              } else if (status.err) {
                console.log('REST error for', txid, status);
                done = true;
                reject(status.err);
              } else if (!status.confirmations) {
                console.log('REST no confirmations for', txid, status);
              } else {
                console.log('REST confirmation for', txid, status);
                done = true;
                resolve(status);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleepUtil(1000);
      }
    });
  
    //@ts-ignore
    if (connection._signatureSubscriptions[subId])
      connection.removeSignatureListener(subId);
    done = true;
    console.log('Returning status', status);
    return status;
  }

  async function sendSignedTransaction({
    signedTransaction,
    connection,
    timeout = DEFAULT_TIMEOUT,
  }){
    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    let slot = 0;
    const txid = await connection.sendRawTransaction(
      rawTransaction,
      {
        skipPreflight: true,
      },
    );
  
    console.log('Started awaiting confirmation for', txid);
  
    let done = false;
    (async () => {
      while (!done && getUnixTs() - startTime < timeout) {
        connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        });
        await sleepUtil(500);
      }
    })();
    try {
      const confirmation = await awaitTransactionSignatureConfirmation(
        txid,
        timeout,
        connection,
        'recent',
        true,
      );
  
      if (!confirmation)
        throw new Error('Timed out awaiting confirmation on transaction');
  
      if (confirmation.err) {
        console.error(confirmation.err);
        throw new Error('Transaction failed: Custom instruction error');
      }
  
      slot = confirmation?.slot || 0;
    } catch (err) {
      // console.error('Timeout Error caught', err);
      // if (err.timeout) {
      //   throw new Error('Timed out awaiting confirmation on transaction');
      // }
      // let simulateResult: SimulatedTransactionResponse | null = null;
      // try {
      //   simulateResult = (
      //     await simulateTransaction(connection, signedTransaction, 'single')
      //   ).value;
      // } catch (e) {}
      // if (simulateResult && simulateResult.err) {
      //   if (simulateResult.logs) {
      //     for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
      //       const line = simulateResult.logs[i];
      //       if (line.startsWith('Program log: ')) {
      //         throw new Error(
      //           'Transaction failed: ' + line.slice('Program log: '.length),
      //         );
      //       }
      //     }
      //   }
      //   throw new Error(JSON.stringify(simulateResult.err));
      // }
      // throw new Error('Transaction failed');
    } finally {
      done = true;
    }
  
    console.log('Latency', txid, getUnixTs() - startTime);
    return { txid, slot };
  }

  async function getEdition(
    tokenMint,
  ){    
    return (
      await findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(programIds.metadata).toBuffer(),
          new PublicKey(tokenMint).toBuffer(),
          Buffer.from(EDITION),
        ],
        new PublicKey(programIds.metadata),
      )
    )[0];
  }
  
  const METADATA_SCHEMA = new Map([
    [
      CreateMetadataArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['data', Data],
          ['isMutable', 'u8'], // bool
        ],
      },
    ],
    [
      UpdateMetadataArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['data', { kind: 'option', type: Data }],
          ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
          ['primarySaleHappened', { kind: 'option', type: 'u8' }],
        ],
      },
    ],
  
    [
      CreateMasterEditionArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['maxSupply', { kind: 'option', type: 'u64' }],
        ],
      },
    ],
    [
      MintPrintingTokensArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['supply', 'u64'],
        ],
      },
    ],
    [
      MasterEditionV1,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['supply', 'u64'],
          ['maxSupply', { kind: 'option', type: 'u64' }],
          ['printingMint', 'pubkeyAsString'],
          ['oneTimePrintingAuthorizationMint', 'pubkeyAsString'],
        ],
      },
    ],
    [
      MasterEditionV2,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['supply', 'u64'],
          ['maxSupply', { kind: 'option', type: 'u64' }],
        ],
      },
    ],
    [
      Edition,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['parent', 'pubkeyAsString'],
          ['edition', 'u64'],
        ],
      },
    ],
    [
      Data,
      {
        kind: 'struct',
        fields: [
          ['name', 'string'],
          ['symbol', 'string'],
          ['uri', 'string'],
          ['sellerFeeBasisPoints', 'u16'],
          ['creators', { kind: 'option', type: [Creator] }],
        ],
      },
    ],
    [
      Creator,
      {
        kind: 'struct',
        fields: [
          ['address', 'pubkeyAsString'],
          ['verified', 'u8'],
          ['share', 'u8'],
        ],
      },
    ],
    [
      Metadata,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['updateAuthority', 'pubkeyAsString'],
          ['mint', 'pubkeyAsString'],
          ['data', Data],
          ['primarySaleHappened', 'u8'], // bool
          ['isMutable', 'u8'], // bool
        ],
      },
    ],
    [
      EditionMarker,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['ledger', [31]],
        ],
      },
    ],
  ]);

  async function createMetadata(
    data,
    updateAuthority,
    mintKey,
    mintAuthorityKey,
    instructions,
    payer,
  ) {
    const metadataProgramId = programIds.metadata;
    const metadataAccount = (
      await findProgramAddress(
        [
          Buffer.from('metadata'),
          new PublicKey(metadataProgramId).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
        ],
        new PublicKey(metadataProgramId),
      )
    )[0];
    
    const value = new CreateMetadataArgs({ data, isMutable: true });

    let txnData = Buffer.from(serialize(METADATA_SCHEMA, value));;
    const keys = [
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(mintKey),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(mintAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(payer),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(updateAuthority),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: new PublicKey(metadataProgramId),
        data: txnData,
      }),
    );
  
    return metadataAccount;
  }

  async function updateMetadata(
    data,
    newUpdateAuthority,
    primarySaleHappened,
    mintKey,
    updateAuthority,
    instructions,
    metadataAccount,
  ) {
    const metadataProgramId = programIds.metadata;
  
    metadataAccount =
      metadataAccount ||
      (
        await findProgramAddress(
          [
            Buffer.from('metadata'),
            new PublicKey(metadataProgramId).toBuffer(),
            new PublicKey(mintKey).toBuffer(),
          ],
          new PublicKey(metadataProgramId),
        )
      )[0];

    const value = new UpdateMetadataArgs({
      data,
      updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
      primarySaleHappened:
        primarySaleHappened === null || primarySaleHappened === undefined
          ? null
          : primarySaleHappened,
    });
    const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
    const keys = [
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(updateAuthority),
        isSigner: true,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: new PublicKey(metadataProgramId),
        data: txnData,
      }),
    );
  
    return metadataAccount;
  }