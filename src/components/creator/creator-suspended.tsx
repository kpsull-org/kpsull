'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CreatorSuspendedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-montserrat)] flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-black p-12 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-6">
          Kpsull
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black mb-4">
          Boutique indisponible
        </h1>
        <p className="text-base leading-[1.8] text-black/70 mb-10">
          Ce créateur n&apos;est plus disponible sur la plateforme.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="border border-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-black hover:text-white"
          >
            Retour à l&apos;accueil
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-black hover:text-white"
          >
            Page précédente
          </button>
        </div>
      </div>
    </div>
  );
}
