import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { TartanStripe } from '@/components/brand/tartan-stripe';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo at top center */}
      <header className="py-6 flex justify-center">
        <Link href="/" className="text-primary">
          <Logo size="md" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Tartan stripe at bottom */}
      <TartanStripe />
    </div>
  );
}
