import { User, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerInfoProps {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  notes?: string | null;
}

export function CustomerInfo({ customer, address, notes }: CustomerInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="font-medium">{customer.name}</p>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
          {customer.phone && (
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            Adresse de livraison
          </p>
          <p className="text-sm text-muted-foreground">
            {address.street}
            <br />
            {address.postalCode} {address.city}
            <br />
            {address.country}
          </p>
        </div>

        {notes && (
          <div>
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Notes du client
            </p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
