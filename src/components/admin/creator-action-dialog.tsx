'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreatorActionDialogProps {
  creatorId: string;
  creatorName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction: (creatorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  icon: LucideIcon;
  iconClassName: string;
  iconContainerClassName: string;
  title: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonRequiredMessage: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  confirmClassName?: string;
}

export function CreatorActionDialog({
  creatorId,
  creatorName,
  open = false,
  onOpenChange,
  onAction,
  icon: Icon,
  iconClassName,
  iconContainerClassName,
  title,
  reasonLabel,
  reasonPlaceholder,
  reasonRequiredMessage,
  description,
  confirmLabel,
  pendingLabel,
  confirmClassName,
}: CreatorActionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(open);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setReason('');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError(reasonRequiredMessage);
      return;
    }

    startTransition(async () => {
      const result = await onAction(creatorId, reason.trim());

      if (result.success) {
        handleOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => handleOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2"
          onClick={() => handleOpenChange(false)}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>

        <CardHeader className="text-center pb-2">
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', iconContainerClassName)}>
            <Icon className={cn('h-6 w-6', iconClassName)} />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            Createur: {creatorName}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action-reason">
                {reasonLabel} <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                disabled={isPending}
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
                  error && 'border-destructive'
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {description}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isPending || !reason.trim()}
                className={cn('w-full', confirmClassName)}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {pendingLabel}
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
