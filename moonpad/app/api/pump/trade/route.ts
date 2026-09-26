import { NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  OnlinePumpSdk,
  getBuyTokenAmountFromSolAmount,
  getSellSolAmountFromTokenAmount,
} from '@pump-fun/pump-sdk';

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && BigInt(value) > 0n;
}

function isValidSlippage(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0.01;
  }

  return Math.min(Math.max(number, 0.001), 0.5);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      inputMint,
      outputMint,
      amount,
      userPublicKey,
      slippageBps = 100,
    } = body;

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing trade parameters' },
        { status: 400 }
      );
    }

    try {
      new PublicKey(inputMint);
      new PublicKey(outputMint);
      new PublicKey(userPublicKey);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    if (!isPositiveInteger(String(amount))) {
      return NextResponse.json(
        {
          error:
            'Trade amount must be a positive integer in base units',
        },
        { status: 400 }
      );
    }

    const user = new PublicKey(userPublicKey);
    const input = new PublicKey(inputMint);
    const output = new PublicKey(outputMint);

    const isBuy = inputMint === SOL_MINT;
    const isSell = outputMint === SOL_MINT;

    if (!isBuy && !isSell) {
      return NextResponse.json(
        {
          error:
            'Pump trading currently supports SOL buys and SOL sells only.',
        },
        { status: 400 }
      );
    }

    if (isBuy && outputMint === SOL_MINT) {
      return NextResponse.json(
        { error: 'Invalid buy token.' },
        { status: 400 }
      );
    }

    if (isSell && inputMint === SOL_MINT) {
      return NextResponse.json(
        { error: 'Invalid sell token.' },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const sdk = new OnlinePumpSdk(connection);

    const mint = isBuy ? output : input;

    const slippage = isValidSlippage(
      Number(slippageBps) / 10000
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    let instructions;
    let expectedOutput: string;
    let tradeType: 'buy' | 'sell';

    if (isBuy) {
      tradeType = 'buy';

      const solAmount = new BN(String(amount));

      const [buyState, global, feeConfig] =
        await Promise.all([
          sdk.fetchBuyState(mint, user),
          sdk.fetchGlobal(),
          sdk.fetchFeeConfig(),
        ]);

      if (buyState.bondingCurve.complete) {
        return NextResponse.json(
          {
            error:
              'This token has graduated from the bonding curve. PumpSwap trading is required for this token.',
            graduated: true,
          },
          { status: 409 }
        );
      }

      const expectedTokens =
        getBuyTokenAmountFromSolAmount({
          global,
          feeConfig,
          mintSupply:
            buyState.bondingCurve.tokenTotalSupply,
          bondingCurve: buyState.bondingCurve,
          amount: solAmount,
        });

      if (expectedTokens.lte(new BN(0))) {
        return NextResponse.json(
          { error: 'The calculated token output is zero.' },
          { status: 400 }
        );
      }

      instructions = await sdk.buyInstructions({
        ...buyState,
        mint,
        user,
        amount: expectedTokens,
        solAmount,
        slippage,
      });

      expectedOutput = expectedTokens.toString();
    } else {
      tradeType = 'sell';

      const tokenAmount = new BN(String(amount));

      const [sellState, global, feeConfig] =
        await Promise.all([
          sdk.fetchSellState(mint, user),
          sdk.fetchGlobal(),
          sdk.fetchFeeConfig(),
        ]);

      if (sellState.bondingCurve.complete) {
        return NextResponse.json(
          {
            error:
              'This token has graduated from the bonding curve. PumpSwap trading is required for this token.',
            graduated: true,
          },
          { status: 409 }
        );
      }

      const expectedSol =
        getSellSolAmountFromTokenAmount({
          global,
          feeConfig,
          mintSupply:
            sellState.bondingCurve.tokenTotalSupply,
          bondingCurve: sellState.bondingCurve,
          amount: tokenAmount,
        });

      if (expectedSol.lte(new BN(0))) {
        return NextResponse.json(
          { error: 'The calculated SOL output is zero.' },
          { status: 400 }
        );
      }

      instructions = await sdk.sellInstructions({
        ...sellState,
        mint,
        user,
        amount: tokenAmount,
        solAmount: expectedSol,
        slippage,
      });

      expectedOutput = expectedSol.toString();
    }

    if (!instructions || instructions.length === 0) {
      return NextResponse.json(
        { error: 'Pump did not return any trade instructions.' },
        { status: 502 }
      );
    }

    const messageV0 = new TransactionMessage({
      payerKey: user,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(
      messageV0
    );

    const serialized = Buffer.from(
      transaction.serialize()
    ).toString('base64');

    return NextResponse.json({
      transaction: serialized,
      swapTransaction: serialized,
      lastValidBlockHeight,
      tradeType,
      mint: mint.toBase58(),
      expectedOutput,
      slippage,
      source: 'pump-bonding-curve',
    });
  } catch (error) {
    console.error('MoonPad Pump trade error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create Pump trade transaction';

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
