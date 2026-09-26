'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import { PUMP_SDK } from '@pump-fun/pump-sdk';
import {
  Activity,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Gauge,
  LayoutDashboard,
  Pause,
  Play,
  Rocket,
  Search,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

const SOL_MINT =
  'So11111111111111111111111111111111111111112';

const SOLANA_RPC =
  'https://api.mainnet-beta.solana.com';

type TokenItem = {
  name: string;
  ticker: string;
  mc: string;
  change: string;
  holders: string;
  status: string;
  mint?: string;
  signature?: string;
  createdAt?: string;
};

type ActivityEvent = {
  time: string;
  actor: string;
  action: string;
};

const demoTokens: TokenItem[] = [
  {
    name: 'Moon',
    ticker: '$MOON',
    mc: '$12.4K',
    change: '+18.4%',
    holders: '2,481',
    status: 'LIVE',
  },
  {
    name: 'Lunar Doge',
    ticker: '$LDOGE',
    mc: '$4.8K',
    change: '+7.2%',
    holders: '812',
    status: 'LIVE',
  },
  {
    name: 'MoonCat',
    ticker: '$MCAT',
    mc: '$2.1K',
    change: '+3.9%',
    holders: '391',
    status: 'WATCH',
  },
];

export default function Home() {
  const connection = useMemo(
    () => new Connection(SOLANA_RPC, 'confirmed'),
    []
  );

  const [active, setActive] = useState('Dashboard');

  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [solBalance, setSolBalance] =
    useState<number | null>(null);
  const [connecting, setConnecting] =
    useState(false);
  const [refreshingBalance, setRefreshingBalance] =
    useState(false);

  const [running, setRunning] = useState(true);

  const [showLaunch, setShowLaunch] =
    useState(false);

  const [search, setSearch] = useState('');

  const [toast, setToast] = useState('');

  const [tradeMint, setTradeMint] = useState('');
  const [tradeAmount, setTradeAmount] =
    useState('');
  const [sellAmount, setSellAmount] =
    useState('');

  const [tokenBalance, setTokenBalance] =
    useState<number | null>(null);
  const [tokenDecimals, setTokenDecimals] =
    useState<number | null>(null);
  const [loadingTokenBalance, setLoadingTokenBalance] =
    useState(false);

  const [stopLoss, setStopLoss] =
    useState('');
  const [takeProfit, setTakeProfit] =
    useState('');

  const [tradeStatus, setTradeStatus] =
    useState('');
  const [tradeLoading, setTradeLoading] =
    useState(false);

  const [lastSignature, setLastSignature] =
    useState('');

  const [currentPrice, setCurrentPrice] =
    useState<number | null>(null);

  const [entryPrice, setEntryPrice] =
    useState<number | null>(null);

  const [changePercent, setChangePercent] =
    useState<number | null>(null);

  const [botEnabled, setBotEnabled] =
    useState(false);

  const [triggered, setTriggered] =
    useState<
      'STOP-LOSS' | 'TAKE-PROFIT' | null
    >(null);

  const [watching, setWatching] =
    useState(false);

  const [watchPrice, setWatchPrice] =
    useState<number | null>(null);

  const [loadingPrice, setLoadingPrice] =
    useState(false);

  const [createdTokens, setCreatedTokens] =
    useState<TokenItem[]>([]);

  const [activity, setActivity] =
    useState<ActivityEvent[]>([
      {
        time: '12:42',
        actor: 'Agent #001',
        action: 'market data updated',
      },
      {
        time: '12:39',
        actor: 'Wallet',
        action: 'connected successfully',
      },
      {
        time: '12:34',
        actor: 'Agent #002',
        action: 'started community monitoring',
      },
      {
        time: '12:28',
        actor: '$MOON',
        action: 'holder count crossed 2,400',
      },
    ]);

  const allTokens = useMemo(
    () => [...createdTokens, ...demoTokens],
    [createdTokens]
  );

  const filteredTokens = useMemo(
    () =>
      allTokens.filter((t) =>
        `${t.name} ${t.ticker} ${t.mint || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [allTokens, search]
  );

  const notify = (message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast('');
    }, 2500);
  };

  const addActivity = (
    actor: string,
    action: string
  ) => {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setActivity((previous) => {
      const next = [
        {
          time,
          actor,
          action,
        },
        ...previous,
      ].slice(0, 20);

      try {
        localStorage.setItem(
          'moonpad_activity',
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  };

  const getProvider = () => {
    return (window as any).phantom?.solana;
  };

  const copyText = async (
    value: string,
    message = 'Copied'
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(message);
    } catch {
      notify('Copy failed');
    }
  };

  const isValidMint = (mint: string) => {
    try {
      new PublicKey(mint.trim());
      return true;
    } catch {
      return false;
    }
  };

  const toTokenBaseUnits = (
    value: string,
    decimals: number
  ) => {
    const clean = value.trim();

    if (!/^\d+(\.\d+)?$/.test(clean)) {
      throw new Error(
        'Enter a valid token amount.'
      );
    }

    const [whole, fraction = ''] =
      clean.split('.');

    if (fraction.length > decimals) {
      throw new Error(
        `This token supports ${decimals} decimal places.`
      );
    }

    const paddedFraction =
      fraction.padEnd(decimals, '0');

    const combined =
      `${whole}${paddedFraction}`
        .replace(/^0+(?=\d)/, '');

    return combined || '0';
  };

  const refreshBalance = async (
    address?: string
  ) => {
    try {
      const target =
        address || walletAddress;

      if (!target) {
        return;
      }

      const publicKey =
        new PublicKey(target);

      const lamports =
        await connection.getBalance(
          publicKey,
          'confirmed'
        );

      setSolBalance(
        lamports / 1_000_000_000
      );
    } catch {
      setSolBalance(null);
    }
  };

  const refreshTokenBalance = async (
    mintOverride?: string
  ) => {
    const mint =
      mintOverride?.trim() ||
      tradeMint.trim();

    if (!walletAddress || !mint) {
      setTokenBalance(null);
      setTokenDecimals(null);
      return;
    }

    if (!isValidMint(mint)) {
      setTokenBalance(null);
      setTokenDecimals(null);
      return;
    }

    try {
      setLoadingTokenBalance(true);

      const owner =
        new PublicKey(walletAddress);

      const mintKey =
        new PublicKey(mint);

      const accounts =
        await connection.getParsedTokenAccountsByOwner(
          owner,
          {
            mint: mintKey,
          },
          'confirmed'
        );

      let balance = 0;
      let decimals = 0;

      for (const account of accounts.value) {
        const parsedData =
          account.account.data as any;

        const tokenAmount =
          parsedData?.parsed?.info?.tokenAmount;

        if (tokenAmount) {
          balance += Number(
            tokenAmount.uiAmount || 0
          );

          decimals =
            Number(
              tokenAmount.decimals || 0
            );
        }
      }

      setTokenBalance(balance);
      setTokenDecimals(decimals);
    } catch {
      setTokenBalance(null);
      setTokenDecimals(null);
    } finally {
      setLoadingTokenBalance(false);
    }
  };

  useEffect(() => {
    try {
      const savedTokens =
        localStorage.getItem(
          'moonpad_created_tokens'
        );

      if (savedTokens) {
        const parsed =
          JSON.parse(savedTokens);

        if (Array.isArray(parsed)) {
          setCreatedTokens(parsed);
        }
      }

      const savedActivity =
        localStorage.getItem(
          'moonpad_activity'
        );

      if (savedActivity) {
        const parsed =
          JSON.parse(savedActivity);

        if (Array.isArray(parsed)) {
          setActivity(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const provider = getProvider();

    if (
      provider?.isConnected &&
      provider.publicKey
    ) {
      const address =
        provider.publicKey.toString();

      setConnected(true);
      setWalletAddress(address);
      refreshBalance(address);
    }

    if (provider?.on) {
      const handleAccountChanged = (
        publicKey: PublicKey | null
      ) => {
        if (!publicKey) {
          setConnected(false);
          setWalletAddress('');
          setSolBalance(null);
          setTokenBalance(null);
          setTokenDecimals(null);
          return;
        }

        const address =
          publicKey.toString();

        setConnected(true);
        setWalletAddress(address);
        refreshBalance(address);
        refreshTokenBalance();

        addActivity(
          'Wallet',
          'account changed'
        );
      };

      const handleDisconnect = () => {
        setConnected(false);
        setWalletAddress('');
        setSolBalance(null);
        setTokenBalance(null);
        setTokenDecimals(null);

        addActivity(
          'Wallet',
          'disconnected'
        );
      };

      provider.on(
        'accountChanged',
        handleAccountChanged
      );

      provider.on(
        'disconnect',
        handleDisconnect
      );

      return () => {
        try {
          provider.removeListener?.(
            'accountChanged',
            handleAccountChanged
          );

          provider.removeListener?.(
            'disconnect',
            handleDisconnect
          );
        } catch {}
      };
    }
  }, []);

  useEffect(() => {
    if (
      !connected ||
      !walletAddress
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        refreshBalance(walletAddress);

        if (tradeMint.trim()) {
          refreshTokenBalance(
            tradeMint.trim()
          );
        }
      }, 15000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    connected,
    walletAddress,
    tradeMint,
  ]);

  useEffect(() => {
    if (
      !connected ||
      !walletAddress ||
      !tradeMint.trim()
    ) {
      setTokenBalance(null);
      setTokenDecimals(null);
      return;
    }

    const timeout =
      window.setTimeout(() => {
        refreshTokenBalance(
          tradeMint.trim()
        );
      }, 350);

    return () =>
      window.clearTimeout(timeout);
  }, [
    connected,
    walletAddress,
    tradeMint,
  ]);

  const connectWallet = async () => {
    const provider = getProvider();

    if (!provider) {
      notify(
        'Phantom wallet not found'
      );
      return;
    }

    if (connecting) {
      return;
    }

    try {
      setConnecting(true);

      const response =
        await provider.connect();

      const address =
        response.publicKey.toString();

      setConnected(true);
      setWalletAddress(address);

      await refreshBalance(address);

      addActivity(
        'Wallet',
        'connected successfully'
      );

      notify(
        `Wallet connected: ${address.slice(
          0,
          4
        )}...`
      );
    } catch {
      notify(
        'Wallet connection cancelled'
      );
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    const provider = getProvider();

    try {
      await provider?.disconnect();
    } catch {}

    setConnected(false);
    setWalletAddress('');
    setSolBalance(null);
    setTokenBalance(null);
    setTokenDecimals(null);
    setTradeStatus('');
    setBotEnabled(false);
    setTriggered(null);

    addActivity(
      'Wallet',
      'disconnected'
    );

    notify(
      'Wallet disconnected'
    );
  };

  const handleRefreshBalance = async () => {
    if (!walletAddress) {
      notify(
        'Connect Phantom first'
      );
      return;
    }

    try {
      setRefreshingBalance(true);

      await refreshBalance(
        walletAddress
      );

      if (tradeMint.trim()) {
        await refreshTokenBalance(
          tradeMint.trim()
        );
      }

      notify(
        'Balances refreshed'
      );
    } finally {
      setRefreshingBalance(false);
    }
  };

  const getPrice = async (
    mint: string
  ) => {
    const cleanMint =
      mint.trim();

    if (!isValidMint(cleanMint)) {
      throw new Error(
        'Invalid Solana token mint address.'
      );
    }

    const response = await fetch(
      `/api/price?mint=${encodeURIComponent(
        cleanMint
      )}`,
      {
        cache: 'no-store',
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          'Unable to retrieve token price'
      );
    }

    const price =
      Number(data.price);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error(
        'Invalid token price'
      );
    }

    return price;
  };

  const sendSwap = async ({
    inputMint,
    outputMint,
    amount,
    action,
  }: {
    inputMint: string;
    outputMint: string;
    amount: string;
    action: 'Buy' | 'Sell';
  }) => {
    const provider = getProvider();

    if (tradeLoading) {
      throw new Error(
        'A transaction is already processing.'
      );
    }

    if (
      !provider ||
      !provider.publicKey
    ) {
      throw new Error(
        'Connect Phantom first.'
      );
    }

    if (
      !amount ||
      !/^\d+$/.test(amount) ||
      amount === '0'
    ) {
      throw new Error(
        action === 'Buy'
          ? 'Enter a valid SOL amount.'
          : 'Enter a valid token amount.'
      );
    }

    if (
      !isValidMint(inputMint) ||
      !isValidMint(outputMint)
    ) {
      throw new Error(
        'Invalid token mint address.'
      );
    }

    setTradeLoading(true);

    setTradeStatus(
      `Preparing ${action.toLowerCase()} transaction...`
    );

    try {
      const response = await fetch(
        '/api/swap',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            inputMint,
            outputMint,
            amount,
            userPublicKey:
              provider.publicKey.toString(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to prepare ${action.toLowerCase()}`
        );
      }

      if (!data.swapTransaction) {
        throw new Error(
          'Swap transaction was not returned.'
        );
      }

      setTradeStatus(
        `Transaction ready — approve ${action.toLowerCase()} in Phantom.`
      );

      const transaction =
        VersionedTransaction.deserialize(
          Uint8Array.from(
            atob(
              data.swapTransaction
            ),
            (character) =>
              character.charCodeAt(0)
          )
        );

      const signed =
        await provider.signTransaction(
          transaction
        );

      setTradeStatus(
        `Sending ${action.toLowerCase()} transaction to Solana...`
      );

      const signature =
        await connection.sendRawTransaction(
          signed.serialize(),
          {
            maxRetries: 3,
            skipPreflight: false,
          }
        );

      setTradeStatus(
        'Transaction submitted — waiting for confirmation...'
      );

      const recentBlockhash =
        transaction.message
          .recentBlockhash;

      if (
        data.lastValidBlockHeight &&
        recentBlockhash
      ) {
        await connection.confirmTransaction(
          {
            signature,
            blockhash:
              recentBlockhash,
            lastValidBlockHeight:
              data.lastValidBlockHeight,
          },
          'confirmed'
        );
      } else {
        await connection.confirmTransaction(
          signature,
          'confirmed'
        );
      }

      setLastSignature(
        signature
      );

      setTradeStatus(
        `${action} confirmed: ${signature.slice(
          0,
          8
        )}...`
      );

      addActivity(
        'Trade',
        `${action.toLowerCase()} confirmed`
      );

      notify(
        `${action} confirmed`
      );

      await refreshBalance();

      if (tradeMint.trim()) {
        await refreshTokenBalance(
          tradeMint.trim()
        );
      }

      return signature;
    } finally {
      setTradeLoading(false);
    }
  };

  const handleBuy = async () => {
    if (tradeLoading) {
      return;
    }

    try {
      if (!connected) {
        throw new Error(
          'Connect Phantom first.'
        );
      }

      const mint =
        tradeMint.trim();

      if (!mint) {
        throw new Error(
          'Enter a token mint address.'
        );
      }

      if (!isValidMint(mint)) {
        throw new Error(
          'Invalid Solana token mint address.'
        );
      }

      if (
        !tradeAmount ||
        !/^\d+(\.\d+)?$/.test(
          tradeAmount.trim()
        ) ||
        Number(tradeAmount) <= 0
      ) {
        throw new Error(
          'Enter a valid SOL amount.'
        );
      }

      if (
        solBalance !== null &&
        Number(tradeAmount) >=
          solBalance
      ) {
        throw new Error(
          'Leave enough SOL for network fees.'
        );
      }

      const lamports =
        Math.floor(
          Number(tradeAmount) *
            1_000_000_000
        );

      if (
        !Number.isSafeInteger(
          lamports
        ) ||
        lamports <= 0
      ) {
        throw new Error(
          'Buy amount is invalid.'
        );
      }

      await sendSwap({
        inputMint: SOL_MINT,
        outputMint: mint,
        amount:
          lamports.toString(),
        action: 'Buy',
      });

      await refreshTokenBalance(
        mint
      );
    } catch (error) {
      console.error(
        'MoonPad buy error:',
        error
      );

      setTradeStatus(
        error instanceof Error
          ? error.message
          : 'Buy failed.'
      );

      setTradeLoading(false);
    }
  };

  const handleSell = async () => {
    if (tradeLoading) {
      return;
    }

    try {
      if (!connected) {
        throw new Error(
          'Connect Phantom first.'
        );
      }

      const mint =
        tradeMint.trim();

      if (!mint) {
        throw new Error(
          'Enter a token mint address.'
        );
      }

      if (!isValidMint(mint)) {
        throw new Error(
          'Invalid Solana token mint address.'
        );
      }

      if (!sellAmount.trim()) {
        throw new Error(
          'Enter the token amount to sell.'
        );
      }

      if (
        !/^\d+(\.\d+)?$/.test(
          sellAmount.trim()
        ) ||
        Number(sellAmount) <= 0
      ) {
        throw new Error(
          'Enter a valid token amount.'
        );
      }

      if (
        tokenBalance !== null &&
        Number(sellAmount) >
          tokenBalance
      ) {
        throw new Error(
          'Sell amount exceeds your token balance.'
        );
      }

      if (
        tokenDecimals === null
      ) {
        throw new Error(
          'Token decimals are not available yet. Refresh the token balance.'
        );
      }

      const baseUnits =
        toTokenBaseUnits(
          sellAmount,
          tokenDecimals
        );

      if (baseUnits === '0') {
        throw new Error(
          'Sell amount is too small.'
        );
      }

      await sendSwap({
        inputMint: mint,
        outputMint: SOL_MINT,
        amount:
          baseUnits,
        action: 'Sell',
      });

      setSellAmount('');

      await refreshTokenBalance(
        mint
      );
    } catch (error) {
      console.error(
        'MoonPad sell error:',
        error
      );

      setTradeStatus(
        error instanceof Error
          ? error.message
          : 'Sell failed.'
      );

      setTradeLoading(false);
    }
  };

  const fillMaxSell = () => {
    if (
      tokenBalance === null ||
      tokenBalance <= 0
    ) {
      notify(
        'No token balance detected'
      );
      return;
    }

    setSellAmount(
      tokenBalance.toString()
    );
  };

  const startBot = async () => {
    if (!connected) {
      notify(
        'Connect Phantom first.'
      );
      return;
    }

    const mint =
      tradeMint.trim();

    if (!mint) {
      notify(
        'Enter a token mint.'
      );
      return;
    }

    if (!isValidMint(mint)) {
      notify(
        'Enter a valid Solana mint.'
      );
      return;
    }

    if (
      !tradeAmount ||
      Number(tradeAmount) <= 0
    ) {
      notify(
        'Enter the entry amount.'
      );
      return;
    }

    if (
      !stopLoss ||
      Number(stopLoss) <= 0
    ) {
      notify(
        'Enter a stop-loss percentage.'
      );
      return;
    }

    if (
      !takeProfit ||
      Number(takeProfit) <= 0
    ) {
      notify(
        'Enter a take-profit percentage.'
      );
      return;
    }

    try {
      setTradeStatus(
        'Reading current token price...'
      );

      const price =
        await getPrice(mint);

      setEntryPrice(price);
      setCurrentPrice(price);
      setChangePercent(0);
      setTriggered(null);
      setBotEnabled(true);

      addActivity(
        'Trading Assistant',
        `started monitoring ${mint.slice(
          0,
          8
        )}...`
      );

      setTradeStatus(
        `Bot active — entry price: $${formatPrice(
          price
        )}`
      );

      notify(
        'Trading assistant enabled'
      );
    } catch (error) {
      setTradeStatus(
        error instanceof Error
          ? error.message
          : 'Unable to start assistant.'
      );
    }
  };

  const stopBot = () => {
    setBotEnabled(false);

    addActivity(
      'Trading Assistant',
      'monitoring paused'
    );

    setTradeStatus(
      'Trading assistant paused.'
    );

    notify(
      'Trading assistant paused'
    );
  };

  useEffect(() => {
    if (!botEnabled) {
      return;
    }

    if (
      !tradeMint.trim() ||
      entryPrice === null
    ) {
      return;
    }

    let stopped = false;

    const monitor =
      async () => {
        try {
          const price =
            await getPrice(
              tradeMint.trim()
            );

          if (stopped) {
            return;
          }

          setCurrentPrice(price);

          const percent =
            ((price - entryPrice) /
              entryPrice) *
            100;

          setChangePercent(
            percent
          );

          const stop =
            Number(stopLoss);

          const target =
            Number(takeProfit);

          if (
            Number.isFinite(stop) &&
            stop > 0 &&
            percent <= -stop
          ) {
            setTriggered(
              'STOP-LOSS'
            );

            setBotEnabled(false);

            setTradeStatus(
              `STOP-LOSS TRIGGERED: ${percent.toFixed(
                2
              )}%`
            );

            addActivity(
              'Trading Assistant',
              `stop-loss triggered at ${percent.toFixed(
                2
              )}%`
            );

            notify(
              'Stop-loss triggered'
            );

            return;
          }

          if (
            Number.isFinite(target) &&
            target > 0 &&
            percent >= target
          ) {
            setTriggered(
              'TAKE-PROFIT'
            );

            setBotEnabled(false);

            setTradeStatus(
              `TAKE-PROFIT TRIGGERED: +${percent.toFixed(
                2
              )}%`
            );

            addActivity(
              'Trading Assistant',
              `take-profit triggered at +${percent.toFixed(
                2
              )}%`
            );

            notify(
              'Take-profit triggered'
            );

            return;
          }

          setTradeStatus(
            `Bot active: ${
              percent >= 0
                ? '+'
                : ''
            }${percent.toFixed(
              2
            )}%`
          );
        } catch (error) {
          if (!stopped) {
            setTradeStatus(
              error instanceof Error
                ? error.message
                : 'Price check failed.'
            );
          }
        }
      };

    monitor();

    const interval =
      window.setInterval(
        monitor,
        5000
      );

    return () => {
      stopped = true;
      window.clearInterval(
        interval
      );
    };
  }, [
    botEnabled,
    tradeMint,
    stopLoss,
    takeProfit,
    entryPrice,
  ]);

  const refreshWatchPrice =
    async () => {
      const mint =
        tradeMint.trim();

      if (!mint) {
        notify(
          'Enter a token mint first.'
        );
        return;
      }

      if (!isValidMint(mint)) {
        notify(
          'Enter a valid Solana mint.'
        );
        return;
      }

      try {
        setLoadingPrice(true);

        const price =
          await getPrice(mint);

        setWatchPrice(price);
        setWatching(true);

        addActivity(
          'Market Monitor',
          `price updated for ${mint.slice(
            0,
            8
          )}...`
        );

        notify(
          'Token price updated'
        );
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : 'Unable to read price.'
        );
      } finally {
        setLoadingPrice(false);
      }
    };

  const saveCreatedToken = (
    token: TokenItem
  ) => {
    setCreatedTokens(
      (previous) => {
        const next = [
          token,
          ...previous.filter(
            (item) =>
              item.mint !==
              token.mint
          ),
        ];

        try {
          localStorage.setItem(
            'moonpad_created_tokens',
            JSON.stringify(next)
          );
        } catch {}

        return next;
      }
    );
  };

  const selectToken = (
    mint: string
  ) => {
    setTradeMint(mint);
    setActive('AI Agents');

    window.setTimeout(() => {
      refreshTokenBalance(mint);
    }, 0);

    notify(
      'Token loaded into trading'
    );
  };

  const estimatedPnlSol =
    changePercent !== null &&
    tradeAmount &&
    Number(tradeAmount) > 0
      ? Number(tradeAmount) *
        (changePercent / 100)
      : null;

  const nav = [
    [
      'Dashboard',
      LayoutDashboard,
    ],
    [
      'Launch Token',
      Rocket,
    ],
    [
      'AI Agents',
      Bot,
    ],
    [
      'My Tokens',
      CircleDollarSign,
    ],
    [
      'Activity',
      Activity,
    ],
    [
      'Settings',
      Settings,
    ],
  ] as const;

  const pageTitle =
    active === 'Dashboard'
      ? 'Good morning, MoonBuilder.'
      : active;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="moon">
            ☾
          </div>

          <div>
            <b>MoonPad</b>
            <span>
              AI token platform
            </span>
          </div>
        </div>

        <nav>
          {nav.map(
            ([label, Icon]) => (
              <button
                key={label}
                className={
                  active === label
                    ? 'nav active'
                    : 'nav'
                }
                onClick={() => {
                  if (
                    label ===
                    'Launch Token'
                  ) {
                    setShowLaunch(
                      true
                    );
                    return;
                  }

                  setActive(label);
                }}
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>

                {label ===
                  'Dashboard' && (
                  <i>⌂</i>
                )}
              </button>
            )
          )}
        </nav>

        <div className="side-card">
          <Sparkles size={18} />

          <b>MoonPad AI</b>

          <p>
            Your agent workspace
            is ready.
          </p>

          <button
            onClick={() =>
              setActive(
                'AI Agents'
              )
            }
          >
            Open agents
            <ChevronRight
              size={15}
            />
          </button>
        </div>

        <div className="network">
          <span className="dot" />

          Solana network

          <small>
            Mainnet
          </small>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              {active.toUpperCase()}
            </div>

            <h1>
              {pageTitle}
            </h1>
          </div>

          <div className="top-actions">
            <div className="search">
              <Search size={15} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search tokens..."
              />
            </div>

            <button
              className={
                connected
                  ? 'wallet connected'
                  : 'wallet'
              }
              onClick={
                connected
                  ? disconnectWallet
                  : connectWallet
              }
              disabled={
                connecting
              }
            >
              <Wallet size={17} />

              {connecting
                ? 'Connecting...'
                : connected
                ? `${walletAddress.slice(
                    0,
                    4
                  )}...${walletAddress.slice(
                    -4
                  )}`
                : 'Connect Wallet'}
            </button>
          </div>
        </header>

        {active ===
          'Dashboard' && (
          <>
            <div className="hero">
              <div>
                <span className="pill">
                  <Zap size={13} />
                  AI-POWERED TOKEN
                  PLATFORM
                </span>

                <h2>
                  Launch.
                  <br />
                  Monitor.
                  <br />
                  <em>
                    Build.
                  </em>
                </h2>

                <p>
                  One workspace for
                  your tokens, agents,
                  and on-chain activity.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() =>
                      setShowLaunch(
                        true
                      )
                    }
                  >
                    <Rocket
                      size={17}
                    />
                    Launch Token
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      setActive(
                        'AI Agents'
                      )
                    }
                  >
                    <Bot size={17} />
                    Explore Agents
                  </button>
                </div>
              </div>

              <div className="orb">
                <div className="orb-ring" />

                <div className="orb-core">
                  ☾
                </div>
              </div>
            </div>

            <div className="toolbar">
              <div className="stat">
                <small>
                  Wallet
                </small>

                <b>
                  {connected
                    ? `${walletAddress.slice(
                        0,
                        4
                      )}...${walletAddress.slice(
                        -4
                      )}`
                    : 'Not connected'}
                </b>
              </div>

              <div className="stat">
                <small>
                  SOL balance
                </small>

                <b>
                  {solBalance !== null
                    ? `${solBalance.toFixed(
                        4
                      )} SOL`
                    : '—'}
                </b>
              </div>

              <div className="stat">
                <small>
                  Tokens created
                </small>

                <b>
                  {createdTokens.length}
                </b>
              </div>

              <div className="stat">
                <small>
                  Assistant
                </small>

                <b
                  className={
                    botEnabled
                      ? 'up'
                      : ''
                  }
                >
                  {botEnabled
                    ? 'ACTIVE'
                    : 'PAUSED'}
                </b>
              </div>
            </div>

            <section className="section">
              <div className="section-head">
                <div>
                  <h3>
                    Your Tokens
                  </h3>

                  <p>
                    Live portfolio
                    activity
                  </p>
                </div>

                <button
                  className="text-btn"
                  onClick={() =>
                    setActive(
                      'My Tokens'
                    )
                  }
                >
                  View all
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>

              <div className="token-grid">
                {filteredTokens
                  .slice(0, 2)
                  .map((t) => (
                    <TokenCard
                      key={
                        t.mint ||
                        t.ticker
                      }
                      t={t}
                      onCopy={
                        t.mint
                          ? () =>
                              copyText(
                                t.mint!,
                                'Mint copied'
                              )
                          : undefined
                      }
                      onTrade={
                        t.mint
                          ? () =>
                              selectToken(
                                t.mint!
                              )
                          : undefined
                      }
                    />
                  ))}
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h3>
                    Market Monitor
                  </h3>

                  <p>
                    Check a Solana
                    token's live price
                  </p>
                </div>
              </div>

              <div className="bot-panel">
                <div>
                  <span className="eyebrow">
                    LIVE PRICE
                  </span>

                  <h3>
                    Token monitor
                  </h3>

                  <p>
                    Enter any Solana
                    token mint to read
                    its current Jupiter
                    price.
                  </p>
                </div>

                <div className="trade-controls">
                  <input
                    value={
                      tradeMint
                    }
                    onChange={(e) =>
                      setTradeMint(
                        e.target.value
                      )
                    }
                    placeholder="Token mint address"
                  />

                  <button
                    onClick={
                      refreshWatchPrice
                    }
                    disabled={
                      loadingPrice
                    }
                  >
                    {loadingPrice
                      ? 'Reading...'
                      : 'Check Price'}
                  </button>

                  {watching &&
                    watchPrice !==
                      null && (
                      <span>
                        Current price: $
                        {formatPrice(
                          watchPrice
                        )}
                      </span>
                    )}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h3>
                    AI Agents
                  </h3>

                  <p>
                    Automations running
                    for your workspace
                  </p>
                </div>

                <button
                  className="text-btn"
                  onClick={() =>
                    setActive(
                      'AI Agents'
                    )
                  }
                >
                  Manage
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>

              <div className="agent-grid">
                <AgentCard
                  icon={
                    <Bot size={20} />
                  }
                  name="Agent #001"
                  type="Market Monitor"
                  running={
                    running
                  }
                  onToggle={() =>
                    setRunning(
                      !running
                    )
                  }
                  description="Watching price, volume & holders"
                />

                <AgentCard
                  icon={
                    <Sparkles
                      size={20}
                    />
                  }
                  name="Agent #002"
                  type="Community Monitor"
                  running={true}
                  description="Tracking community activity"
                />
              </div>
            </section>

            <ActivityLog
              events={activity}
              onOpen={() =>
                setActive(
                  'Activity'
                )
              }
            />
          </>
        )}

        {active ===
          'My Tokens' && (
          <PageShell
            title="Token portfolio"
            subtitle="Everything created or watched in your MoonPad workspace."
          >
            <div className="toolbar">
              <div className="stat">
                <small>
                  Total tracked
                </small>

                <b>
                  {allTokens.length}
                </b>
              </div>

              <div className="stat">
                <small>
                  Created by you
                </small>

                <b>
                  {createdTokens.length}
                </b>
              </div>

              <div className="stat">
                <small>
                  Network
                </small>

                <b>
                  Solana Mainnet
                </b>
              </div>
            </div>

            {createdTokens.length >
              0 && (
              <div className="section">
                <div className="section-head">
                  <div>
                    <h3>
                      Your launches
                    </h3>

                    <p>
                      Tokens launched
                      through MoonPad
                    </p>
                  </div>
                </div>

                <div className="token-list">
                  {createdTokens.map(
                    (t) => (
                      <TokenCard
                        key={
                          t.mint
                        }
                        t={t}
                        large
                        onCopy={() =>
                          copyText(
                            t.mint!,
                            'Mint copied'
                          )
                        }
                        onTrade={() =>
                          selectToken(
                            t.mint!
                          )
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            <div className="section">
              <div className="section-head">
                <div>
                  <h3>
                    Tracked tokens
                  </h3>

                  <p>
                    MoonPad market
                    workspace
                  </p>
                </div>
              </div>

              <div className="token-list">
                {filteredTokens.map(
                  (t) => (
                    <TokenCard
                      key={
                        t.mint ||
                        t.ticker
                      }
                      t={t}
                      large
                      onCopy={
                        t.mint
                          ? () =>
                              copyText(
                                t.mint!,
                                'Mint copied'
                              )
                          : undefined
                      }
                      onTrade={
                        t.mint
                          ? () =>
                              selectToken(
                                t.mint!
                              )
                          : undefined
                      }
                    />
                  )
                )}
              </div>
            </div>

            {lastSignature && (
              <div className="bot-panel">
                <div>
                  <span className="eyebrow">
                    LAST TRANSACTION
                  </span>

                  <h3>
                    On-chain activity
                  </h3>

                  <p>
                    Your latest MoonPad
                    transaction is
                    available on Solscan.
                  </p>
                </div>

                <a
                  href={`https://solscan.io/tx/${lastSignature}`}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary"
                >
                  View transaction
                  <ExternalLink
                    size={14}
                  />
                </a>
              </div>
            )}
          </PageShell>
        )}

        {active ===
          'AI Agents' && (
          <PageShell
            title="AI agent workspace"
            subtitle="Monitor markets and prepare trades for Phantom approval."
          >
            <div className="agent-grid">
              <AgentCard
                icon={
                  <Bot size={20} />
                }
                name="Agent #001"
                type="Market Monitor"
                running={
                  running
                }
                onToggle={() =>
                  setRunning(
                    !running
                  )
                }
                description="Price, volume, liquidity and holder changes"
              />

              <AgentCard
                icon={
                  <Sparkles
                    size={20}
                  />
                }
                name="Agent #002"
                type="Community Monitor"
                running={true}
                description="Community activity and mention tracking"
              />
            </div>

            <div className="bot-panel">
              <div>
                <span className="eyebrow">
                  MANUAL TRADING
                </span>

                <h3>
                  Trade with Phantom
                </h3>

                <p>
                  Every transaction
                  requires Phantom
                  approval before it
                  reaches Solana.
                </p>
              </div>

              <div className="trade-controls">
                <input
                  value={
                    tradeMint
                  }
                  onChange={(e) =>
                    setTradeMint(
                      e.target.value
                    )
                  }
                  placeholder="Token mint address"
                />

                <button
                  className="secondary"
                  onClick={() =>
                    refreshTokenBalance(
                      tradeMint
                    )
                  }
                  disabled={
                    loadingTokenBalance ||
                    !tradeMint.trim()
                  }
                >
                  {loadingTokenBalance
                    ? 'Reading balance...'
                    : 'Refresh Token Balance'}
                </button>

                {tokenBalance !==
                    null && (
                  <span>
                    Available:{' '}
                    {formatTokenBalance(
                      tokenBalance
                    )}
                    {tokenDecimals !==
                      null &&
                      ` · ${tokenDecimals} decimals`}
                  </span>
                )}

                <input
                  value={
                    tradeAmount
                  }
                  onChange={(e) =>
                    setTradeAmount(
                      e.target.value
                    )
                  }
                  placeholder="Buy amount in SOL"
                  type="number"
                  min="0"
                  step="any"
                />

                <button
                  onClick={
                    handleBuy
                  }
                  disabled={
                    tradeLoading
                  }
                >
                  {tradeLoading
                    ? 'Processing...'
                    : 'Buy'}
                </button>

                <input
                  value={
                    sellAmount
                  }
                  onChange={(e) =>
                    setSellAmount(
                      e.target.value
                    )
                  }
                  placeholder="Sell token amount"
                  type="number"
                  min="0"
                  step="any"
                />

                <button
                  className="secondary"
                  onClick={
                    fillMaxSell
                  }
                  disabled={
                    tokenBalance ===
                      null ||
                    tokenBalance <=
                      0 ||
                    tradeLoading
                  }
                >
                  Use Max
                </button>

                <button
                  onClick={
                    handleSell
                  }
                  disabled={
                    tradeLoading
                  }
                >
                  {tradeLoading
                    ? 'Processing...'
                    : 'Sell'}
                </button>

                <span>
                  Enter token amounts
                  normally. MoonPad
                  converts them into
                  exact on-chain base
                  units automatically.
                </span>

                {tradeStatus && (
                  <span>
                    {tradeStatus}
                  </span>
                )}

                {lastSignature && (
                  <a
                    href={`https://solscan.io/tx/${lastSignature}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View transaction
                    <ExternalLink
                      size={14}
                    />
                  </a>
                )}
              </div>
            </div>

            <div className="bot-panel">
              <div>
                <span className="eyebrow">
                  AUTOMATED TRADING
                </span>

                <h3>
                  Trading assistant
                </h3>

                <p>
                  MoonPad monitors the
                  token price every five
                  seconds and detects your
                  stop-loss or take-profit
                  threshold.
                </p>
              </div>

              <div className="trade-controls">
                <input
                  value={
                    tradeMint
                  }
                  onChange={(e) =>
                    setTradeMint(
                      e.target.value
                    )
                  }
                  placeholder="Token mint address"
                />

                <input
                  value={
                    tradeAmount
                  }
                  onChange={(e) =>
                    setTradeAmount(
                      e.target.value
                    )
                  }
                  placeholder="Entry amount in SOL"
                  type="number"
                  min="0"
                  step="any"
                />

                <input
                  value={
                    stopLoss
                  }
                  onChange={(e) =>
                    setStopLoss(
                      e.target.value
                    )
                  }
                  placeholder="Stop-loss %"
                  type="number"
                  min="0"
                  step="0.1"
                />

                <input
                  value={
                    takeProfit
                  }
                  onChange={(e) =>
                    setTakeProfit(
                      e.target.value
                    )
                  }
                  placeholder="Take-profit %"
                  type="number"
                  min="0"
                  step="0.1"
                />

                <button
                  className={
                    botEnabled
                      ? 'toggle on'
                      : 'toggle'
                  }
                  onClick={
                    botEnabled
                      ? stopBot
                      : startBot
                  }
                  disabled={
                    tradeLoading
                  }
                >
                  {botEnabled ? (
                    <Pause
                      size={15}
                    />
                  ) : (
                    <Play
                      size={15}
                    />
                  )}

                  {botEnabled
                    ? 'Enabled'
                    : 'Enable'}
                </button>

                {entryPrice !==
                    null && (
                  <span>
                    Entry: $
                    {formatPrice(
                      entryPrice
                    )}
                  </span>
                )}

                {currentPrice !==
                    null && (
                  <span>
                    Current: $
                    {formatPrice(
                      currentPrice
                    )}
                  </span>
                )}

                {changePercent !==
                    null && (
                  <span
                    className={
                      changePercent >=
                      0
                        ? 'up'
                        : ''
                    }
                  >
                    P&amp;L:{' '}
                    {changePercent >=
                    0
                      ? '+'
                      : ''}
                    {changePercent.toFixed(
                      2
                    )}
                    %
                  </span>
                )}

                {estimatedPnlSol !==
                    null && (
                  <span
                    className={
                      estimatedPnlSol >=
                      0
                        ? 'up'
                        : ''
                    }
                  >
                    Estimated P&amp;L:{' '}
                    {estimatedPnlSol >=
                    0
                      ? '+'
                      : '-'}
                    {Math.abs(
                      estimatedPnlSol
                    ).toFixed(6)}{' '}
                    SOL
                  </span>
                )}

                {triggered && (
                  <div className="modal-preview">
                    <span>
                      TRIGGER DETECTED
                    </span>

                    <b>
                      {triggered}
                    </b>

                    <small>
                      MoonPad detected
                      the condition.
                      Phantom approval
                      is still required
                      for the actual
                      transaction.
                    </small>

                    <button
                      className="primary"
                      onClick={() => {
                        setTradeStatus(
                          `${triggered} detected. Enter the token amount above and press Sell to approve the transaction in Phantom.`
                        );

                        setTriggered(
                          null
                        );
                      }}
                    >
                      Prepare Manual Sell
                    </button>
                  </div>
                )}

                {tradeStatus && (
                  <span>
                    {tradeStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-head">
                <div>
                  <h3>
                    Execution model
                  </h3>

                  <p>
                    MoonPad separates
                    wallet approval from
                    market monitoring.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting">
                  <Wallet
                    size={18}
                  />

                  <div>
                    <b>
                      Phantom
                      approval
                    </b>

                    <span>
                      User signs
                      transactions
                      directly.
                    </span>
                  </div>
                </div>

                <div className="setting">
                  <Gauge
                    size={18}
                  />

                  <div>
                    <b>
                      Price
                      monitoring
                    </b>

                    <span>
                      Jupiter price
                      data is checked
                      every 5 seconds.
                    </span>
                  </div>
                </div>

                <div className="setting">
                  <Zap
                    size={18}
                  />

                  <div>
                    <b>
                      Trigger
                      detection
                    </b>

                    <span>
                      Stop-loss and
                      take-profit
                      conditions are
                      calculated
                      locally.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>
        )}

        {active ===
          'Activity' && (
          <PageShell
            title="Activity log"
            subtitle="Recent events from your MoonPad workspace."
          >
            <ActivityLog
              events={activity}
            />
          </PageShell>
        )}

        {active ===
          'Settings' && (
          <PageShell
            title="Settings"
            subtitle="Workspace preferences and connection controls."
          >
            <div className="settings-grid">
              <div className="setting">
                <Gauge size={18} />

                <div>
                  <b>
                    Network
                  </b>

                  <span>
                    Solana · Mainnet
                  </span>
                </div>
              </div>

              <div className="setting">
                <Wallet size={18} />

                <div>
                  <b>
                    Wallet
                  </b>

                  <span>
                    {connected
                      ? `${walletAddress.slice(
                          0,
                          4
                        )}...${walletAddress.slice(
                          -4
                        )} connected`
                      : 'No wallet connected'}
                  </span>
                </div>
              </div>

              <div className="setting">
                <Zap size={18} />

                <div>
                  <b>
                    Execution
                  </b>

                  <span>
                    Real transactions
                    require Phantom
                    approval
                  </span>
                </div>
              </div>

              <div className="setting">
                <Activity
                  size={18}
                />

                <div>
                  <b>
                    Price API
                  </b>

                  <span>
                    Jupiter market
                    pricing
                  </span>
                </div>
              </div>
            </div>

            {connected && (
              <div className="bot-panel">
                <div>
                  <span className="eyebrow">
                    CONNECTED WALLET
                  </span>

                  <h3>
                    {walletAddress.slice(
                      0,
                      8
                    )}
                    ...
                    {walletAddress.slice(
                      -8
                    )}
                  </h3>

                  <p>
                    SOL balance:{' '}
                    {solBalance !==
                    null
                      ? `${solBalance.toFixed(
                          6
                        )} SOL`
                      : 'Loading...'}
                  </p>
                </div>

                <div className="hero-actions">
                  <button
                    className="secondary"
                    onClick={
                      handleRefreshBalance
                    }
                    disabled={
                      refreshingBalance
                    }
                  >
                    <Gauge
                      size={14}
                    />

                    {refreshingBalance
                      ? 'Refreshing...'
                      : 'Refresh'}
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      copyText(
                        walletAddress,
                        'Wallet address copied'
                      )
                    }
                  >
                    <Copy
                      size={14}
                    />
                    Copy address
                  </button>

                  <button
                    className="secondary"
                    onClick={
                      disconnectWallet
                    }
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </PageShell>
        )}

        <footer>
          MoonPad · Solana Mainnet
        </footer>
      </section>

      {showLaunch && (
        <LaunchModal
          onClose={() =>
            setShowLaunch(false)
          }
          onNotify={notify}
          walletAddress={
            walletAddress
          }
          connection={
            connection
          }
          onLaunchSuccess={({
            name,
            ticker,
            mint,
            signature,
          }) => {
            const token: TokenItem = {
              name,
              ticker,
              mc: '—',
              change: '—',
              holders: '—',
              status: 'LIVE',
              mint,
              signature,
              createdAt:
                new Date().toISOString(),
            };

            saveCreatedToken(
              token
            );

            setLastSignature(
              signature
            );

            setTradeMint(
              mint
            );

            addActivity(
              ticker,
              'token launched successfully'
            );
          }}
        />
      )}

      {toast && (
        <div className="toast">
          <Sparkles size={15} />
          {toast}
        </div>
      )}
    </main>
  );
}

function formatPrice(
  price: number
) {
  if (
    price >= 1
  ) {
    return price.toFixed(
      4
    );
  }

  if (
    price >= 0.01
  ) {
    return price.toFixed(
      6
    );
  }

  return price.toPrecision(
    6
  );
}

function formatTokenBalance(
  balance: number
) {
  if (!Number.isFinite(balance)) {
    return '0';
  }

  if (balance === 0) {
    return '0';
  }

  if (balance >= 1000) {
    return balance.toLocaleString(
      undefined,
      {
        maximumFractionDigits: 4,
      }
    );
  }

  return balance.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 9,
    }
  );
}

function TokenCard({
  t,
  large = false,
  onCopy,
  onTrade,
}: {
  t: TokenItem;
  large?: boolean;
  onCopy?: () => void;
  onTrade?: () => void;
}) {
  return (
    <article
      className={
        large
          ? 'token-card large'
          : 'token-card'
      }
    >
      <div className="token-top">
        <div className="token-icon">
          {t.ticker
            .replace('$', '')
            .slice(0, 1)}
        </div>

        <div>
          <b>
            {t.name}
          </b>

          <span>
            {t.ticker}
          </span>
        </div>

        <span
          className={
            t.status === 'LIVE'
              ? 'live'
              : 'watch'
          }
        >
          ● {t.status}
        </span>
      </div>

      <div className="token-stats">
        <div>
          <small>
            Market cap
          </small>

          <strong>
            {t.mc}
          </strong>
        </div>

        <div>
          <small>
            24h
          </small>

          <strong className="up">
            {t.change}
          </strong>
        </div>

        <div>
          <small>
            Holders
          </small>

          <strong>
            {t.holders}
          </strong>
        </div>
      </div>

      <div className="mini-chart">
        {Array.from({
          length: 9,
        }).map((_, i) => (
          <span
            key={i}
            style={{
              height: `${
                30 + i * 8
              }%`,
            }}
          />
        ))}
      </div>

      {t.mint && (
        <div className="token-actions">
          {onTrade && (
            <button
              className="ghost"
              onClick={
                onTrade
              }
            >
              <TrendingUp
                size={13}
              />
              Trade
            </button>
          )}

          {onCopy && (
            <button
              className="ghost"
              onClick={
                onCopy
              }
            >
              <Copy
                size={13}
              />
              Copy mint
            </button>
          )}

          <a
            className="ghost"
            href={`https://solscan.io/token/${t.mint}`}
            target="_blank"
            rel="noreferrer"
          >
            View
            <ExternalLink
              size={13}
            />
          </a>

          <a
            className="ghost"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Check out ${t.ticker} on MoonPad 🚀\n${t.mint}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Share
            <Share2
              size={13}
            />
          </a>
        </div>
      )}
    </article>
  );
}

function AgentCard({
  icon,
  name,
  type,
  running,
  description,
  onToggle,
}: {
  icon: React.ReactNode;
  name: string;
  type: string;
  running: boolean;
  description: string;
  onToggle?: () => void;
}) {
  return (
    <article className="agent-card">
      <div className="agent-icon">
        {icon}
      </div>

      <div className="agent-main">
        <div className="agent-title">
          <b>
            {name}
          </b>

          <span className="status">
            ●{' '}
            {running
              ? 'ACTIVE'
              : 'PAUSED'}
          </span>
        </div>

        <p>
          {type}
        </p>

        <div className="progress">
          <span
            style={{
              width: running
                ? '78%'
                : '24%',
            }}
          />
        </div>

        <small>
          {description}
        </small>
      </div>

      {onToggle ? (
        <button
          className="toggle"
          onClick={
            onToggle
          }
        >
          {running
            ? 'Stop'
            : 'Start'}
        </button>
      ) : (
        <button className="ghost">
          Open
        </button>
      )}
    </article>
  );
}

function ActivityLog({
  events,
  onOpen,
}: {
  events: ActivityEvent[];
  onOpen?: () => void;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h3>
            Live Activity
          </h3>

          <p>
            Recent MoonPad
            events
          </p>
        </div>

        {onOpen && (
          <button
            className="text-btn"
            onClick={
              onOpen
            }
          >
            Full log
            <ChevronRight
              size={15}
            />
          </button>
        )}
      </div>

      <div className="activity">
        {events.map(
          (event, index) => (
            <div
              className="event"
              key={
                event.time +
                event.actor +
                index
              }
            >
              <span className="event-dot" />

              <time>
                {event.time}
              </time>

              <b>
                {event.actor}
              </b>

              <span>
                {event.action}
              </span>

              <Copy
                size={14}
                className="copy"
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <div className="page-intro">
        <span className="pill">
          <TrendingUp
            size={13}
          />
          MOONPAD WORKSPACE
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
}

function LaunchModal({
  onClose,
  onNotify,
  walletAddress,
  connection,
  onLaunchSuccess,
}: {
  onClose: () => void;
  onNotify: (
    message: string
  ) => void;
  walletAddress: string;
  connection: Connection;
  onLaunchSuccess: (data: {
    name: string;
    ticker: string;
    mint: string;
    signature: string;
  }) => void;
}) {
  const [name, setName] =
    useState('');

  const [ticker, setTicker] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [image, setImage] =
    useState('');

  const [review, setReview] =
    useState(false);

  const [launching, setLaunching] =
    useState(false);

  const [success, setSuccess] =
    useState<{
      mint: string;
      signature: string;
    } | null>(null);

  if (success) {
    return (
      <div className="modal-backdrop">
        <div
          className="modal"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <div className="modal-head">
            <div>
              <span className="eyebrow">
                LAUNCH COMPLETE
              </span>

              <h3>
                {name}
              </h3>
            </div>
          </div>

          <div className="modal-preview">
            <span>
              Token
            </span>

            <b>
              {ticker}
            </b>

            <small>
              Your token was
              successfully submitted
              to Solana Mainnet.
            </small>
          </div>

          <div className="modal-preview">
            <span>
              Mint address
            </span>

            <b
              style={{
                wordBreak:
                  'break-all',
              }}
            >
              {success.mint}
            </b>

            <div className="hero-actions">
              <button
                className="secondary"
                onClick={() =>
                  copyValue(
                    success.mint,
                    onNotify,
                    'Mint copied'
                  )
                }
              >
                <Copy
                  size={14}
                />
                Copy mint
              </button>

              <a
                className="secondary"
                href={`https://solscan.io/token/${success.mint}`}
                target="_blank"
                rel="noreferrer"
              >
                Solscan
                <ExternalLink
                  size={14}
                />
              </a>
            </div>
          </div>

          <div className="modal-preview">
            <span>
              Transaction
            </span>

            <b
              style={{
                wordBreak:
                  'break-all',
              }}
            >
              {success.signature}
            </b>

            <a
              className="secondary"
              href={`https://solscan.io/tx/${success.signature}`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
              <ExternalLink
                size={14}
              />
            </a>
          </div>

          <div className="modal-row">
            <button
              className="secondary"
              onClick={() => {
                onNotify(
                  'Launch saved to My Tokens'
                );
                onClose();
              }}
            >
              Done
            </button>

            <button
              className="primary"
              onClick={() => {
                copyValue(
                  `Check out ${ticker} on MoonPad 🚀\n${success.mint}`,
                  onNotify,
                  'Launch text copied'
                );
              }}
            >
              <Share2
                size={15}
              />
              Copy Share Text
            </button>
          </div>

          <p className="note">
            Your launch is now
            saved inside MoonPad.
          </p>
        </div>
      </div>
    );
  }

  if (review) {
    return (
      <div
        className="modal-backdrop"
        onClick={
          launching
            ? undefined
            : onClose
        }
      >
        <div
          className="modal"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <div className="modal-head">
            <div>
              <span className="eyebrow">
                REVIEW LAUNCH
              </span>

              <h3>
                {name ||
                  'Moon Token'}
              </h3>
            </div>

            <button
              className="close"
              onClick={
                launching
                  ? undefined
                  : onClose
              }
              disabled={
                launching
              }
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-preview">
            <span>
              Token details
            </span>

            <b>
              {ticker ||
                '$MOON'}
            </b>

            <small>
              {description}
            </small>
          </div>

          <div className="modal-preview">
            <span>
              Total supply
            </span>

            <b>
              1,000,000,000
            </b>

            <small>
              Creator wallet:{' '}
              {walletAddress.slice(
                0,
                6
              )}
              ...
              {walletAddress.slice(
                -6
              )}
            </small>
          </div>

          <div className="modal-preview">
            <span>
              Network
            </span>

            <b>
              Solana Mainnet
            </b>

            <small>
              Phantom approval is
              required.
            </small>
          </div>

          <div className="modal-row">
            <button
              className="secondary"
              onClick={() =>
                setReview(
                  false
                )
              }
              disabled={
                launching
              }
            >
              Back
            </button>

            <button
              className="primary"
              disabled={
                launching
              }
              onClick={async () => {
                try {
                  setLaunching(
                    true
                  );

                  const provider =
                    (window as any)
                      .phantom
                      ?.solana;

                  if (
                    !provider ||
                    !provider.publicKey
                  ) {
                    throw new Error(
                      'Connect Phantom first.'
                    );
                  }

                  const cleanName =
                    name.trim();

                  const cleanTicker =
                    ticker
                      .replace(
                        '$',
                        ''
                      )
                      .trim()
                      .toUpperCase();

                  const cleanDescription =
                    description.trim();

                  const cleanImage =
                    image.trim();

                  if (
                    !cleanName ||
                    !cleanTicker ||
                    !cleanDescription ||
                    !cleanImage
                  ) {
                    throw new Error(
                      'Complete all token fields first.'
                    );
                  }

                  if (
                    !/^[A-Z0-9]{1,9}$/.test(
                      cleanTicker
                    )
                  ) {
                    throw new Error(
                      'Ticker must contain only letters and numbers.'
                    );
                  }

                  if (
                    !/^https?:\/\//i.test(
                      cleanImage
                    )
                  ) {
                    throw new Error(
                      'Image must be a valid http or https URL.'
                    );
                  }

                  const metadataResponse =
                    await fetch(
                      '/api/metadata',
                      {
                        method:
                          'POST',
                        headers: {
                          'Content-Type':
                            'application/json',
                        },
                        body: JSON.stringify(
                          {
                            name:
                              cleanName,
                            symbol:
                              cleanTicker,
                            description:
                              cleanDescription,
                            image:
                              cleanImage,
                          }
                        ),
                      }
                    );

                  const metadata =
                    await metadataResponse.json();

                  if (
                    !metadataResponse.ok
                  ) {
                    throw new Error(
                      metadata.error ||
                        'Metadata upload failed.'
                    );
                  }

                  const metadataUri =
                    metadata.metadataUri;

                  if (
                    !metadataUri
                  ) {
                    throw new Error(
                      'Metadata URI was not returned.'
                    );
                  }

                  const mintKeypair =
                    Keypair.generate();

                  const creator =
                    new PublicKey(
                      provider.publicKey.toString()
                    );

                  const createInstruction =
                    await PUMP_SDK.createV2Instruction(
                      {
                        mint:
                          mintKeypair.publicKey,
                        name:
                          cleanName,
                        symbol:
                          cleanTicker,
                        uri:
                          metadataUri,
                        creator,
                        user:
                          creator,
                        mayhemMode:
                          false,
                        holderReward:
                          false,
                      }
                    );

                  const transaction =
                    new Transaction().add(
                      createInstruction
                    );

                  const {
                    blockhash,
                    lastValidBlockHeight,
                  } =
                    await connection.getLatestBlockhash(
                      'confirmed'
                    );

                  transaction.recentBlockhash =
                    blockhash;

                  transaction.feePayer =
                    creator;

                  transaction.partialSign(
                    mintKeypair
                  );

                  const signed =
                    await provider.signTransaction(
                      transaction
                    );

                  const signature =
                    await connection.sendRawTransaction(
                      signed.serialize(),
                      {
                        maxRetries: 3,
                        skipPreflight: false,
                      }
                    );

                  setTradeStatusSafe(
                    `Launch submitted: ${signature.slice(
                      0,
                      8
                    )}...`
                  );

                  await connection.confirmTransaction(
                    {
                      signature,
                      blockhash,
                      lastValidBlockHeight,
                    },
                    'confirmed'
                  );

                  const mint =
                    mintKeypair.publicKey.toString();

                  onLaunchSuccess({
                    name:
                      cleanName,
                    ticker:
                      `$${cleanTicker}`,
                    mint,
                    signature,
                  });

                  setSuccess({
                    mint,
                    signature,
                  });

                  onNotify(
                    'Token launch confirmed'
                  );
                } catch (error) {
                  console.error(
                    'MoonPad launch error:',
                    error
                  );

                  onNotify(
                    error instanceof
                    Error
                      ? error.message
                      : 'Launch failed.'
                  );
                } finally {
                  setLaunching(
                    false
                  );
                }
              }}
            >
              <Rocket
                size={16}
              />

              {launching
                ? 'Launching...'
                : 'Approve & Launch'}
            </button>
          </div>

          <p className="note">
            Review everything
            before approving the
            launch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              TOKEN LAUNCHER
            </span>

            <h3>
              Create a token
            </h3>
          </div>

          <button
            className="close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <label>
          Token name

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="Moon Token"
            maxLength={32}
          />
        </label>

        <label>
          Ticker

          <input
            value={ticker}
            onChange={(e) =>
              setTicker(
                e.target.value
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9$]/g,
                    ''
                  )
              )
            }
            placeholder="$MOON"
            maxLength={10}
          />
        </label>

        <label>
          Description

          <textarea
            value={
              description
            }
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Tell people what your token is about..."
            maxLength={500}
          />
        </label>

        <label>
          Token image URL

          <input
            value={image}
            onChange={(e) =>
              setImage(
                e.target.value
              )
            }
            placeholder="https://..."
          />
        </label>

        <label>
          Total supply

          <input
            value="1,000,000,000"
            readOnly
          />
        </label>

        {image.trim() && (
          <div className="modal-preview">
            <span>
              Image preview
            </span>

            <img
              src={image.trim()}
              alt="Token preview"
              style={{
                width: '80px',
                height: '80px',
                objectFit:
                  'cover',
                borderRadius:
                  '14px',
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          </div>
        )}

        <div className="modal-preview">
          <span>
            Preview
          </span>

          <b>
            {name ||
              'Moon Token'}
          </b>

          <small>
            {ticker ||
              '$MOON'}{' '}
            ·{' '}
            {description ||
              'Your token description'}
          </small>
        </div>

        <div className="modal-row">
          <button
            className="secondary"
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            className="primary"
            onClick={() => {
              const cleanTicker =
                ticker
                  .replace(
                    '$',
                    ''
                  )
                  .trim();

              if (
                !name.trim() ||
                !cleanTicker ||
                !description.trim() ||
                !image.trim()
              ) {
                onNotify(
                  'Name, ticker, description, and image are required.'
                );
                return;
              }

              if (
                !/^[A-Za-z0-9]{1,9}$/.test(
                  cleanTicker
                )
              ) {
                onNotify(
                  'Ticker must contain only letters and numbers.'
                );
                return;
              }

              if (
                !/^https?:\/\//i.test(
                  image.trim()
                )
              ) {
                onNotify(
                  'Image must be a valid http or https URL.'
                );
                return;
              }

              if (
                !walletAddress
              ) {
                onNotify(
                  'Connect your Phantom wallet first.'
                );
                return;
              }

              setReview(
                true
              );
            }}
          >
            <Rocket
              size={16}
            />

            Review Launch
          </button>
        </div>

        <p className="note">
          Your token launch will
          be submitted to Solana
          Mainnet after Phantom
          approval.
        </p>
      </div>
    </div>
  );
}

function setTradeStatusSafe(
  _message: string
) {
  // Launch status is intentionally kept
  // inside the launch modal flow.
}

function copyValue(
  value: string,
  notify: (
    message: string
  ) => void,
  message: string
) {
  navigator.clipboard
    .writeText(value)
    .then(() =>
      notify(message)
    )
    .catch(() =>
      notify('Copy failed')
    );
}
