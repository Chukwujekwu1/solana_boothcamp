import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";
import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import * as dotenv from "dotenv"

(async () => {
    const connection = new Connection(clusterApiUrl("devnet"));
    dotenv.config();
    const payer = getKeypairFromEnvironment("index_SECRET_KEY");
     
    // const amount = await connection.getBalance(payer.publicKey);
    // console.log(amount)
    // const balanceForRentExemption = await connection.getMinimumBalanceForRentExemption(0);
    // console.log(amount-1000 - balanceForRentExemption * 20 )
    // console.log(balanceForRentExemption)

    // console.log()

    // creating a new  keypair
    const testWallet = await Keypair.generate();
    console.log(testWallet.publicKey.toBase58());
    const secondWallet = await Keypair.generate();
    console.log(testWallet.publicKey.toBase58());

    // allocating  space of account in the block
    const space = 0;
    // amount in (lamport) to allocate 
    const balanceForRentExemption = await connection.getMinimumBalanceForRentExemption(space);

    const createNewAccontIx = SystemProgram.createAccount({
       // the person that would sign the transaction
        fromPubkey: payer.publicKey,
        // the pubkey  for the accont you want to create on chain 
        newAccountPubkey: testWallet.publicKey,
        // amount of  in lamport to allocate to the account created 
        lamports: balanceForRentExemption * 20,
        //space allocate to the account in the block during creation
        // you do not need space to store lamport (sol tokens)
        space,
        // the program id for the instruction
        programId: SystemProgram.programId,
    });
    // for every transaction you need the recent block hash
    
    
    // create an instruction to transfer lamports
    const transferTotestWalletIx = SystemProgram.transfer({
        lamports: 10,// balanceForRentExemption + 100_000,
        // this id the sender the person that signs the transaction
        fromPubkey: payer.publicKey,
        // this is teh account that recives they are not required to sign the transaction
        toPubkey: testWallet.publicKey,
        programId:SystemProgram.programId,
    })
    
    // const transferToSecondWalletIx = SystemProgram.transfer({
    //     lamports: 10,
    //     // this id the sender the person that signs the transaction
    //     fromPubkey: testWallet.publicKey,
    //     // this is teh account that recives they are not required to sign the transaction
    //     toPubkey: secondWallet.publicKey,
    //     programId:SystemProgram.programId,
    // })
    
    const blockHash = await connection.getLatestBlockhash().then(res => res.blockhash);
    // trasaction instruction 
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: blockHash,
        instructions: [
            // create a test wallet accont on blockchain
            createNewAccontIx,
            // transfer lamports to testwallet 
            transferTotestWalletIx,
            // transfer lamports to secondwallet 
            // transferToSecondWalletIx,
        ]
    }).compileToV0Message();

    // create a versioned trqnsaction
    const tx = new VersionedTransaction(message);

    // console.log("tx before signing: ", tx);

    // sign the transaction with our needed signer
    tx.sign([payer, testWallet]);

    // sending transaction to the blockchaih
    const sig = await connection.sendTransaction(tx);

    console.log("Transaction completed.");
    console.log(sig);
})();