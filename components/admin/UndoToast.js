"use client";

import { useEffect, useState } from "react";

// A bottom toast that counts down from 30 seconds. Tapping Undo restores
// the deleted item; letting it expire means it's gone for good.
export default function UndoToast({ message, expiresAt, onUndo, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-text-primary px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white">{message}</p>
        <button
          onClick={onUndo}
          className="flex-shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
        >
          Undo ({secondsLeft}s)
        </button>
      </div>
    </div>
  );
}
