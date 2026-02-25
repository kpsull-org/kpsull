import * as Sentry from "@sentry/nextjs";

const CONSENT_KEY = "kpsull_cookie_consent";
const hasConsent = typeof globalThis.window !== "undefined"
  && localStorage.getItem(CONSENT_KEY) === "accepted";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tunnel: "/api/monitoring",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1,
  // Session replay uniquement si consentement donné
  replaysSessionSampleRate: hasConsent ? 1 : 0,
  replaysOnErrorSampleRate: hasConsent ? 1 : 0,
  integrations: hasConsent
    ? [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.browserTracingIntegration(),
      ]
    : [Sentry.browserTracingIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
