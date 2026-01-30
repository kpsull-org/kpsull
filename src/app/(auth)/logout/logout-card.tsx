'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutCardProps {
  userName: string;
}

export function LogoutCard({ userName }: LogoutCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <LogOut className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">Déconnexion</CardTitle>
        <CardDescription>
          Êtes-vous sûr de vouloir vous déconnecter, {userName} ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          variant="destructive"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
}
