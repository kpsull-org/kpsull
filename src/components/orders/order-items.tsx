import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';

interface OrderItem {
  id: string;
  productName: string;
  image?: string;
  variantInfo?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderItemsProps {
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping?: number;
    total: number;
  };
}

export function OrderItems({ items, totals }: OrderItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles commandes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="py-4 flex gap-4">
              <div className="w-16 h-16 relative bg-muted rounded-md overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                {item.variantInfo && (
                  <p className="text-sm text-muted-foreground">
                    {item.variantInfo}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Qte: {item.quantity} x {formatPrice(item.price)}
                </p>
              </div>
              <div className="text-right font-medium">
                {formatPrice(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          {totals.shipping !== undefined && (
            <div className="flex justify-between text-sm">
              <span>Livraison</span>
              <span>
                {totals.shipping > 0 ? formatPrice(totals.shipping) : 'Gratuit'}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
