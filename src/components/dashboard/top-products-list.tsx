'use client';

import { Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TopSellingProduct } from '@/modules/analytics/application/ports';

export interface TopProductsListProps {
  /** List of top selling products */
  products: TopSellingProduct[];
  /** Maximum number of products to display */
  maxItems?: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format currency in EUR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount / 100);
}

/**
 * TopProductsList
 *
 * Displays a ranked list of top selling products with quantity sold and revenue.
 * Used in the PRO analytics section of the creator dashboard.
 *
 * @example
 * ```tsx
 * <TopProductsList
 *   products={[
 *     { productId: '1', productName: 'T-Shirt', totalSold: 50, totalRevenue: 125000 },
 *     { productId: '2', productName: 'Mug', totalSold: 30, totalRevenue: 45000 },
 *   ]}
 *   maxItems={5}
 * />
 * ```
 */
export function TopProductsList({
  products,
  maxItems = 5,
  className,
}: TopProductsListProps) {
  const displayedProducts = products.slice(0, maxItems);

  if (displayedProducts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Produits les plus vendus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Package className="mb-2 h-10 w-10 opacity-50" />
            <p className="text-sm">Aucune vente enregistree</p>
            <p className="text-xs">Les produits vendus apparaitront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find max revenue for relative bar sizing
  const maxRevenue = Math.max(...displayedProducts.map((p) => p.totalRevenue));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          Produits les plus vendus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedProducts.map((product, index) => {
            const percentage = (product.totalRevenue / maxRevenue) * 100;

            return (
              <div key={product.productId} className="space-y-2">
                {/* Product info row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <Badge
                      variant={index === 0 ? 'default' : 'secondary'}
                      className={cn(
                        'h-6 w-6 justify-center p-0 text-xs',
                        index === 0 &&
                          'bg-gradient-to-r from-amber-400 to-amber-600'
                      )}
                    >
                      {index + 1}
                    </Badge>
                    {/* Product name */}
                    <span className="text-sm font-medium line-clamp-1">
                      {product.productName}
                    </span>
                  </div>
                  {/* Revenue */}
                  <span className="text-sm font-semibold text-purple-600">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </div>

                {/* Revenue bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Quantity sold */}
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {product.totalSold} vendu{product.totalSold > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
