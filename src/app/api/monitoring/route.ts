import { NextResponse } from "next/server";

// Sentry tunnel - proxies error reports through our own domain
// This bypasses ad blockers that block requests to sentry.io
// See: https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option

const SENTRY_HOST = "o4510878320033792.ingest.de.sentry.io";
const SENTRY_PROJECT_IDS = ["4510878342119504"];

export async function POST(request: Request) {
  try {
    const envelope = await request.text();
    const pieces = envelope.split("\n");

    const firstPiece = pieces[0];
    if (!firstPiece) {
      return NextResponse.json({ error: "Empty envelope" }, { status: 400 });
    }

    const header = JSON.parse(firstPiece);
    const dsn = new URL(header.dsn);

    const projectId = dsn.pathname.replace("/", "");

    if (dsn.hostname !== SENTRY_HOST) {
      return NextResponse.json({ error: "Invalid Sentry host" }, { status: 400 });
    }

    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;

    const response = await fetch(upstreamUrl, {
      method: "POST",
      body: envelope,
    });

    return new NextResponse(response.body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Tunnel error" }, { status: 500 });
  }
}
