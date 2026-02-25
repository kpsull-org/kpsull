import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo at top center */}
      <header className="py-8 px-4 flex justify-center border-b border-black/10">
        <Link href="/" className="text-primary">
          <Logo size="md" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 kp-page-enter">{children}</main>
    </div>
  );
}
