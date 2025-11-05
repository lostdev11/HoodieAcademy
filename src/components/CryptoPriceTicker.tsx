'use client';

import { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
}

interface CryptoPrices {
  sol: CryptoPrice;
  btc: CryptoPrice;
  eth: CryptoPrice;
  bnb: CryptoPrice;
}

const ORDER: (keyof CryptoPrices)[] = ['sol', 'btc', 'eth', 'bnb'];

export default function CryptoPriceTicker() {
  const [prices, setPrices] = useState<CryptoPrices>({
    sol: { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, color: 'text-purple-400' },
    btc: { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, color: 'text-orange-400' },
    eth: { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, color: 'text-blue-400' },
    bnb: { symbol: 'BNB', name: 'BNB', price: 0, change24h: 0, color: 'text-yellow-400' },
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // for speed that feels consistent regardless of content width
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(20); // seconds
  const pixelsPerSecond = 90; // adjust to taste

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true'
      );
      if (!response.ok) throw new Error('Failed to fetch prices');

      const data = await response.json();

      setPrices({
        sol: { symbol: 'SOL', name: 'Solana', price: data.solana?.usd || 0, change24h: data.solana?.usd_24h_change || 0, color: 'text-purple-400' },
        btc: { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin?.usd || 0, change24h: data.bitcoin?.usd_24h_change || 0, color: 'text-orange-400' },
        eth: { symbol: 'ETH', name: 'Ethereum', price: data.ethereum?.usd || 0, change24h: data.ethereum?.usd_24h_change || 0, color: 'text-blue-400' },
        bnb: { symbol: 'BNB', name: 'BNB', price: data.binancecoin?.usd || 0, change24h: data.binancecoin?.usd_24h_change || 0, color: 'text-yellow-400' },
      });

      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  // measure one copy's width to compute duration
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // first half is a single copy (we render A + A)
    const nodes = Array.from(el.children).slice(0, el.children.length / 2) as HTMLElement[];
    const contentWidth = nodes.reduce((w, n) => w + n.offsetWidth, 0);
    if (contentWidth > 0) setDuration(contentWidth / pixelsPerSecond);
  }, [prices]);

  const formatPrice = (price: number) => {
    if (price === 0) return '--';
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    if (price < 1_000_000) return `$${(price / 1000).toFixed(2)}K`;
    return `$${(price / 1_000_000).toFixed(2)}M`;
  };

  const formatChange = (change: number) => {
    if (change === 0) return '0.00';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const getChangeColor = (change: number) =>
    change === 0 ? 'text-gray-300' : change > 0 ? 'text-green-400' : 'text-red-400';

  const PriceItem = ({ crypto }: { crypto: CryptoPrice }) => (
    <div className={`shrink-0 whitespace-nowrap flex items-center ${crypto.color}`}>
      <span className="font-bold text-sm mr-4">{crypto.symbol}</span>
      <span className="text-sm font-mono mr-4">{loading ? '...' : formatPrice(crypto.price)}</span>
      <span className={`text-sm font-semibold mr-6 ${getChangeColor(crypto.change24h)}`}>
        {loading ? '' : `(${formatChange(crypto.change24h)}%)`}
      </span>
      {/* divider */}
      <span className="h-6 w-px bg-slate-500/40" />
    </div>
  );

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-sm border-b border-cyan-500/30 overflow-hidden">
        <div className="flex items-center justify-between">
          {/* Scrollable track */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={trackRef}
              className="flex items-center gap-10 will-change-transform"
              style={{ animation: `ticker ${duration}s linear infinite` }}
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
            >
              {/* Copy A */}
              {ORDER.map((k) => (
                <PriceItem key={`A-${k}`} crypto={prices[k]} />
              ))}
              {/* Copy B (duplicate for seamless loop) */}
              {ORDER.map((k) => (
                <PriceItem key={`B-${k}`} crypto={prices[k]} />
              ))}
            </div>
          </div>

          {/* What's this? Button */}
          <div className="flex-shrink-0 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0"
              title="What's this?"
              aria-label="What's this? Learn about cryptocurrency price ticker"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Edge fade for polish (optional) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900/80 to-transparent" />

        {/* Info Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-cyan-500/30 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-cyan-400">
                🪙 Cryptocurrency Price Ticker
              </DialogTitle>
              <DialogDescription className="text-gray-300 pt-2">
                <div className="space-y-4">
                  <p>
                    This ticker displays live prices for major cryptocurrencies that are foundational to Web3:
                  </p>

                  <div className="space-y-3 pt-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🟣</span>
                      <div>
                        <p className="font-semibold text-purple-400">Solana (SOL)</p>
                        <p className="text-sm text-gray-300">
                          The blockchain powering Hoodie Academy. Fast, affordable, and Web3-native.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🟠</span>
                      <div>
                        <p className="font-semibold text-orange-400">Bitcoin (BTC)</p>
                        <p className="text-sm text-gray-300">
                          The original cryptocurrency that started the digital asset revolution.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🔵</span>
                      <div>
                        <p className="font-semibold text-blue-400">Ethereum (ETH)</p>
                        <p className="text-sm text-gray-300">
                          The smart contract platform that enabled DeFi and NFTs at scale.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">💛</span>
                      <div>
                        <p className="font-semibold text-yellow-400">Binance Coin (BNB)</p>
                        <p className="text-sm text-gray-300">
                          The native token of the Binance ecosystem, used for fees and utilities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-600">
                    <p className="text-sm">
                      <span className="font-semibold">Data Source:</span> CoinGecko API
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Prices update every minute. 24h change shows the percentage difference from the previous day.
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
  );
}
