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
const VIDEO_PRICE_LAMPORTS = 0.01 * LAMPORTS_PER_SOL // $20 USDC equivalent in SOL

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const connectWallet = async () => {
    try {
      // Check if Phantom or Solflare is installed
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    setStatus('💳 Processing payment...')
    
    try {
      // Get wallet provider
      const provider = (window as any).solana || (window as any).phantom?.solana
      
      if (!provider) {
        throw new Error('Wallet not found')
      }

      // Create payment transaction
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

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      // Sign and send transaction
      setStatus('📝 Please approve transaction in your wallet...')
      const signed = await provider.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())
      
      setStatus('⏳ Confirming payment...')
      await connection.confirmTransaction(signature, 'confirmed')
      
      setStatus('✅ Payment confirmed! Generating video...')

      // Call API to generate video
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
      
      // TODO: Show job status page or email notification
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
          <div className="inline-flex items-center gap-2 mb-4">
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
          
          <div className="flex items-center justify-center gap-4 text-purple-300 mb-12">
            <span>✓ No video editing skills required</span>
            <span className="text-purple-600">•</span>
            <span>✓ Professional voiceover</span>
            <span className="text-purple-600">•</span>
            <span>✓ Pay per video</span>
          </div>
        </div>

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
                  <span className="text-2xl font-bold text-green-400">$20</span>
                </div>
                <p className="text-sm text-purple-400">Pay with SOL on Solana (0.01 SOL ≈ $20)</p>
              </div>
              
              {status && (
                <div className="bg-purple-950/50 border border-purple-500 rounded-lg p-4 text-center text-purple-200">
                  {status}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !githubUrl || !walletAddress}
                className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white font-bold py-4 rounded-lg solana-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Processing...' : '🎬 Generate Demo Video →'}
              </button>
            </form>
          </div>
        </div>

        {/* Features Grid */}
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
            <p className="text-purple-300">$20 per video. No subscriptions required.</p>
          </div>
          
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-bold mb-2">Pro Voiceover</h3>
            <p className="text-purple-300">ElevenLabs AI voice - sounds human, not robotic</p>
          </div>
          
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Hackathon Ready</h3>
            <p className="text-purple-300">Optimized for Devpost, Colosseum, and hackathon submissions</p>
          </div>
          
          <div className="bg-purple-900/40 border border-purple-600 rounded-xl p-6">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">GitHub Native</h3>
            <p className="text-purple-300">Just paste your repo URL - we handle the rest</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Single Video */}
            <div className="bg-purple-900/50 border-2 border-purple-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Single Video</h3>
              <div className="text-4xl font-bold text-green-400 mb-4">$20</div>
              <p className="text-purple-300 mb-6">Perfect for one-time hackathon submissions</p>
              <ul className="space-y-2 text-purple-200">
                <li>✓ 2-3 minute video</li>
                <li>✓ AI voiceover</li>
                <li>✓ 1080p quality</li>
                <li>✓ 5-min turnaround</li>
              </ul>
            </div>
            
            {/* 3-Pack */}
            <div className="bg-gradient-to-br from-purple-600 to-violet-700 border-2 border-green-400 rounded-2xl p-8 solana-glow-green relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-400 text-black text-sm font-bold rounded-full">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold mb-2">3-Video Pack</h3>
              <div className="text-4xl font-bold text-white mb-4">
                $50
                <span className="text-lg text-purple-200"> / $16.67 each</span>
              </div>
              <p className="text-purple-100 mb-6">For multiple projects or team submissions</p>
              <ul className="space-y-2 text-white">
                <li>✓ Everything in Single</li>
                <li>✓ Save $10 (17% off)</li>
                <li>✓ Never expires</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
            
            {/* Unlimited */}
            <div className="bg-purple-900/50 border-2 border-purple-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Unlimited</h3>
              <div className="text-4xl font-bold text-green-400 mb-4">$39<span className="text-lg text-purple-300">/mo</span></div>
              <p className="text-purple-300 mb-6">For agencies and prolific builders</p>
              <ul className="space-y-2 text-purple-200">
                <li>✓ Unlimited videos</li>
                <li>✓ Premium voices</li>
                <li>✓ Custom branding</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Paste GitHub URL</h3>
                <p className="text-purple-300">Enter your repository URL and pay $20 with SOL</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2">AI Analyzes Your Project</h3>
                <p className="text-purple-300">Our AI reads your README, code, and project structure</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Video Generation</h3>
                <p className="text-purple-300">Script writing, voiceover, screen recording, and assembly - all automated</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-xl font-bold text-black">✓</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Download & Submit</h3>
                <p className="text-purple-300">Get your video in 5-10 minutes. Ready for Devpost, YouTube, or anywhere else.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <details className="bg-purple-900/40 border border-purple-600 rounded-lg p-6">
              <summary className="font-bold cursor-pointer">What if my project isn't web-based?</summary>
              <p className="mt-4 text-purple-300">We support all types of projects! For backend services, CLI tools, or libraries, we create code walkthrough demos with slides.</p>
            </details>
            
            <details className="bg-purple-900/40 border border-purple-600 rounded-lg p-6">
              <summary className="font-bold cursor-pointer">How long does it take?</summary>
              <p className="mt-4 text-purple-300">5-15 minutes from payment to finished video. Perfect for last-minute hackathon submissions!</p>
            </details>
            
            <details className="bg-purple-900/40 border border-purple-600 rounded-lg p-6">
              <summary className="font-bold cursor-pointer">Can I customize the video?</summary>
              <p className="mt-4 text-purple-300">Currently automated for speed. Custom editing coming soon! For now, you get professional quality with zero effort.</p>
            </details>
            
            <details className="bg-purple-900/40 border border-purple-600 rounded-lg p-6">
              <summary className="font-bold cursor-pointer">What payment methods do you accept?</summary>
              <p className="mt-4 text-purple-300">SOL on Solana. Connect any Solana wallet (Phantom, Solflare, etc.).</p>
            </details>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Create Your Demo?</h2>
          <p className="text-xl text-purple-300 mb-8">Join hundreds of developers who've automated their demo videos</p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white font-bold rounded-lg solana-glow transition-all text-lg"
          >
            🎬 Generate Demo Video →
          </a>
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
