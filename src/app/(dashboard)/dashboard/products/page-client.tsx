'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate } from '@/lib/utils/order-status';
import { useTableSearch } from '@/hooks/use-table-search';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Globe, EyeOff, Archive, Trash2 } from 'lucide-react';
import { publishProduct, unpublishProduct, archiveProduct, deleteProduct } from './actions';

interface ProductListItem {
  id: string;
  name: string;
  price: number;
  status: string;
  variantCount: number;
  createdAt: string;
}

interface ProductsPageClientProps {
  products: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchQuery: string;
  statusFilter: string | undefined;
}

const PRODUCT_STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publie' },
  { value: 'ARCHIVED', label: 'Archive' },
] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publie',
  ARCHIVED: 'Archive',
};

function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function ProductsPageClient({
  products,
  total,
  page,
  pageSize,
  totalPages,
  searchQuery,
  statusFilter,
}: ProductsPageClientProps) {
  const router = useRouter();
  const [isPendingAction, startActionTransition] = useTransition();
  const {
    isPending,
    searchInput,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
  } = useTableSearch({ searchQuery });

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  function handlePublish(id: string) {
    startActionTransition(async () => {
      await publishProduct(id);
    });
  }

  function handleUnpublish(id: string) {
    startActionTransition(async () => {
      await unpublishProduct(id);
    });
  }

  function handleArchive(id: string) {
    startActionTransition(async () => {
      await archiveProduct(id);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ? Cette action est irreversible.')) return;
    startActionTransition(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-[300px]"
          />

          <select
            value={statusFilter ?? ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-muted-foreground">
          {total === 0
            ? 'Aucun produit'
            : `${startItem}-${endItem} sur ${total} produit${total > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className={cn('relative', (isPending || isPendingAction) && 'opacity-50 pointer-events-none')}>
          {(isPending || isPendingAction) && (
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
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                  Prix
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                  Variantes
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="h-10 w-12 px-2" />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucun produit trouve.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{product.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatAmount(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          getStatusBadgeClass(product.status)
                        )}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {product.variantCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </td>
                    <td
                      className="px-2 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions pour {product.name}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/products/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handlePublish(product.id)}>
                              <Globe className="h-4 w-4" />
                              Publier
                            </DropdownMenuItem>
                          )}
                          {product.status === 'PUBLISHED' && (
                            <DropdownMenuItem onClick={() => handleUnpublish(product.id)}>
                              <EyeOff className="h-4 w-4" />
                              Mettre en pause
                            </DropdownMenuItem>
                          )}
                          {product.status !== 'ARCHIVED' && (
                            <DropdownMenuItem onClick={() => handleArchive(product.id)}>
                              <Archive className="h-4 w-4" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
