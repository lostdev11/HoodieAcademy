export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase";

export async function POST(req: NextRequest) {
  try {
    console.log("📬 API HIT: /api/verify-holder");

    const body = await req.json();
    console.log("🧾 Raw Body:", body);

    const walletAddress = body?.walletAddress;

    if (!walletAddress) {
      console.warn("❌ Missing wallet address");
      return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });
    }

    console.log("✅ walletAddress received:", walletAddress);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("users")
      .select("is_admin")
      .eq("wallet_address", walletAddress)
      .single();

    if (error) {
      console.error("❌ Supabase query error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const isAdmin = data?.is_admin === true;
    return NextResponse.json({ success: true, isAdmin });

  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message || err);
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
} 