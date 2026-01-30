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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CustomerSummary, CustomerSortField, SortDirection } from '@/modules/analytics/application/ports';

export interface CustomersTableProps {
  /** List of customers to display */
  customers: CustomerSummary[];
  /** Total number of customers (for pagination) */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Current sort field */
  sortBy: CustomerSortField;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Current search query */
  searchQuery?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Currency for formatting amounts */
  currency?: string;
  /** Callback when sort changes */
  onSortChange?: (field: CustomerSortField, direction: SortDirection) => void;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
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
 * Format date to localized string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
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
  field: CustomerSortField;
  currentField: CustomerSortField;
  currentDirection: SortDirection;
  onSort: (field: CustomerSortField, direction: SortDirection) => void;
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
 * CustomersTable
 *
 * Story 10-3: Liste historique clients
 *
 * Displays a table of customers with their order history.
 * Supports sorting by date, amount, and order count.
 * Includes search functionality for filtering by name or email.
 *
 * @example
 * ```tsx
 * <CustomersTable
 *   customers={customers}
 *   total={100}
 *   page={1}
 *   pageSize={10}
 *   totalPages={10}
 *   sortBy="lastOrderDate"
 *   sortDirection="desc"
 *   onSortChange={(field, dir) => handleSort(field, dir)}
 *   onSearchChange={(query) => handleSearch(query)}
 *   onPageChange={(page) => handlePageChange(page)}
 * />
 * ```
 */
export function CustomersTable({
  customers,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDirection,
  searchQuery = '',
  isLoading = false,
  currency = 'EUR',
  onSortChange,
  onSearchChange,
  onPageChange,
  className,
}: CustomersTableProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearchChange?.(localSearch);
    },
    [localSearch, onSearchChange]
  );

  const handleSort = useCallback(
    (field: CustomerSortField, direction: SortDirection) => {
      onSortChange?.(field, direction);
    },
    [onSortChange]
  );

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients
            </CardTitle>
            <CardDescription>
              {total} client{total !== 1 ? 's' : ''} au total
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
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun client trouve</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Aucun client ne correspond a votre recherche.'
                : 'Vous n\'avez pas encore de clients.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && customers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Client"
                        field="name"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader
                        label="Commandes"
                        field="totalOrders"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader
                        label="Total depense"
                        field="totalSpent"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader
                        label="Derniere commande"
                        field="lastOrderDate"
                        currentField={sortBy}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Badge variant="secondary">
                          {customer.totalOrders} commande{customer.totalOrders !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        {formatCurrency(customer.totalSpent, currency)}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {formatDate(customer.lastOrderDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex} a {endIndex} sur {total} clients
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
