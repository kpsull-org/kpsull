'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Palette, Loader2 } from 'lucide-react';
import { setAccountType, type AccountType } from './actions';
import { cn } from '@/lib/utils';

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  buttonText: string;
  icon: React.ReactNode;
}

const options: AccountTypeOption[] = [
  {
    type: 'CLIENT',
    title: 'Je veux acheter',
    description: 'Découvrez les créations uniques de nos artisans français',
    buttonText: 'Continuer',
    icon: <ShoppingCart className="h-10 w-10" />,
  },
  {
    type: 'CREATOR',
    title: 'Je veux vendre',
    description: 'Vendez vos créations artisanales et développez votre activité',
    buttonText: 'Devenir créateur',
    icon: <Palette className="h-10 w-10" />,
  },
];

export function AccountTypeCard() {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(type: AccountType) {
    setSelectedType(type);
    setIsLoading(true);
    setError(null);

    try {
      const result = await setAccountType(type);
      if (!result.success && result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If success, the server action will redirect
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <Card
            key={option.type}
            className={cn(
              'cursor-pointer transition-all hover:border-primary hover:shadow-md',
              selectedType === option.type && 'border-primary shadow-md'
            )}
            onClick={() => !isLoading && handleSelect(option.type)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                {option.icon}
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription className="text-sm">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant={option.type === 'CREATOR' ? 'default' : 'outline'}
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.type);
                }}
              >
                {isLoading && selectedType === option.type ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  option.buttonText
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
