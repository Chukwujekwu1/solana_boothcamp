import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";
import * as dotenv from "dotenv";
import * as token from "@solana/spl-token";
import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import { createAccount, createAssociatedTokenAccount } from "@solana/spl-token";

(async () => {
    const connection = new Connection(clusterApiUrl("devnet"));
    dotenv.config();
    const payer = getKeypairFromEnvironment("index_SECRET_KEY");
    const keypair = await Keypair.generate();
    console.log(keypair.publicKey.toBase58());
    console.log("#############################################");
    const lamports = await token.getMinimumBalanceForRentExemptMint(connection);
    const createNewAccontIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: keypair.publicKey,
        // mint size default inbuilt variable
        space: token.MINT_SIZE,
        // amount of  in lamport to allocate to the mint account created 
        lamports,
        // the program id for the instruction mint
        programId: token.TOKEN_PROGRAM_ID,
    })

    const intilizeTokenInstruction = token.createInitializeMintInstruction(
        keypair.publicKey, // mint
        2, //decimals:
        payer.publicKey,// mintAuthority:
        payer.publicKey, //freezeAuthority: 
        token.TOKEN_PROGRAM_ID, //programId:
    );

    const owner = await Keypair.generate();
    console.log(owner.publicKey.toBase58())
    // const tokenAccount = await createAccount(
    //     connection,
    //     payer,
    //     keypair.publicKey,
    //     owner.publicKey,
    // );

    const associatedTokenAccount = token.createAssociatedTokenAccountInstruction(
        payer.publicKey,
        owner.publicKey,
        payer.publicKey,
        keypair.publicKey,

    );

    const mintToken = token.createMintToInstruction(
        keypair.publicKey,//mint:
        owner.publicKey,
        payer.publicKey,
        100,
        [payer.publicKey, owner.publicKey],
    )

    const blockHash = await connection.getLatestBlockhash().then(res => res.blockhash);
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: blockHash,
        instructions: [createNewAccontIx, intilizeTokenInstruction, associatedTokenAccount, mintToken]
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    tx.sign([payer, owner]);

    const sig = await connection.sendTransaction(tx);
    console.log("Transaction completed.");
    console.log(sig);


})();


