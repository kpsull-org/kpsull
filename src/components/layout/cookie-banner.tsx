"use client";

import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

const CONSENT_KEY = "kpsull_cookie_consent";

type ConsentStatus = "accepted" | "declined" | null;

function enableSentryReplay() {
  try {
    const client = Sentry.getClient();
    if (!client) return;
    // Ajouter l'intégration replay dynamiquement si pas déjà présente
    const existing = client.getIntegrationByName("Replay");
    if (!existing) {
      Sentry.addIntegration(
        Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
      );
    }
  } catch {
    // Sentry non initialisé en dev, silencieux
  }
}

export function CookieBanner() {
  const [status, setStatus] = useState<ConsentStatus | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null;
    setStatus(stored);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setStatus("accepted");
    enableSentryReplay();
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setStatus("declined");
  }

  // Ne pas afficher si déjà répondu ou en chargement (SSR)
  if (status !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t-2 border-black bg-white font-[family-name:var(--font-montserrat)]"
    >
      {/* Ligne décorative double — cohérent avec le header */}
      <div className="h-[2px] w-full bg-black" />

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-12">
        {/* Texte */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
            COOKIES & CONFIDENTIALITÉ
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-black/60">
            Nous utilisons des cookies pour améliorer votre expérience, mesurer
            l&apos;audience et analyser nos performances (Sentry, Analytics).{" "}
            <Link
              href="/mentions-legales"
              className="underline underline-offset-2 hover:text-black transition-colors"
            >
              En savoir plus
            </Link>
            .
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={decline}
            className="border border-black/30 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-black/50 transition-colors hover:border-black hover:text-black"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={accept}
            className="border border-black bg-black px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-black"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper côté client pour lire le consentement.
 * Utiliser dans les composants qui conditionnent PostHog / Sentry.
 */
export function getCookieConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentStatus;
}
