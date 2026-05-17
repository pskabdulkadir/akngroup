import React from "react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="flex items-center gap-3">
        <span className="inline-block h-3 w-3 rounded-full bg-violet-500 animate-pulse" />
        <span className="inline-block h-3 w-3 rounded-full bg-violet-500 animate-pulse [animation-delay:150ms]" />
        <span className="inline-block h-3 w-3 rounded-full bg-violet-500 animate-pulse [animation-delay:300ms]" />
        <span className="ml-2 opacity-80">Yükleniyor…</span>
      </div>
    </div>
  );
}
