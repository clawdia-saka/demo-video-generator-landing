'use client'

import { useState } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Buffer } from 'buffer'

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'
const PAYMENT_RECIPIENT = process.env.NEXT_PUBLIC_PAYMENT_WALLET || '3q1MWFNmKp6i8hnnXEKAR21BELTk5PVxweT2Jxs98gWC'
const VIDEO_PRICE_LAMPORTS = 0.036 * LAMPORTS_PER_SOL // $3 USDC equivalent in SOL (at ~$83/SOL)

type Tab = 'humans' | 'agents'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('humans')
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const connectWallet = async () => {
    try {
      const provider = (window as any).solana || (window as any).phantom?.solana
      
      if (!provider) {
        alert('Please install Phantom or Solflare wallet!')
        window.open('https://phantom.app/', '_blank')
        return
      }

      const resp = await provider.connect()
      setWalletAddress(resp.publicKey.toString())
      setStatus('✅ Wallet connected')
    } catch (err) {
      console.error('Wallet connection failed:', err)
      setStatus('❌ Wallet connection failed')
    }
  }

  const handleFreeSample = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setStatus('🎬 Generating free 5-second sample...')
    
    try {
      const response = await fetch(`${API_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl,
          isFree: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Video generation failed')
      }

      const data = await response.json()
      setStatus(`🎉 Free sample started! Job ID: ${data.jobId}`)
      alert(`Generating 5-second preview. Check status: ${API_ENDPOINT}/status/${data.jobId}`)
      
    } catch (err) {
      console.error('Error:', err)
      setStatus(`❌ Error: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    setStatus('💳 Processing payment...')
    
    try {
      const provider = (window as any).solana || (window as any).phantom?.solana
      
      if (!provider) {
        throw new Error('Wallet not found')
      }

      const connection = new Connection(SOLANA_RPC, 'confirmed')
      const fromPubkey = new PublicKey(walletAddress)
      const toPubkey = new PublicKey(PAYMENT_RECIPIENT)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: VIDEO_PRICE_LAMPORTS,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      setStatus('📝 Please approve transaction in your wallet...')
      const signed = await provider.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())
      
      setStatus('⏳ Confirming payment...')
      await connection.confirmTransaction(signature, 'confirmed')
      
      setStatus('✅ Payment confirmed! Generating video...')

      const response = await fetch(`${API_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl,
          paymentSignature: signature,
          walletAddress,
        }),
      })

      if (!response.ok) {
        throw new Error('Video generation failed')
      }

      const data = await response.json()
      setStatus(`🎉 Video generation started! Job ID: ${data.jobId}`)
      
      alert(`Video generation started! We'll email you when it's ready. Job ID: ${data.jobId}`)
      
    } catch (err) {
      console.error('Error:', err)
      setStatus(`❌ Error: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 flex-wrap justify-center">
            <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-bold rounded-full solana-glow">
              ⚡ 5-Minute Turnaround
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-full solana-glow-green">
              🤖 Fully Automated
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
            Demo Videos<br />in Minutes, Not Days
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-200 max-w-3xl mx-auto mb-8">
            AI-powered demo video creation for GitHub projects. Perfect for hackathons, startups, and open source.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-purple-950/50 border-2 border-purple-600 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('humans')}
              className={`px-6 py-3 rounded-md font-bold transition-all ${
                activeTab === 'humans'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white solana-glow'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              👤 For Humans
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-6 py-3 rounded-md font-bold transition-all ${
                activeTab === 'agents'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white solana-glow-green'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              🤖 For Agents
            </button>
          </div>
        </div>

        {/* For Humans Tab */}
        {activeTab === 'humans' && (
          <div>
            {/* Wallet Connection */}
            {!walletAddress && (
              <div className="max-w-2xl mx-auto mb-8">
                <button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-lg solana-glow-green transition-all"
                >
                  🔌 Connect Solana Wallet
                </button>
              </div>
            )}

            {walletAddress && (
              <div className="max-w-2xl mx-auto mb-4 text-center text-sm text-green-400">
                Connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </div>
            )}

            {/* Input Form */}
            <div className="max-w-2xl mx-auto mb-16">
              <div className="bg-purple-900/50 border-2 border-purple-600 rounded-2xl p-8 solana-glow">
                <h2 className="text-2xl font-bold mb-4 text-center">Create Your Demo Video</h2>
                <p className="text-purple-300 text-center mb-6">Enter your GitHub repository URL to get started</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500 rounded-lg text-white placeholder:text-purple-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                      required
                    />
                  </div>
                  
                  <div className="bg-purple-950/30 border border-purple-600/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-200">Single Video</span>
                      <span className="text-2xl font-bold text-green-400">$3</span>
                    </div>
                    <p className="text-sm text-purple-400">Pay with SOL on Solana (0.036 SOL ≈ $3)</p>
                  </div>
                  
                  {status && (
                    <div className="bg-purple-950/50 border border-purple-500 rounded-lg p-4 text-center text-purple-200">
                      {status}
                    </div>
                  )}
                  
                  {/* Free Sample Button */}
                  <button
                    onClick={handleFreeSample}
                    disabled={loading || !githubUrl}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Processing...' : '🎬 Try Free Sample (5 sec) →'}
                  </button>
                  
                  <div className="text-center text-sm text-purple-400">or</div>
                  
                  {/* Paid Full Version Button */}
                  <button
                    type="submit"
                    disabled={loading || !githubUrl || !walletAddress}
                    className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white font-bold py-4 rounded-lg solana-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Processing...' : '💰 Generate Full Video ($3) →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* For Agents Tab */}
        {activeTab === 'agents' && (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-purple-900/50 border-2 border-green-500 rounded-2xl p-8 solana-glow-green">
              <h2 className="text-3xl font-bold mb-4 text-center">🤖 Agent API Access</h2>
              <p className="text-purple-200 text-center mb-8">
                Call our API directly from your AI agent workflow
              </p>

              {/* Quick Start */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-green-400">Quick Start</h3>
                <div className="bg-black/50 border border-purple-600 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-purple-200">
{`# 1. Pay 0.036 SOL to: ${PAYMENT_RECIPIENT}
# 2. Get transaction signature
# 3. Call API with GitHub URL + signature

curl -X POST ${API_ENDPOINT}/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "githubUrl": "https://github.com/username/repo",
    "paymentSignature": "YOUR_TX_SIGNATURE",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'`}
                  </pre>
                </div>
              </div>

              {/* Response */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-green-400">Response</h3>
                <div className="bg-black/50 border border-purple-600 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-purple-200">
{`{
  "success": true,
  "jobId": "abc123",
  "status": "queued",
  "estimatedTime": "10-15 minutes",
  "statusUrl": "/status/abc123"
}`}
                  </pre>
                </div>
              </div>

              {/* Check Status */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-green-400">Check Status</h3>
                <div className="bg-black/50 border border-purple-600 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-purple-200">
{`curl ${API_ENDPOINT}/status/abc123

# Response:
{
  "jobId": "abc123",
  "status": "completed",  # queued | active | completed | failed
  "progress": 100,
  "data": {
    "downloadUrl": "https://demo-videos.clawdia.ai/abc123.mp4",
    "duration": "3:15",
    "size": "11.2 MB"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Node.js Example */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-green-400">Node.js Example (Bankr SDK)</h3>
                <div className="bg-black/50 border border-purple-600 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-purple-200">
{`const Bankr = require('bankr');

// 1. Send payment
const tx = await Bankr.transfer({
  to: '${PAYMENT_RECIPIENT}',
  amount: '0.036 SOL'
});

// 2. Generate video
const response = await fetch('${API_ENDPOINT}/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    githubUrl: 'https://github.com/username/repo',
    paymentSignature: tx.signature,
    walletAddress: Bankr.address
  })
});

const { jobId } = await response.json();

// 3. Poll for completion
while (true) {
  const status = await fetch(\`${API_ENDPOINT}/status/\${jobId}\`);
  const data = await status.json();
  
  if (data.status === 'completed') {
    console.log('Video ready:', data.data.downloadUrl);
    break;
  }
  
  await new Promise(r => setTimeout(r, 30000)); // Wait 30s
}`}
                  </pre>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-purple-950/50 border border-purple-500 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Pricing</h3>
                <div className="space-y-2 text-purple-200">
                  <div className="flex justify-between">
                    <span>Single video</span>
                    <span className="font-bold text-green-400">0.036 SOL (~$3)</span>
                  </div>
                  <div className="flex justify-between text-sm text-purple-400">
                    <span>Payment wallet</span>
                    <code className="text-xs">{PAYMENT_RECIPIENT.slice(0, 8)}...{PAYMENT_RECIPIENT.slice(-8)}</code>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="bg-purple-950/30 border border-purple-600 rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-bold mb-1">5-10 Minute Turnaround</h4>
                  <p className="text-sm text-purple-300">Fast enough for automated workflows</p>
                </div>
                
                <div className="bg-purple-950/30 border border-purple-600 rounded-lg p-4">
                  <div className="text-2xl mb-2">🎙️</div>
                  <h4 className="font-bold mb-1">Professional Voiceover</h4>
                  <p className="text-sm text-purple-300">AI-generated voice narration</p>
                </div>
                
                <div className="bg-purple-950/30 border border-purple-600 rounded-lg p-4">
                  <div className="text-2xl mb-2">📹</div>
                  <h4 className="font-bold mb-1">1080p Quality</h4>
                  <p className="text-sm text-purple-300">Optimized for YouTube & Devpost</p>
                </div>
                
                <div className="bg-purple-950/30 border border-purple-600 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔗</div>
                  <h4 className="font-bold mb-1">Direct Download Link</h4>
                  <p className="text-sm text-purple-300">MP4 file ready to upload anywhere</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid - Show on both tabs */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-purple-300">5-minute turnaround from GitHub URL to finished video</p>
          </div>
          
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">Fully Automated</h3>
            <p className="text-purple-300">AI analyzes your repo, writes script, records demo</p>
          </div>
          
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Pay Per Video</h3>
            <p className="text-purple-300">$3 per video. No subscriptions required.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Create Your Demo?</h2>
          <p className="text-xl text-purple-300 mb-8">
            {activeTab === 'humans' 
              ? 'Join hundreds of developers who\'ve automated their demo videos'
              : 'Integrate demo video generation into your AI agent workflow'
            }
          </p>
          <button
            onClick={() => {
              if (activeTab === 'agents') setActiveTab('humans')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white font-bold rounded-lg solana-glow transition-all text-lg"
          >
            🎬 Generate Demo Video →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-700/50 bg-black/40 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-purple-300">
          <p className="mb-2">⚡ Powered by Solana • 🤖 Built by AI Agents • 💳 x402 Payments</p>
          <p className="text-xs text-purple-400">Demo Video Generator © 2026</p>
        </div>
      </footer>
    </main>
  )
}
