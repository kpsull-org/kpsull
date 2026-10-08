import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Coolify recopie les durées du HEALTHCHECK dans ses réglages de déploiement et attend
// start-period + retries x interval avant de déclarer un déploiement en échec.
const CHEMIN_DOCKERFILE = resolve(process.cwd(), "Dockerfile");
const COMMANDE_ATTENDUE = 'wget -qO- http://localhost:${PORT:-3000}/ || exit 1';
const OPTIONS_AUTORISEES = ["interval", "timeout", "start-period", "start-interval", "retries"];
const ATTENTE_COOLIFY_MAX_S = 420;
const DELAI_UNHEALTHY_MAX_S = 300;

function instructionHealthcheck(): string {
  const texte = readFileSync(CHEMIN_DOCKERFILE, "utf8").replace(/\\\r?\n/g, " ");
  const lignes = texte.split(/\r?\n/).filter((l) => /^\s*HEALTHCHECK\s/i.test(l));
  expect(lignes).toHaveLength(1);
  return lignes[0]!.trim();
}

function decouper(instruction: string): { options: Map<string, string>; commande: string } {
  const [, avantCmd = "", commande = ""] = /^HEALTHCHECK\s+([\s\S]*?)\s+CMD\s+([\s\S]*)$/i.exec(instruction) ?? [];
  const options = new Map<string, string>();
  for (const [, nom, valeur] of avantCmd.matchAll(/--([a-z-]+)=(\S+)/g)) {
    options.set(nom!, valeur!);
  }
  return { options, commande: commande.trim() };
}

function secondes(valeur: string | undefined): number {
  const m = /^(\d+)s$/.exec(valeur ?? "");
  expect(m, `durée en secondes attendue, reçu « ${valeur} »`).not.toBeNull();
  return Number(m![1]);
}

describe("HEALTHCHECK du Dockerfile", () => {
  const { options, commande } = decouper(instructionHealthcheck());

  it("garde la commande de contrôle d'origine", () => {
    expect(commande).toBe(COMMANDE_ATTENDUE);
  });

  it("ne porte que les options autorisées", () => {
    expect([...options.keys()].filter((o) => !OPTIONS_AUTORISEES.includes(o))).toEqual([]);
    expect(options.get("interval")).toBe("300s");
  });

  it("reste sous l'attente maximale de Coolify (start-period + retries x interval)", () => {
    const attente = secondes(options.get("start-period")) + Number(options.get("retries")) * secondes(options.get("interval"));
    expect(attente).toBeLessThan(ATTENTE_COOLIFY_MAX_S);
  });

  it("passe unhealthy en 5 minutes au plus (retries x interval)", () => {
    const delai = Number(options.get("retries")) * secondes(options.get("interval"));
    expect(delai).toBeLessThanOrEqual(DELAI_UNHEALTHY_MAX_S);
  });
});
