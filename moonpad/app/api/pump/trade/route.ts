import { NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  OnlinePumpSdk,
  PUMP_SDK,
  getBuyTokenAmountFromSolAmount,
  getSellSolAmountFromTokenAmount,
} from '@pump-fun/pump-sdk';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

const SOL_MINT =
  'So11111111111111111111111111111111111111112';

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && BigInt(value) > 0n;
}

function clampSlippageBps(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 100;
  }

  return Math.min(
    Math.max(Math.round(number), 10),
    5000
  );
}

async function getMintTokenProgram(
  connection: Connection,
  mint: PublicKey
) {
  const account =
    await connection.getAccountInfo(mint);

  if (!account) {
    throw new Error(
      'Token mint account was not found.'
    );
  }

  if (
    account.owner.equals(
      TOKEN_2022_PROGRAM_ID
    )
  ) {
    return TOKEN_2022_PROGRAM_ID;
  }

  if (
    account.owner.equals(
      TOKEN_PROGRAM_ID
    )
  ) {
    return TOKEN_PROGRAM_ID;
  }

  throw new Error(
    'Token mint is not owned by a supported Solana token program.'
  );
}

async function findUserTokenAccount(
  connection: Connection,
  mint: PublicKey,
  user: PublicKey,
  tokenProgram: PublicKey
) {
  const response =
    await connection.getTokenAccountsByOwner(
      user,
      {
        mint,
        programId:
          tokenProgram,
      },
      'confirmed'
    );

  if (
    response.value.length === 0
  ) {
    throw new Error(
      'No token account holding this token was found in the connected wallet.'
    );
  }

  for (
    const account of response.value
  ) {
    const balance =
      await connection.getTokenAccountBalance(
        account.pubkey,
        'confirmed'
      );

    if (
      balance.value.amount !== '0'
    ) {
      return {
        address:
          account.pubkey,
        rawAmount:
          balance.value.amount,
      };
    }
  }

  throw new Error(
    'The connected wallet has no spendable balance for this token.'
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      inputMint,
      outputMint,
      amount,
      userPublicKey,
      slippageBps = 100,
    } = body;

    if (
      !inputMint ||
      !outputMint ||
      !amount ||
      !userPublicKey
    ) {
      return NextResponse.json(
        {
          error:
            'Missing trade parameters',
        },
        { status: 400 }
      );
    }

    try {
      new PublicKey(inputMint);
      new PublicKey(outputMint);
      new PublicKey(userPublicKey);
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid Solana address',
        },
        { status: 400 }
      );
    }

    if (
      !isPositiveInteger(
        String(amount)
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Trade amount must be a positive integer in base units.',
        },
        { status: 400 }
      );
    }

    const user =
      new PublicKey(
        userPublicKey
      );

    const input =
      new PublicKey(inputMint);

    const output =
      new PublicKey(outputMint);

    const isBuy =
      inputMint === SOL_MINT;

    const isSell =
      outputMint === SOL_MINT;

    if (!isBuy && !isSell) {
      return NextResponse.json(
        {
          error:
            'Pump bonding-curve trading requires SOL as the quote asset.',
        },
        { status: 400 }
      );
    }

    if (isBuy && isSell) {
      return NextResponse.json(
        {
          error:
            'Invalid trade pair.',
        },
        { status: 400 }
      );
    }

    const connection =
      new Connection(
        RPC_URL,
        'confirmed'
      );

    const sdk =
      new OnlinePumpSdk(
        connection
      );

    const mint =
      isBuy
        ? output
        : input;

    const tokenProgram =
      await getMintTokenProgram(
        connection,
        mint
      );

    const safeSlippageBps =
      clampSlippageBps(
        slippageBps
      );

    const slippage =
      safeSlippageBps / 100;

    const {
      blockhash,
      lastValidBlockHeight,
    } =
      await connection.getLatestBlockhash(
        'confirmed'
      );

    let instructions:
      TransactionInstruction[];

    let expectedOutput: BN;

    let tradeType:
      | 'buy'
      | 'sell';

    if (isBuy) {
      tradeType = 'buy';

      const solAmount =
        new BN(
          String(amount)
        );

      const [
        buyState,
        global,
        feeConfig,
      ] = await Promise.all([
        sdk.fetchBuyState(
          mint,
          user
        ),
        sdk.fetchGlobal(),
        sdk.fetchFeeConfig(),
      ]);

      if (
        !buyState.bondingCurve
      ) {
        return NextResponse.json(
          {
            error:
              'Pump bonding curve was not found for this token.',
          },
          { status: 404 }
        );
      }

      if (
        buyState
          .bondingCurve
          .complete
      ) {
        return NextResponse.json(
          {
            error:
              'This token has graduated to PumpSwap.',
            graduated: true,
          },
          { status: 409 }
        );
      }

      expectedOutput =
        getBuyTokenAmountFromSolAmount({
          global,
          feeConfig,
          mintSupply:
            buyState
              .bondingCurve
              .tokenTotalSupply,
          bondingCurve:
            buyState.bondingCurve,
          amount:
            solAmount,
        });

      if (
        expectedOutput.lte(
          new BN(0)
        )
      ) {
        return NextResponse.json(
          {
            error:
              'The calculated token output is zero.',
          },
          { status: 400 }
        );
      }

      instructions =
        await PUMP_SDK.buyInstructions({
          global,
          bondingCurveAccountInfo:
            buyState.bondingCurveAccountInfo,
          bondingCurve:
            buyState.bondingCurve,
          associatedUserAccountInfo:
            buyState.associatedUserAccountInfo,
          mint,
          user,
          amount:
            expectedOutput,
          solAmount,
          slippage,
          tokenProgram,
        });
    } else {
      tradeType = 'sell';

      const tokenAmount =
        new BN(
          String(amount)
        );

      const [
        global,
        feeConfig,
        bondingCurve,
      ] = await Promise.all([
        sdk.fetchGlobal(),
        sdk.fetchFeeConfig(),
        sdk.fetchBondingCurve(
          mint
        ),
      ]);

      if (
        bondingCurve.complete
      ) {
        return NextResponse.json(
          {
            error:
              'This token has graduated to PumpSwap.',
            graduated: true,
          },
          { status: 409 }
        );
      }

      const bondingCurveAddress =
        await PUMP_SDK.getBondingCurvePda(
          mint
        );

      const bondingCurveAccountInfo =
        await connection.getAccountInfo(
          bondingCurveAddress
        );

      if (
        !bondingCurveAccountInfo
      ) {
        return NextResponse.json(
          {
            error:
              'Pump bonding curve was not found for this token.',
          },
          { status: 404 }
        );
      }

      const userTokenAccount =
        await findUserTokenAccount(
          connection,
          mint,
          user,
          tokenProgram
        );

      if (
        BigInt(
          String(amount)
        ) >
        BigInt(
          userTokenAccount.rawAmount
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Sell amount exceeds your wallet token balance.',
          },
          { status: 400 }
        );
      }

      expectedOutput =
        getSellSolAmountFromTokenAmount({
          global,
          feeConfig,
          mintSupply:
            bondingCurve.tokenTotalSupply,
          bondingCurve,
          amount:
            tokenAmount,
        });

      if (
        expectedOutput.lte(
          new BN(0)
        )
      ) {
        return NextResponse.json(
          {
            error:
              'The calculated SOL output is zero.',
          },
          { status: 400 }
        );
      }

      const mintInfo =
        await getMint(
          connection,
          mint,
          'confirmed',
          tokenProgram
        );

      const associatedUserAccount =
        getAssociatedTokenAddressSync(
          mint,
          user,
          false,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

      const associatedAccountInfo =
        await connection.getAccountInfo(
          associatedUserAccount,
          'confirmed'
        );

      if (
        !associatedAccountInfo ||
        !associatedAccountInfo.owner.equals(
          tokenProgram
        )
      ) {
        instructions =
          [
            createAssociatedTokenAccountIdempotentInstruction(
              user,
              associatedUserAccount,
              user,
              mint,
              tokenProgram,
              ASSOCIATED_TOKEN_PROGRAM_ID
            ),
          ];
      } else {
        instructions = [];
      }

      if (
        !userTokenAccount.address.equals(
          associatedUserAccount
        )
      ) {
        instructions.push(
          createTransferCheckedInstruction(
            userTokenAccount.address,
            mint,
            associatedUserAccount,
            user,
            BigInt(
              tokenAmount.toString()
            ),
            mintInfo.decimals,
            [],
            tokenProgram
          )
        );
      }

      const sellInstructions =
        await PUMP_SDK.sellInstructions({
          global,
          bondingCurveAccountInfo,
          bondingCurve,
          mint,
          user,
          amount:
            tokenAmount,
          solAmount:
            expectedOutput,
          slippage,
          tokenProgram,
          mayhemMode:
            bondingCurve
              .isMayhemMode ??
            false,
        });

      instructions.push(
        ...sellInstructions
      );
    }

    if (
      !instructions ||
      instructions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Pump returned no trade instructions.',
        },
        { status: 502 }
      );
    }

    const messageV0 =
      new TransactionMessage({
        payerKey:
          user,
        recentBlockhash:
          blockhash,
        instructions,
      }).compileToV0Message();

    const transaction =
      new VersionedTransaction(
        messageV0
      );

    const serialized =
      Buffer.from(
        transaction.serialize()
      ).toString('base64');

    return NextResponse.json({
      transaction:
        serialized,
      swapTransaction:
        serialized,
      lastValidBlockHeight,
      tradeType,
      mint:
        mint.toBase58(),
      expectedOutput:
        expectedOutput.toString(),
      slippageBps:
        safeSlippageBps,
      source:
        'pump-bonding-curve',
    });
  } catch (error) {
    console.error(
      'MoonPad Pump trade error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create Pump trade transaction';

    if (
      message
        .toLowerCase()
        .includes(
          'bonding curve account not found'
        ) ||
      message
        .toLowerCase()
        .includes(
          'bonding curve was not found'
        )
    ) {
      return NextResponse.json(
        {
          error:
            'This token has graduated to PumpSwap.',
          graduated: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
