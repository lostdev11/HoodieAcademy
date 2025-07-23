const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log("📬 API HIT: /.netlify/functions/verify-holder");

    const body = JSON.parse(event.body);
    console.log("🧾 Raw Body:", body);

    const walletAddress = body?.walletAddress;

    if (!walletAddress) {
      console.warn("❌ Missing wallet address");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Missing walletAddress" }),
      };
    }

    console.log("✅ walletAddress received:", walletAddress);

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "Database configuration error" }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("users")
      .select("is_admin")
      .eq("wallet_address", walletAddress)
      .single();

    if (error) {
      console.error("❌ Supabase query error:", error.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message }),
      };
    }

    const isAdmin = data?.is_admin === true;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, isAdmin }),
    };

  } catch (err) {
    console.error("❌ Unexpected error:", err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || "Internal Server Error" }),
    };
  }
}; 