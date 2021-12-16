import { SystemProgram, Transaction } from '@solana/web3.js'

const createTransferTransaction = async (ownerPubkey, connection, fromTokenAccountPubkey, toTokenAccountPubkey, tokenToTransferLamports) => {

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromTokenAccountPubkey,
      toPubkey: toTokenAccountPubkey,
      lamports: tokenToTransferLamports
    })
  );
  transaction.feePayer = ownerPubkey;
  console.log('Getting recent blockhash');
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash()
  ).blockhash;
  return transaction;
};

/**
 * This utility function will transfer the token from one user wallet to another user's wallet
 * @param {*} provider : provider of the phantom wallet
 * @param {*} connection : connection to the solana cluster
 * @param {*} tokenToTransfer : tokens to be transferred in lamports
 * @param {*} fromTokenAccountPubkey : sender of the token
 * @param {*} toTokenAccountPubkey : receiver of the token
 * @returns 
 */

export const transferCustomToken = async (provider, connection, tokenToTransfer, fromTokenAccountPubkey, toTokenAccountPubkey) => {

  if (tokenToTransfer <= 0) {
    return { status: false, error: "You can not transfer, Token to transfer should be greater than 0." }
  }
  const tokenToTransferLamports = tokenToTransfer * 1000000000
  const transaction = await createTransferTransaction(provider.publicKey, connection, fromTokenAccountPubkey, toTokenAccountPubkey, tokenToTransferLamports);

  if (transaction) {
    try {
      let signed = await provider.signTransaction(transaction);
      console.log('Got signature, submitting transaction');

      let signature = await connection.sendRawTransaction(signed.serialize());
      console.log('Submitted transaction ' + signature + ', awaiting confirmation');

      await connection.confirmTransaction(signature);
      console.log('Transaction ' + signature + ' confirmed');

      return { status: true, signature }

    } catch (e) {
      
      console.warn(e);
      console.log('Error: ' + e.message);
      return { status: false, error: e.message }
    }
  }
  return {
    status: false,
    error: "No transaction found"
  }
}
