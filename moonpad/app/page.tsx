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

const STATIC_TOKENS = [
  {
    name: 'Moon',
    ticker: '$MOON',
    mc: '$12.4K',
    change: '+18.4%',
    holders: '2,481',
    status: 'LIVE',
    mint: '',
  },
  {
    name: 'Lunar Doge',
    ticker: '$LDOGE',
    mc: '$4.8K',
    change: '+7.2%',
    holders: '812',
    status: 'LIVE',
    mint: '',
  },
  {
    name: 'MoonCat',
    ticker: '$MCAT',
    mc: '$2.1K',
    change: '+3.9%',
    holders: '391',
    status: 'WATCH',
    mint: '',
  },
];

type TokenRecord = {
  name: string;
  ticker: string;
  mc: string;
  change: string;
  holders: string;
  status: string;
  mint: string;
  image?: string;
  description?: string;
  signature?: string;
  createdAt?: string;
  watched?: boolean;
};

type ActivityEvent = {
  time: string;
  actor: string;
  action: string;
};

type TradeRecord = {
  signature: string;
  action: 'Buy' | 'Sell';
  mint: string;
  amount: string;
  time: string;
};

export default function Home() {
  const connection = useMemo(
    () => new Connection(SOLANA_RPC, 'confirmed'),
    []
  );

  const [active, setActive] =
    useState('Dashboard');

  const [connected, setConnected] =
    useState(false);

  const [walletAddress, setWalletAddress] =
    useState('');

  const [solBalance, setSolBalance] =
    useState<number | null>(null);

  const [running, setRunning] =
    useState(true);

  const [showLaunch, setShowLaunch] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [toast, setToast] =
    useState('');

  const [tradeMint, setTradeMint] =
    useState('');

  const [tradeAmount, setTradeAmount] =
    useState('');

  const [sellAmount, setSellAmount] =
    useState('');

  const [stopLoss, setStopLoss] =
    useState('');

  const [takeProfit, setTakeProfit] =
    useState('');

  const [tradeStatus, setTradeStatus] =
    useState('');

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

  const [watchMint, setWatchMint] =
    useState('');

  const [copyStatus, setCopyStatus] =
    useState('');

  const [tradeLoading, setTradeLoading] =
    useState<'Buy' | 'Sell' | null>(null);

  const [activity, setActivity] =
    useState<ActivityEvent[]>([]);

  const [createdTokens, setCreatedTokens] =
    useState<TokenRecord[]>([]);

  const [trades, setTrades] =
    useState<TradeRecord[]>([]);

  const [launchResult, setLaunchResult] =
    useState<{
      mint: string;
      signature: string;
      name: string;
      ticker: string;
    } | null>(null);

  const [isClient, setIsClient] =
    useState(false);

  useEffect(() => {
    setIsClient(true);

    try {
      const savedActivity =
        localStorage.getItem(
          'moonpad_activity'
        );

      const savedTokens =
        localStorage.getItem(
          'moonpad_created_tokens'
        );

      const savedTrades =
        localStorage.getItem(
          'moonpad_trades'
        );

      if (savedActivity) {
        setActivity(
          JSON.parse(savedActivity)
        );
      } else {
        setActivity([
          {
            time: '12:42',
            actor: 'Agent #001',
            action: 'market data updated',
          },
          {
            time: '12:39',
            actor: 'Wallet',
            action:
              'connected successfully',
          },
          {
            time: '12:34',
            actor: 'Agent #002',
            action:
              'started community monitoring',
          },
          {
            time: '12:28',
            actor: '$MOON',
            action:
              'holder count crossed 2,400',
          },
        ]);
      }

      if (savedTokens) {
        setCreatedTokens(
          JSON.parse(savedTokens)
        );
      }

      if (savedTrades) {
        setTrades(
          JSON.parse(savedTrades)
        );
      }
    } catch {
      setActivity([]);
      setCreatedTokens([]);
      setTrades([]);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem(
        'moonpad_activity',
        JSON.stringify(activity)
      );
    } catch {}
  }, [activity, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem(
        'moonpad_created_tokens',
        JSON.stringify(createdTokens)
      );
    } catch {}
  }, [createdTokens, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem(
        'moonpad_trades',
        JSON.stringify(trades)
      );
    } catch {}
  }, [trades, isClient]);

  const allTokens = useMemo(
    () => [
      ...createdTokens,
      ...STATIC_TOKENS,
    ],
    [createdTokens]
  );

  const filteredTokens = useMemo(
    () =>
      allTokens.filter((t) =>
        `${t.name} ${t.ticker} ${t.mint}`
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

    const time =
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

    setActivity((previous) =>
      [
        {
          time,
          actor,
          action,
        },
        ...previous,
      ].slice(0, 20)
    );
  };

  const getProvider = () => {
    return (window as any).phantom?.solana;
  };

  const refreshBalance = async (
    address?: string
  ) => {
    try {
      const target =
        address || walletAddress;

      if (!target) return;

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
        refreshBalance(
          walletAddress
        );
      }, 15000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    connected,
    walletAddress,
  ]);

  const connectWallet = async () => {
    const provider =
      getProvider();

    if (!provider) {
      notify(
        'Phantom wallet not found'
      );
      return;
    }

    try {
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
    }
  };

  const disconnectWallet =
    async () => {
      const provider =
        getProvider();

      try {
        await provider?.disconnect();
      } catch {}

      setConnected(false);
      setWalletAddress('');
      setSolBalance(null);

      addActivity(
        'Wallet',
        'disconnected'
      );

      notify(
        'Wallet disconnected'
      );
    };

  const copyText = async (
    value: string,
    label: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopyStatus(label);

      window.setTimeout(() => {
        setCopyStatus('');
      }, 1800);

      notify(
        `${label} copied`
      );
    } catch {
      notify(
        'Unable to copy'
      );
    }
  };

  const getPrice = async (
    mint: string
  ) => {
    const response =
      await fetch(
        `/api/price?mint=${encodeURIComponent(
          mint
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
    displayAmount,
  }: {
    inputMint: string;
    outputMint: string;
    amount: string;
    action: 'Buy' | 'Sell';
    displayAmount: string;
  }) => {
    const provider =
      getProvider();

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
      Number(amount) <= 0
    ) {
      throw new Error(
        action === 'Buy'
          ? 'Enter a SOL amount.'
          : 'Enter the token amount in base units.'
      );
    }

    setTradeLoading(action);

    setTradeStatus(
      `Preparing ${action.toLowerCase()} transaction...`
    );

    try {
      const response =
        await fetch(
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

      if (
        !data.swapTransaction
      ) {
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
        'Transaction signed — submitting to Solana...'
      );

      const signature =
        await connection.sendRawTransaction(
          signed.serialize(),
          {
            maxRetries: 2,
          }
        );

      setTradeStatus(
        'Transaction submitted — waiting for confirmation...'
      );

      await connection.confirmTransaction(
        signature,
        'confirmed'
      );

      setLastSignature(
        signature
      );

      setTradeStatus(
        `${action} confirmed: ${signature.slice(
          0,
          8
        )}...`
      );

      const tradeRecord: TradeRecord =
        {
          signature,
          action,
          mint: outputMint === SOL_MINT
            ? inputMint
            : outputMint,
          amount: displayAmount,
          time:
            new Date().toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            ),
        };

      setTrades(
        (previous) =>
          [
            tradeRecord,
            ...previous,
          ].slice(0, 20)
      );

      addActivity(
        'Trade',
        `${action.toLowerCase()} confirmed`
      );

      notify(
        `${action} confirmed`
      );

      await refreshBalance();

      return signature;
    } finally {
      setTradeLoading(null);
    }
  };

  const handleBuy =
    async () => {
      try {
        if (
          !tradeMint.trim()
        ) {
          throw new Error(
            'Enter a token mint address.'
          );
        }

        if (
          !tradeAmount ||
          Number(tradeAmount) <= 0
        ) {
          throw new Error(
            'Enter a valid SOL amount.'
          );
        }

        if (
          solBalance !== null &&
          Number(tradeAmount) >
            solBalance
        ) {
          throw new Error(
            'Buy amount is greater than your current SOL balance.'
          );
        }

        const lamports =
          Math.floor(
            Number(tradeAmount) *
              1_000_000_000
          );

        await sendSwap({
          inputMint: SOL_MINT,
          outputMint:
            tradeMint.trim(),
          amount:
            lamports.toString(),
          action: 'Buy',
          displayAmount:
            `${tradeAmount} SOL`,
        });
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

        setTradeLoading(null);
      }
    };

  const handleSell =
    async () => {
      try {
        if (
          !tradeMint.trim()
        ) {
          throw new Error(
            'Enter a token mint address.'
          );
        }

        if (
          !sellAmount ||
          Number(sellAmount) <= 0
        ) {
          throw new Error(
            'Enter the token amount in base units.'
          );
        }

        await sendSwap({
          inputMint:
            tradeMint.trim(),
          outputMint: SOL_MINT,
          amount:
            sellAmount.trim(),
          action: 'Sell',
          displayAmount:
            `${sellAmount} token base units`,
        });
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

        setTradeLoading(null);
      }
    };

  const startBot =
    async () => {
      if (!connected) {
        notify(
          'Connect Phantom first.'
        );
        return;
      }

      if (!tradeMint.trim()) {
        notify(
          'Enter a token mint.'
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
          await getPrice(
            tradeMint.trim()
          );

        setEntryPrice(price);
        setCurrentPrice(price);
        setChangePercent(0);
        setTriggered(null);
        setBotEnabled(true);

        addActivity(
          'Trading Assistant',
          `started monitoring ${tradeMint
            .trim()
            .slice(
              0,
              8
            )}...`
        );

        setTradeStatus(
          `Assistant active — entry price: $${formatPrice(
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
            `Assistant active: ${
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
      if (!tradeMint.trim()) {
        notify(
          'Enter a token mint first.'
        );
        return;
      }

      try {
        const mint =
          tradeMint.trim();

        const price =
          await getPrice(mint);

        setWatchMint(mint);
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
      }
    };

  const watchCurrentToken =
    () => {
      if (!tradeMint.trim()) {
        notify(
          'Enter a token mint first.'
        );
        return;
      }

      const mint =
        tradeMint.trim();

      setCreatedTokens(
        (previous) =>
          previous.map((token) =>
            token.mint === mint
              ? {
                  ...token,
                  watched:
                    true,
                }
              : token
          )
      );

      addActivity(
        'Watchlist',
        `watching ${mint.slice(
          0,
          8
        )}...`
      );

      notify(
        'Token added to watchlist'
      );
    };

  const triggerPrice =
    entryPrice !== null
      ? {
          stop:
            Number(stopLoss) > 0
              ? entryPrice *
                (1 -
                  Number(
                    stopLoss
                  ) /
                    100)
              : null,
          target:
            Number(takeProfit) >
            0
              ? entryPrice *
                (1 +
                  Number(
                    takeProfit
                  ) /
                    100)
              : null,
        }
      : {
          stop: null,
          target: null,
        };

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

          <b>
            MoonPad AI
          </b>

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
            >
              <Wallet size={17} />

              {connected
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
                  Network
                </small>

                <b>
                  Solana Mainnet
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
                    Tokens launched or
                    tracked in MoonPad
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
                  .map((token) => (
                    <TokenCard
                      key={
                        token.mint ||
                        token.ticker
                      }
                      t={token}
                      onCopy={
                        token.mint
                          ? () =>
                              copyText(
                                token.mint,
                                'Mint address'
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
                    Check any Solana
                    token using Jupiter
                    pricing
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
                    its current price.
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
                  >
                    Check Price
                  </button>

                  <button
                    className="secondary"
                    onClick={
                      watchCurrentToken
                    }
                  >
                    Watch Token
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

                  {watchMint && (
                    <small>
                      {watchMint}
                    </small>
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
            subtitle="Everything launched or watched from your MoonPad workspace."
          >
            <div className="toolbar">
              <div className="stat">
                <small>
                  Created
                </small>

                <b>
                  {createdTokens.length}
                </b>
              </div>

              <div className="stat">
                <small>
                  Tracked
                </small>

                <b>
                  {allTokens.length}
                </b>
              </div>

              <div className="stat">
                <small>
                  Transactions
                </small>

                <b>
                  {trades.length}
                </b>
              </div>
            </div>

            {createdTokens.length >
            0 ? (
              <div className="token-list">
                {createdTokens.map(
                  (token) => (
                    <TokenCard
                      key={
                        token.mint
                      }
                      t={token}
                      large
                      onCopy={() =>
                        copyText(
                          token.mint,
                          'Mint address'
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="bot-panel">
                <div>
                  <span className="eyebrow">
                    NO LAUNCHES YET
                  </span>

                  <h3>
                    Launch your first
                    token
                  </h3>

                  <p>
                    Your successfully
                    launched tokens will
                    appear here
                    automatically.
                  </p>
                </div>

                <button
                  className="primary"
                  onClick={() =>
                    setShowLaunch(
                      true
                    )
                  }
                >
                  <Rocket
                    size={16}
                  />
                  Launch Token
                </button>
              </div>
            )}

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

                  <small>
                    {lastSignature}
                  </small>
                </div>

                <div className="hero-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      copyText(
                        lastSignature,
                        'Transaction signature'
                      )
                    }
                  >
                    <Copy
                      size={14}
                    />
                    Copy
                  </button>

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
                    tradeLoading !==
                    null
                  }
                >
                  {tradeLoading ===
                  'Buy'
                    ? 'Buying...'
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
                  placeholder="Sell token amount in base units"
                  type="number"
                  min="0"
                  step="1"
                />

                <button
                  onClick={
                    handleSell
                  }
                  disabled={
                    tradeLoading !==
                    null
                  }
                >
                  {tradeLoading ===
                  'Sell'
                    ? 'Selling...'
                    : 'Sell'}
                </button>

                {tradeStatus && (
                  <span>
                    {tradeStatus}
                  </span>
                )}

                {lastSignature && (
                  <div className="hero-actions">
                    <button
                      className="secondary"
                      onClick={() =>
                        copyText(
                          lastSignature,
                          'Transaction signature'
                        )
                      }
                    >
                      <Copy
                        size={14}
                      />
                      Copy signature
                    </button>

                    <a
                      href={`https://solscan.io/tx/${lastSignature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary"
                    >
                      Solscan
                      <ExternalLink
                        size={14}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bot-panel">
              <div>
                <span className="eyebrow">
                  AUTOMATED MONITORING
                </span>

                <h3>
                  Trading assistant
                </h3>

                <p>
                  MoonPad watches the
                  token price every five
                  seconds and detects
                  your configured
                  thresholds. It does
                  not sign transactions
                  without Phantom.
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

                {triggerPrice.stop !==
                    null &&
                  entryPrice !==
                    null && (
                    <span>
                      Stop trigger:
                      $
                      {formatPrice(
                        triggerPrice.stop
                      )}
                    </span>
                  )}

                {triggerPrice.target !==
                    null &&
                  entryPrice !==
                    null && (
                    <span>
                      Take-profit
                      trigger: $
                      {formatPrice(
                        triggerPrice.target
                      )}
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
                      your condition.
                      Phantom approval
                      is still required
                      to execute the
                      actual sell.
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
                    monitoring from
                    wallet authorization.
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

            {trades.length >
              0 && (
              <div className="section">
                <div className="section-head">
                  <div>
                    <h3>
                      Recent trades
                    </h3>

                    <p>
                      Confirmed on-chain
                      MoonPad trades
                    </p>
                  </div>
                </div>

                <div className="activity">
                  {trades.map(
                    (
                      trade
                    ) => (
                      <div
                        className="event"
                        key={
                          trade.signature
                        }
                      >
                        <span className="event-dot" />

                        <time>
                          {
                            trade.time
                          }
                        </time>

                        <b>
                          {
                            trade.action
                          }
                        </b>

                        <span>
                          {trade.amount}
                        </span>

                        <a
                          href={`https://solscan.io/tx/${trade.signature}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                          <ExternalLink
                            size={
                              13
                            }
                          />
                        </a>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
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

                  <button
                    className="secondary"
                    onClick={() =>
                      copyText(
                        walletAddress,
                        'Wallet address'
                      )
                    }
                  >
                    <Copy
                      size={14}
                    />
                    Copy wallet
                  </button>
                </div>

                <button
                  className="secondary"
                  onClick={
                    disconnectWallet
                  }
                >
                  Disconnect
                </button>
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
          onLaunched={(
            result
          ) => {
            setLaunchResult(
              result
            );

            setCreatedTokens(
              (previous) => [
                {
                  name:
                    result.name,
                  ticker:
                    result.ticker,
                  mc: '—',
                  change: '—',
                  holders: '—',
                  status: 'LIVE',
                  mint:
                    result.mint,
                  signature:
                    result.signature,
                  createdAt:
                    new Date().toISOString(),
                },
                ...previous,
              ]
            );

            setLastSignature(
              result.signature
            );

            addActivity(
              'Launch',
              `${result.ticker} launched successfully`
            );

            setActive(
              'My Tokens'
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

      {copyStatus && (
        <div className="toast">
          <Copy size={15} />
          {copyStatus}
        </div>
      )}
    </main>
  );
}

function formatPrice(
  value: number
) {
  if (
    value >= 1
  ) {
    return value.toFixed(4);
  }

  if (
    value >= 0.01
  ) {
    return value.toFixed(6);
  }

  if (
    value >= 0.000001
  ) {
    return value.toFixed(9);
  }

  return value.toExponential(4);
}

function TokenCard({
  t,
  large = false,
  onCopy,
}: {
  t: TokenRecord;
  large?: boolean;
  onCopy?: () => void;
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

      {t.mint && (
        <div className="modal-preview">
          <span>
            MINT ADDRESS
          </span>

          <small>
            {t.mint}
          </small>

          <div className="hero-actions">
            {onCopy && (
              <button
                className="secondary"
                onClick={onCopy}
              >
                <Copy
                  size={13}
                />
                Copy Mint
              </button>
            )}

            <a
              href={`https://solscan.io/token/${t.mint}`}
              target="_blank"
              rel="noreferrer"
              className="secondary"
            >
              Solscan
              <ExternalLink
                size={13}
              />
            </a>
          </div>
        </div>
      )}

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
        {events.length ===
        0 ? (
          <div className="event">
            <span className="event-dot" />

            <span>
              No activity yet.
            </span>
          </div>
        ) : (
          events.map(
            (
              event,
              index
            ) => (
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
                  {
                    event.time
                  }
                </time>

                <b>
                  {
                    event.actor
                  }
                </b>

                <span>
                  {
                    event.action
                  }
                </span>

                <Copy
                  size={14}
                  className="copy"
                />
              </div>
            )
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
  onLaunched,
}: {
  onClose: () => void;
  onNotify: (
    message: string
  ) => void;
  walletAddress: string;
  connection: Connection;
  onLaunched: (result: {
    mint: string;
    signature: string;
    name: string;
    ticker: string;
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
                LAUNCH CONFIRMED
              </span>

              <h3>
                {name ||
                  'Moon Token'}
              </h3>
            </div>

            <button
              className="close"
              onClick={
                onClose
              }
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-preview">
            <span>
              TOKEN MINT
            </span>

            <b>
              {success.mint.slice(
                0,
                8
              )}
              ...
              {success.mint.slice(
                -8
              )}
            </b>

            <small>
              {success.mint}
            </small>
          </div>

          <div className="modal-preview">
            <span>
              TRANSACTION
            </span>

            <b>
              Confirmed on Solana
            </b>

            <small>
              {success.signature}
            </small>
          </div>

          <div className="modal-row">
            <button
              className="secondary"
              onClick={() =>
                navigator.clipboard
                  .writeText(
                    success.mint
                  )
                  .then(() =>
                    onNotify(
                      'Mint address copied'
                    )
                  )
              }
            >
              <Copy
                size={15}
              />
              Copy Mint
            </button>

            <a
              href={`https://solscan.io/token/${success.mint}`}
              target="_blank"
              rel="noreferrer"
              className="secondary"
            >
              Token
              <ExternalLink
                size={14}
              />
            </a>

            <a
              href={`https://solscan.io/tx/${success.signature}`}
              target="_blank"
              rel="noreferrer"
              className="primary"
            >
              Transaction
              <ExternalLink
                size={14}
              />
            </a>
          </div>

          <button
            className="primary"
            onClick={() => {
              onLaunched({
                mint:
                  success.mint,
                signature:
                  success.signature,
                name:
                  name.trim(),
                ticker:
                  `$${ticker
                    .replace(
                      '$',
                      ''
                    )
                    .trim()}`,
              });

              onClose();
            }}
          >
            Continue to My Tokens
          </button>

          <p className="note">
            Your token was submitted
            and confirmed on Solana
            Mainnet.
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
              TOKEN DETAILS
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
              TOTAL SUPPLY
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
              IMAGE
            </span>

            <small>
              {image}
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

                  onNotify(
                    'Uploading token metadata...'
                  );

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
                              name.trim(),
                            symbol:
                              ticker
                                .replace(
                                  '$',
                                  ''
                                )
                                .trim(),
                            description:
                              description.trim(),
                            image:
                              image.trim(),
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

                  onNotify(
                    'Preparing Solana launch transaction...'
                  );

                  const mintKeypair =
                    Keypair.generate();

                  const mintAddress =
                    mintKeypair.publicKey.toString();

                  const createInstruction =
                    await PUMP_SDK.createV2Instruction(
                      {
                        mint:
                          mintKeypair.publicKey,
                        name:
                          name.trim(),
                        symbol:
                          ticker
                            .replace(
                              '$',
                              ''
                            )
                            .trim(),
                        uri:
                          metadataUri,
                        creator:
                          new PublicKey(
                            provider.publicKey.toString()
                          ),
                        user:
                          new PublicKey(
                            provider.publicKey.toString()
                          ),
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
                    new PublicKey(
                      provider.publicKey.toString()
                    );

                  transaction.partialSign(
                    mintKeypair
                  );

                  onNotify(
                    'Transaction ready — approve the launch in Phantom.'
                  );

                  const signed =
                    await provider.signTransaction(
                      transaction
                    );

                  onNotify(
                    'Launch approved — submitting to Solana...'
                  );

                  const signature =
                    await connection.sendRawTransaction(
                      signed.serialize(),
                      {
                        maxRetries: 2,
                      }
                    );

                  await connection.confirmTransaction(
                    {
                      signature,
                      blockhash,
                      lastValidBlockHeight,
                    },
                    'confirmed'
                  );

                  setSuccess({
                    mint:
                      mintAddress,
                    signature,
                  });

                  onNotify(
                    'Launch confirmed on Solana'
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
          />
        </label>

        <label>
          Ticker

          <input
            value={ticker}
            onChange={(e) =>
              setTicker(
                e.target.value.toUpperCase()
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

        <div className="modal-preview">
          <span>
            PREVIEW
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
                cleanTicker.length >
                10
              ) {
                onNotify(
                  'Ticker must be 10 characters or less.'
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
