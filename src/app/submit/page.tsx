"use client";

import { useEffect } from "react";

export default function SubmitPage() {
  useEffect(() => {
    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      confetti();
    })();
  }, []);

  return <div>🎉 Submission complete!</div>;
}
