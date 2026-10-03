"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/** Android: brauzerning o'rnatish oynasini chaqiradi. iOS: ko'rsatma matnini ko'rsatadi. */
export function InstallPrompt({ label, iosHint }: { label: string; iosHint: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;
  if (isIos) return <p className="hint">📲 {iosHint}</p>;
  if (!deferred) return null;
  return (
    <button className="btn sec" onClick={() => void deferred.prompt()}>
      📲 {label}
    </button>
  );
}
