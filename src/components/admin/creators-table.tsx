'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Calendar,
  Filter,
  Ban,
  CheckCircle,
  LogIn,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  CreatorStatus,
  CreatorSortField,
  SortDirection,
} from '@/modules/analytics/application/ports';

// Re-export types for convenience
export type { CreatorStatus, CreatorSortField, SortDirection };

/**
 * Serialized version of CreatorSummary with Date fields as ISO strings.
 * Used to safely pass data across the Server/Client Component boundary in Next.js,
 * which cannot serialize Date objects directly.
 */
export interface SerializedCreatorSummary {
  id: string;
  name: string;
  email: string;
  /** ISO 8601 string — converted from Date before passing to client */
  registeredAt: string;
  status: CreatorStatus;
  totalRevenue: number;
}

export interface CreatorsTableProps {
  /** List of creators to display */
  creators: SerializedCreatorSummary[];
  /** Total number of creators (for pagination) */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Current sort field */
  sortBy: CreatorSortField;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Current search query */
  searchQuery?: string;
  /** Current status filter */
  statusFilter?: CreatorStatus | 'ALL';
  /** Whether data is loading */
  isLoading?: boolean;
  /** Currency for formatting amounts */
  currency?: string;
  /** Callback when sort changes */
  onSortChange?: (field: CreatorSortField, direction: SortDirection) => void;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Callback when status filter changes */
  onStatusFilterChange?: (status: CreatorStatus | 'ALL') => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when suspend action is triggered */
  onSuspend?: (creator: SerializedCreatorSummary) => void;
  /** Callback when reactivate action is triggered */
  onReactivate?: (creator: SerializedCreatorSummary) => void;
  /** Callback when impersonate action is triggered */
  onImpersonate?: (creator: SerializedCreatorSummary) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format amount in cents to currency string
 */
function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format date to localized string.
 * Accepts either a Date object or an ISO string (from serialized server props).
 */
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: CreatorStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="mr-1 h-3 w-3" />
        Actif
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <Ban className="mr-1 h-3 w-3" />
      Suspendu
    </Badge>
  );
}

/**
 * Sort header component with indicator
 */
function SortHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  field: CreatorSortField;
  currentField: CreatorSortField;
  currentDirection: SortDirection;
  onSort: (field: CreatorSortField, direction: SortDirection) => void;
}) {
  const isActive = currentField === field;
  const Icon = isActive && currentDirection === 'asc' ? ChevronUp : ChevronDown;

  const handleClick = () => {
    const newDirection = isActive && currentDirection === 'desc' ? 'asc' : 'desc';
    onSort(field, newDirection);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1 font-medium hover:text-foreground transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {label}
      <Icon className={cn('h-4 w-4', !isActive && 'opacity-50')} />
    </button>
  );
}

/**
 * Status filter button component
 */
function StatusFilterButton({
  label,
  value,
  currentValue,
  onClick,
}: {
  label: string;
  value: CreatorStatus | 'ALL';
  currentValue: CreatorStatus | 'ALL';
  onClick: (value: CreatorStatus | 'ALL') => void;
}) {
  const isActive = currentValue === value;

  return (
    <Button
      type="button"
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={() => onClick(value)}
      className="min-w-[80px]"
    >
      {label}
    </Button>
  );
}

/**
 * CreatorsTable
 *
 * Story 11-2: Liste gestion createurs
 *
 * Displays a table of creators for admin management.
 * Supports sorting, filtering by status, search, and pagination.
 *
 * Acceptance Criteria:
 * - AC1: Table des createurs avec infos (nom, email, date inscription, statut, CA)
 * - AC2: Filtres par statut (actif, suspendu)
 * - AC3: Recherche par nom/email
 * - AC4: Pagination
 *
 * @example
 * ```tsx
 * <CreatorsTable
 *   creators={creators}
 *   total={100}
 *   page={1}
 *   pageSize={10}
 *   totalPages={10}
 *   sortBy="registeredAt"
 *   sortDirection="desc"
 *   statusFilter="ALL"
 *   onSortChange={(field, dir) => handleSort(field, dir)}
 *   onSearchChange={(query) => handleSearch(query)}
 *   onStatusFilterChange={(status) => handleStatusFilter(status)}
 *   onPageChange={(page) => handlePageChange(page)}
 *   onSuspend={(creator) => handleSuspend(creator)}
 *   onReactivate={(creator) => handleReactivate(creator)}
 * />
 * ```
 */
export function CreatorsTable({
  creators,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDirection,
  searchQuery = '',
  statusFilter = 'ALL',
  isLoading = false,
  currency = 'EUR',
  onSortChange,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onSuspend,
  onReactivate,
  onImpersonate,
  className,
}: CreatorsTableProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearchChange?.(localSearch);
    },
    [localSearch, onSearchChange]
  );

  const handleSort = useCallback(
    (field: CreatorSortField, direction: SortDirection) => {
      onSortChange?.(field, direction);
    },
    [onSortChange]
  );

  const handleStatusFilter = useCallback(
    (status: CreatorStatus | 'ALL') => {
      onStatusFilterChange?.(status);
    },
    [onStatusFilterChange]
  );

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Createurs
              </CardTitle>
              <CardDescription>
                {total} createur{total !== 1 ? 's' : ''} au total
              </CardDescription>
            </div>

            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom ou email..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Rechercher
              </Button>
            </form>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Statut:</span>
            <div className="flex gap-2">
              <StatusFilterButton
                label="Tous"
                value="ALL"
                currentValue={statusFilter}
                onClick={handleStatusFilter}
              />
              <StatusFilterButton
                label="Actifs"
                value="ACTIVE"
                currentValue={statusFilter}
                onClick={handleStatusFilter}
              />
              <StatusFilterButton
                label="Suspendus"
                value="SUSPENDED"
                currentValue={statusFilter}
                onClick={handleStatusFilter}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && creators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun createur trouve</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Aucun createur ne correspond a vos criteres de recherche.'
                : 'Aucun createur inscrit pour le moment.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && creators.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Createur"
                        field="name"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Email"
                        field="email"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Inscription"
                        field="registeredAt"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader
                        label="CA Total"
                        field="totalRevenue"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => (
                    <tr
                      key={creator.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium">{creator.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {creator.email}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(creator.registeredAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={creator.status} />
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        {formatCurrency(creator.totalRevenue, currency)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onImpersonate?.(creator)}
                          >
                            <LogIn className="mr-1 h-3 w-3" />
                            Impersonifier
                          </Button>
                          {creator.status === 'ACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSuspend?.(creator)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Ban className="mr-1 h-3 w-3" />
                              Suspendre
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReactivate?.(creator)}
                              className="text-green-600 hover:text-green-600"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Reactiver
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex} a {endIndex} sur {total} createurs
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedent
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = getPageNumber(i, page, totalPages);
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange?.(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(page + 1)}
                  disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate page number for pagination buttons
 */
function getPageNumber(index: number, currentPage: number, totalPages: number): number {
  if (totalPages <= 5) {
    return index + 1;
  }

  if (currentPage <= 3) {
    return index + 1;
  }

  if (currentPage >= totalPages - 2) {
    return totalPages - 4 + index;
  }

  return currentPage - 2 + index;
}
