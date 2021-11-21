 import {SystemProgram, Transaction} from '@solana/web3.js'

  const createTransferTransaction = async (ownerPubkey, connection, fromTokenAccountPubkey, toTokenAccountPubkey, tokenToTransferLamports) => {

    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromTokenAccountPubkey,
        toPubkey: toTokenAccountPubkey,
        lamports: tokenToTransferLamports
      })
    );
    transaction.feePayer =  ownerPubkey;
    console.log('Getting recent blockhash');
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    return transaction;
  };


  export const transferCustomToken = async(provider, connection, tokenToTransfer, fromCustomTokenAccountPubkey, toCustomTokenAccountPubkey)=>{
      
    if(tokenToTransfer <= 0){
        return {status: false, error: "You can not transfer, Token to transfer should be greater than 0."}
    }
    const tokenToTransferLamports = tokenToTransfer * 1000000000 
    const transaction = await createTransferTransaction(provider.publicKey,connection, fromCustomTokenAccountPubkey, toCustomTokenAccountPubkey, tokenToTransferLamports);
   
    if (transaction) {
        try {
        let signed = await provider.signTransaction(transaction);
        console.log('Got signature, submitting transaction');
        let signature = await connection.sendRawTransaction(signed.serialize());
        console.log(
            'Submitted transaction ' + signature + ', awaiting confirmation'
        );
        await connection.confirmTransaction(signature);
        console.log('Transaction ' + signature + ' confirmed');
        return {status: true, signature}
        } catch (e) {
        console.warn(e);
        console.log('Error: ' + e.message);
        return {status: false, error: e.message}
        }
    }
    return {
        status: false,
        error: "No transaction found"
    }
  }
