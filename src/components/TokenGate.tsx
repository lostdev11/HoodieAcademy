"use client"

import { useState, useEffect, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Zap, Shield, CheckCircle, AlertCircle, Home, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    solana?: any;
  }
}

interface TokenGateProps {
  children?: ReactNode;
}

export default function TokenGate({ children }: TokenGateProps) {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isHolder, setIsHolder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Clear any stale wallet data on mount
  useEffect(() => {
    if (!isClient) return

    localStorage.removeItem('walletAddress')
    setWalletAddress(null)
    setIsConnected(false)
    setIsAuthenticated(false)
    setIsHolder(false)
    setError(null)
  }, [isClient])

  // Check if Phantom is installed (only on client)
  const isPhantomInstalled = isClient && typeof window !== 'undefined' && window.solana?.isPhantom

  // Check if user is already authenticated on mount (only on client)
  useEffect(() => {
    if (!isClient) return

    const checkAuthStatus = async () => {
      try {
        const storedWallet = localStorage.getItem('walletAddress')
        console.log('🔍 TokenGate: Checking auth status for wallet:', storedWallet)
        
        // If no wallet address is stored, try to get it from other sources
        let walletAddress = storedWallet
        if (!walletAddress) {
          // Try to get wallet address from window.solana if available
          if (typeof window !== 'undefined' && window.solana && window.solana.publicKey) {
            walletAddress = window.solana.publicKey.toString()
            console.log('🔍 TokenGate: Retrieved wallet from window.solana:', walletAddress)
            localStorage.setItem('walletAddress', walletAddress)
          }
        }
        
        if (walletAddress) {
          setWalletAddress(walletAddress)
          setIsConnected(true)
          
          // Check if placement test is completed for this wallet
          const placementCompleted = localStorage.getItem(`placement_completed_${walletAddress}`)
          console.log('🔍 TokenGate: Placement completed flag:', placementCompleted)
          
          // If placement test is completed, authenticate user without re-verifying NFT
          if (placementCompleted === 'true') {
            console.log('✅ TokenGate: Placement test completed, authenticating user without NFT re-verification')
            setIsHolder(true)
            setIsAuthenticated(true)
            return
          }
          
          // Also check if user has a squad assigned (alternative completion indicator)
          const userSquad = localStorage.getItem('userSquad')
          console.log('🔍 TokenGate: User squad data:', userSquad)
          
          if (userSquad) {
            try {
              const squadData = JSON.parse(userSquad)
              if (squadData && squadData.name) {
                console.log('✅ TokenGate: User has squad assigned, authenticating user')
                setIsHolder(true)
                setIsAuthenticated(true)
                return
              }
            } catch (e) {
              console.log('❌ TokenGate: Error parsing squad data:', e)
            }
          }
          
          // Check if onboarding is completed (another indicator)
          const onboardingCompleted = localStorage.getItem('onboardingCompleted')
          console.log('🔍 TokenGate: Onboarding completed:', onboardingCompleted)
          
          if (onboardingCompleted === 'true') {
            console.log('✅ TokenGate: Onboarding completed, authenticating user')
            setIsHolder(true)
            setIsAuthenticated(true)
            return
          }
          
          console.log('🔍 TokenGate: No completion indicators found, verifying NFT ownership...')
          
          // Verify NFT ownership for stored wallet
          const response = await fetch('/api/nft-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: walletAddress }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.isHolder) {
              console.log('✅ TokenGate: NFT verification successful')
              setIsHolder(true)
              setIsAuthenticated(true)
            } else {
              console.log('❌ TokenGate: NFT verification failed - no WifHoodie NFT found')
            }
          }
        } else {
          console.log('🔍 TokenGate: No wallet address found anywhere')
          // If user has squad assigned but no wallet, still authenticate them
          const userSquad = localStorage.getItem('userSquad')
          const onboardingCompleted = localStorage.getItem('onboardingCompleted')
          const placementTestCompleted = localStorage.getItem('placementTestCompleted')
          
          console.log('🔍 TokenGate: Checking alternative auth methods:')
          console.log('  - User squad:', userSquad ? 'Yes' : 'No')
          console.log('  - Onboarding completed:', onboardingCompleted)
          console.log('  - Placement test completed:', placementTestCompleted)
          
          if (userSquad || onboardingCompleted === 'true' || placementTestCompleted === 'true') {
            console.log('✅ TokenGate: User has completion indicators but no wallet, authenticating anyway')
            setIsHolder(true)
            setIsAuthenticated(true)
            return
          }
        }
      } catch (error) {
        console.error('❌ TokenGate: Auth check failed:', error)
      }
    }

    checkAuthStatus()
  }, [isClient])

  const connectPhantom = async () => {
    if (!isPhantomInstalled) {
      setError("Phantom wallet is not installed. Please install it from https://phantom.app/")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await window.solana.connect()
      const address = response.publicKey.toString()

      console.log("✅ Connected wallet:", address)

      // Save address and update UI
      localStorage.setItem('walletAddress', address)
      setWalletAddress(address)
      setIsConnected(true)

      // Trigger NFT verification
      await verifyNFT(address)
    } catch (error: any) {
      console.error("Wallet connection failed:", error)
      setError(`Connection failed: ${error.message || 'User rejected the request.'}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const verifyNFT = async (address: string) => {
    if (!address) {
      console.warn("⚠️ No wallet address provided for verification.")
      return
    }
    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch('/api/nft-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('NFT Verification response:', data)
    
      setIsHolder(data.isHolder)
      
      if (!data.isHolder) {
        setError("No WifHoodie NFT found in your wallet. Please purchase one to access the course.")
      } else {
        setIsAuthenticated(true)
        // Auto-redirect to placement test if NFT verification succeeds
        await handleAutoRedirect(address)
      }
    } catch (error: any) {
      console.error("NFT verification failed:", error)
      setError(`Verification failed: ${error.message}`)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAutoRedirect = async (address: string) => {
    setIsRedirecting(true)
    
    try {
      // Check if user has completed placement test
      const hasCompletedPlacement = localStorage.getItem(`placement_completed_${address}`)
      
      if (!hasCompletedPlacement) {
        // Redirect to placement test
        console.log('Redirecting to placement test...')
        router.push('/placement/squad-test')
      } else {
        // Redirect to main home page if placement test already completed
        console.log('Placement test already completed, redirecting to home...')
        router.push('/')
      }
    } catch (error) {
      console.error('Auto-redirect failed:', error)
      // Fallback to home page
      router.push('/')
    } finally {
      setIsRedirecting(false)
    }
  }

  const disconnectWallet = () => {
    if (isClient && window.solana?.disconnect) {
      window.solana.disconnect()
    }
    if (isClient) {
      localStorage.removeItem('walletAddress')
    }
    setWalletAddress(null)
    setIsConnected(false)
    setIsHolder(false)
    setError(null)
    setIsRedirecting(false)
    setIsAuthenticated(false)
  }

  const handleConnect = async () => {
    await connectPhantom()
  }

  const handleEnterCourse = async () => {
    if (walletAddress) {
      await handleAutoRedirect(walletAddress)
    } else {
      router.push('/courses')
    }
  }

  // Function to manually authenticate user (for debugging and manual fixes)
  const manuallyAuthenticate = () => {
    console.log('🔧 TokenGate: Manually authenticating user')
    setIsHolder(true)
    setIsAuthenticated(true)
    setError(null)
  }

  // Function to manually set wallet address
  const manuallySetWallet = () => {
    if (typeof window !== 'undefined' && window.solana && window.solana.publicKey) {
      const address = window.solana.publicKey.toString()
      console.log('🔧 TokenGate: Manually setting wallet address:', address)
      localStorage.setItem('walletAddress', address)
      setWalletAddress(address)
      setIsConnected(true)
      // Try to authenticate after setting wallet
      setTimeout(() => {
        setIsHolder(true)
        setIsAuthenticated(true)
      }, 100)
    } else {
      console.log('❌ TokenGate: No wallet available to set')
      alert('No Phantom wallet detected. Please connect your wallet first.')
    }
  }

  // If user is authenticated, render children
  if (isAuthenticated && children) {
    return <>{children}</>
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Otherwise, show the gate UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Card className="w-full max-w-md bg-slate-800/90 border-slate-700/50 backdrop-blur-xl shadow-2xl relative">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-purple-500/20 to-emerald-500/20 rounded-lg blur-sm" />

        <CardContent className="p-8 relative z-10">
          <div className="text-center space-y-6">
            {/* Icon with glow effect */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full blur-lg opacity-50" />
                <div className="relative bg-slate-800 p-4 rounded-full border border-slate-600">
                  {isConnected && isHolder ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : isConnected && !isHolder ? (
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  ) : (
                    <Shield className="w-8 h-8 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Main heading */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {isConnected && isHolder ? "Access Granted" : 
                 isConnected && !isHolder ? "NFT Required" :
                 "Course Access Required"}
              </h1>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-purple-500 mx-auto rounded-full" />
            </div>

            {/* Description */}
            <p className="text-slate-300 text-lg leading-relaxed">
              {isConnected && isHolder
                ? isRedirecting 
                  ? "Redirecting to your personalized learning path..."
                  : "Your WifHoodie NFT has been verified. Welcome to the course!"
                : isConnected && !isHolder
                ? "No WifHoodie NFT found in your wallet. Please purchase one to continue."
                : "Connect your Phantom wallet to verify your WifHoodie NFT and access this course."}
            </p>

            {/* Wallet Address Display */}
            {walletAddress && (
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Connected Wallet:</p>
                <p className="text-sm text-emerald-400 font-mono break-all">{walletAddress}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Connect button */}
            <div className="pt-4">
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !isPhantomInstalled}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center gap-3">
                    {isConnecting ? (
                      <>
                        <Zap className="w-5 h-5 animate-pulse" />
                        Connecting...
                      </>
                    ) : !isPhantomInstalled ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Install Phantom
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Connect Phantom
                      </>
                    )}
                  </div>
                </Button>
              ) : (
                <div className="space-y-3">
                  {isVerifying || isRedirecting ? (
                    <Button disabled className="w-full h-14 text-lg font-semibold bg-slate-600 border-0">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 animate-pulse" />
                        {isVerifying ? "Verifying NFT..." : "Redirecting..."}
                      </div>
                    </Button>
                  ) : isHolder ? (
                    <Button
                      onClick={handleEnterCourse}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        Enter Course
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 bg-transparent"
                      onClick={() => window.open('https://magiceden.us/marketplace/wifhoodies', '_blank')}
                    >
                      Get WifHoodie NFT
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={disconnectWallet}
                    className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                  >
                    Disconnect Wallet
                  </Button>
                  
                  {/* Debug button for manual authentication */}
                  <Button
                    variant="outline"
                    onClick={manuallyAuthenticate}
                    className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 bg-transparent text-xs"
                  >
                    🔧 Manual Auth (Debug)
                  </Button>
                  
                  {/* Debug button for manual wallet setting */}
                  <Button
                    variant="outline"
                    onClick={manuallySetWallet}
                    className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 bg-transparent text-xs"
                  >
                    🔧 Set Wallet (Debug)
                  </Button>
                </div>
              )}
            </div>

            {/* Additional info */}
            {!isConnected && (
              <div className="pt-4 space-y-2">
                <p className="text-xs text-slate-400">Only Phantom wallet is supported</p>
                {!isPhantomInstalled && (
                  <p className="text-xs text-amber-400">
                    <a 
                      href="https://phantom.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-300"
                    >
                      Download Phantom Wallet
                    </a>
                  </p>
                )}
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-200" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}