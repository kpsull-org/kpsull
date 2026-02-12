'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/impersonate/status')
      .then((res) => res.json())
      .then((data: { isImpersonating: boolean }) =>
        setIsImpersonating(data.isImpersonating)
      )
      .catch(() => setIsImpersonating(false));
  }, []);

  if (!isImpersonating) return null;

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate/stop', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirectUrl);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <AlertTriangle className="h-4 w-4" />
      <span>Mode impersonification actif</span>
      <button
        onClick={handleStopImpersonation}
        disabled={isLoading}
        className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30 disabled:opacity-50"
      >
        {isLoading ? 'Retour en cours...' : 'Revenir a mon compte admin'}
      </button>
    </div>
  );
}
