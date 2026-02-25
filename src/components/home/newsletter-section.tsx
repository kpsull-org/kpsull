"use client";

import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const buttonLabel =
    status === "loading" ? "..." : status === "success" ? "INSCRIT ✓" : "S'INSCRIRE";

  return (
    <section className="border-t-2 border-black bg-white px-6 py-12 md:px-12 md:py-14 lg:px-20 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          {/* Texte gauche */}
          <div className="max-w-lg">
            <p className="font-[family-name:var(--font-montserrat)] text-[11px] font-semibold uppercase tracking-[0.3em] text-black/30">
              Newsletter
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-montserrat)] text-2xl font-black uppercase leading-tight tracking-tight text-black md:text-3xl">
              L&apos;essentiel,
              <br />
              rien de plus.
            </h2>
            <p className="mt-2 font-[family-name:var(--font-archivo)] text-sm leading-relaxed text-black/50">
              Nouveaux créateurs, collections exclusives, actualités mode.
            </p>
          </div>

          {/* Formulaire droite */}
          <div className="shrink-0 md:w-[420px]">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={status === "loading" || status === "success"}
                className="flex-1 border border-black bg-transparent px-4 py-3 font-[family-name:var(--font-montserrat)] text-[12px] placeholder:text-black/30 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="border border-black bg-black px-6 py-3 font-[family-name:var(--font-montserrat)] text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
              >
                {buttonLabel}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-2 font-[family-name:var(--font-montserrat)] text-[11px] uppercase tracking-wider text-red-600">
                Une erreur est survenue. Réessayez.
              </p>
            )}
            <p className="mt-2 font-[family-name:var(--font-archivo)] text-[10px] text-black/25">
              Désinscription à tout moment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
