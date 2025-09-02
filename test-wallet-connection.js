// Test script to debug wallet connection
// Run this in your browser console

async function testWalletConnection() {
  console.log('🧪 Testing wallet connection...');
  
  try {
    // Check if Phantom wallet is available
    const provider = window.solana;
    if (!provider) {
      console.error('❌ Phantom wallet not found');
      return;
    }
    
    console.log('✅ Phantom wallet found');
    console.log('🔑 Current public key:', provider.publicKey?.toString() || 'None');
    console.log('🔌 Is connected:', !!provider.publicKey);
    
    // Check if wallet is already connected
    if (provider.publicKey) {
      console.log('🎯 Wallet already connected:', provider.publicKey.toString());
      return;
    }
    
    // Try to connect
    console.log('🔌 Attempting to connect...');
    try {
      await provider.connect();
      console.log('✅ Connection successful!');
      console.log('🔑 New public key:', provider.publicKey?.toString());
    } catch (error) {
      console.error('❌ Connection failed:', error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Test the wallet connection
testWalletConnection();
