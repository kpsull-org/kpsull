'use client';

import Link from 'next/link';
import { UserPlus, Sparkles, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Creator summary data for the new creators list
 */
export interface NewCreatorSummary {
  /** Unique creator ID */
  id: string;
  /** Creator display name */
  name: string;
  /** Creator email */
  email: string;
  /** Profile image URL */
  image: string | null;
  /** Brand name if set during onboarding */
  brandName: string | null;
  /** Date when the creator account was activated */
  createdAt: Date;
}

export interface NewCreatorsListProps {
  /** List of recently registered creators (last 7 days) */
  creators: NewCreatorSummary[];
  /** Maximum number of creators to display */
  maxItems?: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * Check if creator was registered less than 24 hours ago
 */
function isNew(createdAt: Date): boolean {
  const now = new Date();
  const hoursAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursAgo < 24;
}

/**
 * Format the time since registration
 */
function formatTimeAgo(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `Il y a ${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  }

  if (diffDays === 1) {
    return 'Hier';
  }

  return `Il y a ${diffDays} jours`;
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * NewCreatorsList
 *
 * Story 11-4: Notification nouveaux createurs
 *
 * Displays a list of recently registered creators (last 7 days)
 * with a "Nouveau" badge for those registered less than 24 hours ago.
 * Each creator has a link to view their details.
 *
 * Acceptance Criteria:
 * - AC1: Liste des createurs recemment inscrits (7 derniers jours)
 * - AC2: Badge "Nouveau" sur les createurs < 24h
 * - AC3: Lien vers details createur
 *
 * @example
 * ```tsx
 * <NewCreatorsList
 *   creators={[
 *     {
 *       id: '1',
 *       name: 'Marie Dupont',
 *       email: 'marie@example.com',
 *       image: null,
 *       brandName: 'Studio Marie',
 *       createdAt: new Date(),
 *     },
 *   ]}
 *   maxItems={5}
 * />
 * ```
 */
export function NewCreatorsList({
  creators,
  maxItems = 5,
  className,
}: NewCreatorsListProps) {
  const displayedCreators = creators.slice(0, maxItems);

  if (displayedCreators.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <UserPlus className="h-4 w-4 text-green-600" />
            Nouveaux createurs
          </CardTitle>
          <CardDescription>Createurs inscrits ces 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Users className="mb-2 h-10 w-10 opacity-50" />
            <p className="text-sm">Aucun nouveau createur</p>
            <p className="text-xs">Les nouvelles inscriptions apparaitront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <UserPlus className="h-4 w-4 text-green-600" />
          Nouveaux createurs
        </CardTitle>
        <CardDescription>
          {creators.length} createur{creators.length !== 1 ? 's' : ''} inscrit
          {creators.length !== 1 ? 's' : ''} ces 7 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedCreators.map((creator) => {
            const creatorIsNew = isNew(creator.createdAt);

            return (
              <Link
                key={creator.id}
                href={`/admin/creators/${creator.id}`}
                className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    {creator.image && (
                      <AvatarImage src={creator.image} alt={creator.name} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-600 text-white text-xs font-medium">
                      {getInitials(creator.name)}
                    </AvatarFallback>
                  </Avatar>
                  {creatorIsNew && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
                      <Sparkles className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>

                {/* Creator info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {creator.brandName ?? creator.name}
                    </span>
                    {creatorIsNew && (
                      <Badge
                        variant="default"
                        className={cn(
                          'h-5 px-1.5 text-xs font-medium',
                          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        )}
                      >
                        Nouveau
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{creator.email}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0">{formatTimeAgo(creator.createdAt)}</span>
                  </div>
                </div>

                {/* Link indicator */}
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>

        {/* Show more link if there are more creators */}
        {creators.length > maxItems && (
          <Link
            href="/admin/creators"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voir tous les createurs
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
