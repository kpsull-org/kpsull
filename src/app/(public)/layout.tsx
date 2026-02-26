import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSyncOnLogin } from "@/components/layout/cart-sync-on-login";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { auth } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWTSessionError: invalid/expired token — treat as unauthenticated
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header user={session?.user ?? null} />
      <main className="flex-1 kp-page-enter">{children}</main>
      <Footer />
      <CartSyncOnLogin isAuthenticated={!!session?.user} />
      <CookieBanner />
    </div>
  );
}
