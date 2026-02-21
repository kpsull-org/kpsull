export type InvoiceType = 'CREATOR_SUBSCRIPTION' | 'CLIENT_ORDER' | 'PLATFORM_SUMMARY';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // en centimes
  totalPrice: number; // en centimes
}

export interface InvoiceIssuer {
  name: string;
  address: string;
  siret: string;
  /** Numéro TVA intracommunautaire (ex: FR12345678901) */
  vatNumber?: string;
  email: string;
}

export interface InvoiceRecipient {
  name: string;
  email: string;
  address?: string;
  siret?: string; // pour les créateurs (entreprises)
  vatNumber?: string; // pour les créateurs assujettis à la TVA
}

/** Adresse de livraison structurée pour les factures client */
export interface InvoiceShippingAddress {
  street: string;
  streetComplement?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface InvoiceData {
  number: string;
  type: InvoiceType;
  issuedAt: Date;
  dueAt?: Date;
  period?: Date; // pour les récapitulatifs mensuels

  issuer: InvoiceIssuer;
  recipient: InvoiceRecipient;

  items: InvoiceLineItem[];
  subtotal: number; // HT en centimes
  taxRate: number;  // ex: 0.20 pour 20%
  taxAmount: number; // TVA en centimes
  total: number;    // TTC en centimes

  /** Adresse de livraison (factures client commande) */
  shippingAddress?: InvoiceShippingAddress;
  /** Transporteur choisi (ex: "Chronopost", "Mondial Relay", "Relais Colis") */
  shippingCarrier?: string;
  /** Numéro de suivi colis */
  shippingTrackingNumber?: string;
  /** Conditions de règlement (ex: "Paiement immédiat par carte bancaire") */
  paymentConditions?: string;

  notes?: string;
}
