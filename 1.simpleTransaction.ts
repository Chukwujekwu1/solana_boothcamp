import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import * as dotenv from "dotenv"


(async () => {

    // connect to the block //devnet
    const connection = new Connection(clusterApiUrl("devnet"))
    // load keypair from the .env file
    dotenv.config()
    const payer = getKeypairFromEnvironment("index_SECRET_KEY");
    // get the balance of tokens in the account 
    const currentBalance = await connection.getBalance(payer.publicKey);
    // a conditional statement that checks if current balance is equal to zero
    // if true it request for an airdrop of tokens from devnet
    if (currentBalance <= LAMPORTS_PER_SOL * 15.1) {
        await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    }
    console.log(payer.publicKey.toBase58(), "Amount in lamport:  ", currentBalance);
    console.log("Amount in sol: ", currentBalance / LAMPORTS_PER_SOL);

    // creating a new keypair on chain 
    const keypair = Keypair.generate();
    console.log("The new keypair is:", keypair.publicKey.toBase58());




    // space allocated to account on-chain 
    // to store lamport balance (SOl) you do not need anyspace
    //note it increase as accont size increases
    const space = 0;

    // requset the cost in Lamports to be considered rent exempt
    const lamports = await connection.getMinimumBalanceForRentExemption(space);
    
    // creating a new accont in block
    const createAccontIx = SystemProgram.createAccount({
        // this is the account that will sign the transaction // payer of transaction fee for this transaction
        fromPubkey: payer.publicKey,
        // this is the accont address of the account you want to create on chain
        newAccountPubkey: keypair.publicKey,
        // the amount of lamport to store in the account 
        lamports,
        // space of accont in chain
        space,
        // the  program id (web3.js) provide that 
        programId: SystemProgram.programId,
    })
    // every transaction is requried to have a recent blockHash
    // to get blockHash
    let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    // create a message (0v)
    // transaction instruction
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        // this can be a list of instructions
        instructions: [createAccontIx]
    }).compileToV0Message();

    // creating a versioned transaction using the message
    const tx = new VersionedTransaction(message);
    // console.log("tx before signing: ", tx);

    // sign the transaction with our needed signer
    tx.sign([payer,keypair]);
    // tx.signatures.toString("base58");
    // console.log(tx.signatures);


    // send the transaction to the blockchain
    const sig = await connection.sendTransaction(tx);

    console.log("Transaction completed.");
    console.log(sig);
    
})();


