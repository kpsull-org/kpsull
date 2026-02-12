'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSummary {
  id: string;
  name: string | null;
  email: string;
  city: string | null;
  orderCount: number;
  createdAt: string;
}

interface ClientsPageClientProps {
  clients: ClientSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchQuery: string;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function ClientsPageClient({
  clients,
  total,
  page,
  pageSize,
  totalPages,
  searchQuery,
}: ClientsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        updateSearchParams({
          search: value || undefined,
          page: '1',
        });
      }, 300);
    },
    [updateSearchParams],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateSearchParams({ page: newPage.toString() });
    },
    [updateSearchParams],
  );

  const handleImpersonate = useCallback(
    async (userId: string) => {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(data.redirectUrl);
        router.refresh();
      }
    },
    [router]
  );

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {searchQuery
          ? `${total} client${total !== 1 ? 's' : ''} trouve${total !== 1 ? 's' : ''}`
          : `${total} client${total !== 1 ? 's' : ''}`}
      </p>

      {/* Table */}
      <div
        className={cn(
          'rounded-lg border bg-white overflow-hidden',
          isPending && 'opacity-60 pointer-events-none',
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Nom
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Ville
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Commandes
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Inscrit le
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {searchQuery
                    ? 'Aucun client ne correspond a votre recherche.'
                    : 'Aucun client inscrit pour le moment.'}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {client.name ?? (
                      <span className="text-muted-foreground italic">
                        Non renseigne
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.city ?? (
                      <span className="italic">Non renseignee</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {client.orderCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dateFormatter.format(new Date(client.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleImpersonate(client.id)}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <LogIn className="mr-1 h-3 w-3" />
                      Impersonifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {startItem}-{endItem} sur {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Precedent
            </button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
