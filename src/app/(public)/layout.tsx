import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
