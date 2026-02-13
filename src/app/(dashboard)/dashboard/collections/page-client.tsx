'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/order-status';
import { useTableSearch } from '@/hooks/use-table-search';

interface CollectionListItem {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
  createdAt: string;
}

interface CollectionsPageClientProps {
  collections: CollectionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchQuery: string;
}

export function CollectionsPageClient({
  collections,
  total,
  page,
  pageSize,
  totalPages,
  searchQuery,
}: CollectionsPageClientProps) {
  const router = useRouter();
  const {
    isPending,
    searchInput,
    handleSearchChange,
    handlePageChange,
  } = useTableSearch({ searchQuery });

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Rechercher une collection..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-[300px]"
        />

        <p className="text-sm text-muted-foreground">
          {total === 0
            ? 'Aucune collection'
            : `${startItem}-${endItem} sur ${total} collection${total > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className={cn('relative', isPending && 'opacity-50 pointer-events-none')}>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Nom
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                  Produits
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucune collection trouvee.
                  </td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr
                    key={collection.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/collections/${collection.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{collection.name}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="max-w-[300px] truncate">
                        {collection.description ?? '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {collection.productCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(collection.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Precedent
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
