"use client";
import { useEffect, useState } from "react";

export function useClientFlag() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
