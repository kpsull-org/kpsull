'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SignOutButtonProps {
  callbackUrl?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

/**
 * Sign Out Button component
 *
 * A button that signs the user out and redirects to the specified URL.
 *
 * @example
 * ```tsx
 * <SignOutButton callbackUrl="/" />
 * ```
 */
export function SignOutButton({
  callbackUrl = '/',
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className,
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl });
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <LogOut className="mr-2 h-4 w-4" />
      ) : null}
      {isLoading ? 'Déconnexion...' : 'Déconnexion'}
    </Button>
  );
}
