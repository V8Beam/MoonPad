'use client';

import { useEffect, useMemo, useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { PUMP_SDK } from '@pump-fun/pump-sdk';
import {
  Activity, Bot, ChevronRight, CircleDollarSign, Copy, Gauge, LayoutDashboard,
  Pause, Play, Rocket, Search, Settings, Sparkles, TrendingUp, Wallet, Zap, X
} from 'lucide-react';

const tokens = [
  { name: 'Moon', ticker: '$MOON', mc: '$12.4K', change: '+18.4%', holders: '2,481', status: 'LIVE' },
  { name: 'Lunar Doge', ticker: '$LDOGE', mc: '$4.8K', change: '+7.2%', holders: '812', status: 'LIVE' },
  { name: 'MoonCat', ticker: '$MCAT', mc: '$2.1K', change: '+3.9%', holders: '391', status: 'WATCH' },
];

const events = [
  ['12:42', 'Agent #001', 'market data updated'],
  ['12:39', 'Wallet', 'connected successfully'],
  ['12:34', 'Agent #002', 'started community monitoring'],
  ['12:28', '$MOON', 'holder count crossed 2,400'],
];

export default function Home() {
  const [active, setActive] = useState('Dashboard');
  const [connected, setConnected] = useState(false);
const [walletAddress, setWalletAddress] = useState('');
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  useEffect(() => {
  const provider = (window as any).phantom?.solana;

  if (provider?.isConnected && provider.publicKey) {
    setConnected(true);
    setWalletAddress(provider.publicKey.toString());
  }
}, []);
  const [running, setRunning] = useState(true);
  const [showLaunch, setShowLaunch] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [botEnabled, setBotEnabled] = useState(false);

  const filteredTokens = useMemo(() => tokens.filter(t => `${t.name} ${t.ticker}`.toLowerCase().includes(search.toLowerCase())), [search]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const nav = [
    ['Dashboard', LayoutDashboard], ['Launch Token', Rocket], ['AI Agents', Bot], ['My Tokens', CircleDollarSign], ['Activity', Activity], ['Settings', Settings]
  ] as const;

  const pageTitle = active === 'Dashboard' ? 'Good morning, MoonBuilder.' : active;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="moon">☾</div><div><b>MoonPad</b><span>AI token platform</span></div></div>
        <nav>{nav.map(([label, Icon]) => <button key={label} className={active === label ? 'nav active' : 'nav'} onClick={() => label === 'Launch Token' ? setShowLaunch(true) : setActive(label)}><Icon size={18}/><span>{label}</span>{label === 'Dashboard' && <i>⌂</i>}</button>)}</nav>
        <div className="side-card"><Sparkles size={18}/><b>MoonPad AI</b><p>Your agent workspace is ready.</p><button onClick={() => setActive('AI Agents')}>Open agents <ChevronRight size={15}/></button></div>
        <div className="network"><span className="dot"/> Solana network <small>Demo mode</small></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><div className="eyebrow">{active.toUpperCase()}</div><h1>{pageTitle}</h1></div>
          <div className="top-actions"><div className="search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tokens..."/></div><button className={connected ? 'wallet connected' : 'wallet'} onClick={async () => {
  const provider = (window as any).phantom?.solana;

  if (!provider) {
    notify('Phantom wallet not found');
    return;
  }

  try {
    const response = await provider.connect();
    setConnected(true);
    setWalletAddress(response.publicKey.toString());
    notify(`Wallet connected: ${response.publicKey.toString().slice(0, 4)}...`);
  } catch {
    notify('Wallet connection cancelled');
  }
}}><Wallet size={17}/>{connected ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}</button></div>
        </header>

        {active === 'Dashboard' && <>
          <div className="hero"><div><span className="pill"><Zap size={13}/> AI-POWERED TOKEN PLATFORM</span><h2>Launch. Monitor.<br/><em>Build.</em></h2><p>One workspace for your tokens, agents, and on-chain activity.</p><div className="hero-actions"><button className="primary" onClick={() => setShowLaunch(true)}><Rocket size={17}/> Launch Token</button><button className="secondary" onClick={() => setActive('AI Agents')}><Bot size={17}/> Explore Agents</button></div></div><div className="orb"><div className="orb-ring"/><div className="orb-core">☾</div></div></div>

          <section className="section"><div className="section-head"><div><h3>Your Tokens</h3><p>Live portfolio activity</p></div><button className="text-btn" onClick={() => setActive('My Tokens')}>View all <ChevronRight size={15}/></button></div><div className="token-grid">{filteredTokens.slice(0,2).map(t => <TokenCard key={t.ticker} t={t}/>)}</div></section>

          <section className="section"><div className="section-head"><div><h3>AI Agents</h3><p>Automations running for your workspace</p></div><button className="text-btn" onClick={() => setActive('AI Agents')}>Manage <ChevronRight size={15}/></button></div><div className="agent-grid"><AgentCard icon={<Bot size={20}/>} name="Agent #001" type="Market Monitor" running={running} onToggle={() => setRunning(!running)} description="Watching price, volume & holders"/><AgentCard icon={<Sparkles size={20}/>} name="Agent #002" type="Community Monitor" running={true} description="Tracking community activity"/></div></section>

          <ActivityLog onOpen={() => setActive('Activity')}/>
        </>}

        {active === 'My Tokens' && <PageShell title="Token portfolio" subtitle="Everything created or watched in your MoonPad workspace."><div className="toolbar"><div className="stat"><small>Total tracked</small><b>3</b></div><div className="stat"><small>24h volume</small><b>$19.7K</b></div><div className="stat"><small>Portfolio P&amp;L</small><b className="up">+$2,184</b></div></div><div className="token-list">{filteredTokens.map(t => <TokenCard key={t.ticker} t={t} large/>)}</div></PageShell>}

        {active === 'AI Agents' && <PageShell title="AI agent workspace" subtitle="Configure monitoring automations. Trading actions remain disabled in this prototype."><div className="agent-grid"><AgentCard icon={<Bot size={20}/>} name="Agent #001" type="Market Monitor" running={running} onToggle={() => setRunning(!running)} description="Price, volume, liquidity and holder changes"/><AgentCard icon={<Sparkles size={20}/>} name="Agent #002" type="Community Monitor" running={true} description="Community activity and mention tracking"/></div><div className="bot-panel"><div><span className="eyebrow">AUTOMATION PREVIEW</span><h3>Trading assistant</h3><p>Set entry, stop-loss and take-profit rules for a future connected wallet. No orders are sent from this build.</p></div><button className={botEnabled ? 'toggle on' : 'toggle'} onClick={() => { setBotEnabled(!botEnabled); notify(botEnabled ? 'Assistant paused' : 'Assistant enabled in demo mode'); }}>{botEnabled ? <Pause size={15}/> : <Play size={15}/>} {botEnabled ? 'Enabled' : 'Enable demo'}</button></div></PageShell>}

        {active === 'Activity' && <PageShell title="Activity log" subtitle="Recent events from your MoonPad workspace."><ActivityLog/></PageShell>}

        {active === 'Settings' && <PageShell title="Settings" subtitle="Workspace preferences and connection controls."><div className="settings-grid"><div className="setting"><Gauge size={18}/><div><b>Network</b><span>Solana · Demo environment</span></div></div><div className="setting"><Wallet size={18}/><div><b>Wallet</b><span>{connected ? '7xK...9Qm connected' : 'No wallet connected'}</span></div></div><div className="setting"><Zap size={18}/><div><b>Execution</b><span>Simulation only — no real transactions</span></div></div></div></PageShell>}

        <footer>MoonPad prototype · No real transactions are executed in this build.</footer>
      </section>

      {showLaunch && <LaunchModal onClose={() => setShowLaunch(false)} onNotify={notify} walletAddress={walletAddress} connection={connection}/>} 
      {toast && <div className="toast"><Sparkles size={15}/>{toast}</div>}
    </main>
  );
}

function TokenCard({t, large=false}: {t: typeof tokens[number], large?: boolean}) {
  return <article className={large ? 'token-card large' : 'token-card'}><div className="token-top"><div className="token-icon">{t.ticker.replace('$','').slice(0,1)}</div><div><b>{t.name}</b><span>{t.ticker}</span></div><span className={t.status === 'LIVE' ? 'live' : 'watch'}>● {t.status}</span></div><div className="token-stats"><div><small>Market cap</small><strong>{t.mc}</strong></div><div><small>24h</small><strong className="up">{t.change}</strong></div><div><small>Holders</small><strong>{t.holders}</strong></div></div><div className="mini-chart">{Array.from({length:9}).map((_,i)=><span key={i} style={{height:`${30+i*8}%`}}/>)}</div></article>
}

function AgentCard({icon,name,type,running,description,onToggle}:{icon:React.ReactNode,name:string,type:string,running:boolean,description:string,onToggle?:()=>void}) {
  return <article className="agent-card"><div className="agent-icon">{icon}</div><div className="agent-main"><div className="agent-title"><b>{name}</b><span className="status">● {running ? 'ACTIVE' : 'PAUSED'}</span></div><p>{type}</p><div className="progress"><span style={{width: running ? '78%' : '24%'}}/></div><small>{description}</small></div>{onToggle ? <button className="toggle" onClick={onToggle}>{running ? 'Stop' : 'Start'}</button> : <button className="ghost">Open</button>}</article>
}

function ActivityLog({onOpen}:{onOpen?:()=>void}) {
 return <section className="section"><div className="section-head"><div><h3>Live Activity</h3><p>Recent MoonPad events</p></div>{onOpen && <button className="text-btn" onClick={onOpen}>Full log <ChevronRight size={15}/></button>}</div><div className="activity">{events.map(([time, actor, action]) => <div className="event" key={time+actor}><span className="event-dot"/><time>{time}</time><b>{actor}</b><span>{action}</span><Copy size={14} className="copy"/></div>)}</div></section>
}

function PageShell({title,subtitle,children}:{title:string,subtitle:string,children:React.ReactNode}) { return <div className="page-shell"><div className="page-intro"><span className="pill"><TrendingUp size={13}/> MOONPAD WORKSPACE</span><h2>{title}</h2><p>{subtitle}</p></div>{children}</div> }

function LaunchModal({onClose,onNotify,walletAddress,connection}:{onClose:()=>void,onNotify:(s:string)=>void,walletAddress:string,connection:Connection}) {
 const [name,setName]=useState('');
const [ticker,setTicker]=useState('');
const [description,setDescription]=useState('');
const [image,setImage]=useState('');
const [supply,setSupply]=useState('1000000000');
  const [review,setReview]=useState(false);
 if (review) {
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">REVIEW LAUNCH</span>
          <h3>{name || 'Moon Token'}</h3>
        </div>
        <button className="close" onClick={onClose}><X size={20}/></button>
      </div>

      <div className="modal-preview">
        <span>Token details</span>
        <b>{ticker || '$MOON'}</b>
        <small>{description}</small>
      </div>

      <div className="modal-preview">
        <span>Total supply</span>
        <b>{supply}</b>
        <small>Creator wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</small>
      </div>

      <div className="modal-row">
        <button className="secondary" onClick={() => setReview(false)}>Back</button>
        <button className="primary" onClick={async () => {
  try {
    const provider = (window as any).phantom?.solana;

    if (!provider || !provider.publicKey) {
      onNotify('Connect Phantom first');
      return;
    }

const metadataResponse = await fetch('/api/metadata', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: name.trim(),
    symbol: ticker.replace('$', '').trim(),
    description: description.trim(),
    image: image.trim(),
  }),
});

if (!metadataResponse.ok) {
  throw new Error('Metadata upload failed');
}

const metadata = await metadataResponse.json();
const metadataUri = metadata.metadataUri;

const mintKeypair = Keypair.generate();

const createInstruction = await PUMP_SDK.createV2Instruction({
  mint: mintKeypair.publicKey,
  name: name.trim(),
  symbol: ticker.replace('$', '').trim(),
  uri: metadataUri,
  creator: new PublicKey(provider.publicKey.toString()),
  user: new PublicKey(provider.publicKey.toString()),
  mayhemMode: false,
  holderReward: false,
});

const transaction = new Transaction().add(createInstruction);

const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = new PublicKey(provider.publicKey.toString());

transaction.partialSign(mintKeypair);

const signed = await provider.signTransaction(transaction);
const signature = await connection.sendRawTransaction(signed.serialize());

onNotify(`Launch submitted: ${signature.slice(0, 8)}...`);
  
    } catch (error) {
  console.error('MoonPad launch error:', error);

  if (error instanceof Error) {
    onNotify(error.message);
  } else {
    onNotify('Transaction failed. Check the browser console.');
  }
}
}}>
          <Rocket size={16}/> Approve & Launch
        </button>
      </div>

      <p className="note">Review everything before approving the launch.</p>
    </div>
  </div>;
}
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">TOKEN LAUNCHER</span><h3>Create a token</h3></div><button className="close" onClick={onClose}><X size={20}/></button></div><label>Token name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Moon Token"/></label><label>Ticker<input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="$MOON" maxLength={10}/></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell people what your token is about..."/></label>
   <label>Token image URL<input value={image} onChange={e=>setImage(e.target.value)} placeholder="https://..."/></label>
<label>Total supply<input value={supply} onChange={e=>setSupply(e.target.value)} inputMode="numeric" /></label>
   <div className="modal-preview"><span>Preview</span><b>{name || 'Moon Token'}</b><small>{ticker || '$MOON'} · {description || 'Your token description'}</small></div><div className="modal-row"><button className="secondary" onClick={onClose}>Cancel</button><button
  className="primary"
  onClick={() => {
    if (!name.trim() || !ticker.trim() || !description.trim()) {
      onNotify('Name, ticker, and description are required');
      return;
    }

    if (!walletAddress) {
      onNotify('Connect your Phantom wallet first');
      return;
    }

    setReview(true);
  }}
>
  <Rocket size={16}/> Review Launch
</button></div><p className="note">Prototype mode: this previews the launch flow only.</p></div></div>
}

