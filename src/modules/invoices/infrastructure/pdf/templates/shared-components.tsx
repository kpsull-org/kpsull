import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { InvoiceData, InvoiceLineItem } from '../../../domain/entities/invoice.entity';
import { sharedStyles as styles, formatAmount, formatDate } from './shared-styles';

/**
 * Shared PDF sub-components reused across invoice templates.
 *
 * Centralised here to eliminate duplication between client-order and
 * creator-subscription templates.
 */

/** Company branding block shown on the left of the header */
export const PdfIssuerBrand: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <View>
    <Text style={styles.companyName}>KPSULL</Text>
    <Text style={{ fontSize: 9, color: '#666666', marginTop: 4 }}>{data.issuer.address}</Text>
    <Text style={{ fontSize: 9, color: '#666666' }}>SIRET : {data.issuer.siret}</Text>
    <Text style={{ fontSize: 9, color: '#666666' }}>{data.issuer.email}</Text>
  </View>
);

/** Rows of the items table (one row per line item) */
export const PdfItemRows: React.FC<{ items: InvoiceLineItem[] }> = ({ items }) => (
  <>
    {items.map((item, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.colDescription}>{item.description}</Text>
        <Text style={styles.colQty}>{item.quantity}</Text>
        <Text style={styles.colPrice}>{formatAmount(item.unitPrice)}</Text>
        <Text style={styles.colTotal}>{formatAmount(item.totalPrice)}</Text>
      </View>
    ))}
  </>
);

/** Totals block: sous-total HT, TVA, TOTAL TTC */
export const PdfTotalsSection: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <View style={styles.totalsSection}>
    <View style={styles.totalRow}>
      <Text>Sous-total HT</Text>
      <Text>{formatAmount(data.subtotal)}</Text>
    </View>
    <View style={styles.totalRow}>
      <Text>TVA ({(data.taxRate * 100).toFixed(0)} %)</Text>
      <Text>{formatAmount(data.taxAmount)}</Text>
    </View>
    <View style={styles.totalFinal}>
      <Text>TOTAL TTC</Text>
      <Text>{formatAmount(data.total)}</Text>
    </View>
  </View>
);

/** Legal footer with issuer identity and payment conditions */
export const PdfLegalFooter: React.FC<{
  data: InvoiceData;
  defaultPaymentConditions: string;
}> = ({ data, defaultPaymentConditions }) => (
  <View style={styles.footer}>
    <Text>
      {`${data.issuer.name} — SIRET ${data.issuer.siret}${data.issuer.vatNumber ? ` — N° TVA ${data.issuer.vatNumber}` : ''} — ${data.issuer.email}`}
    </Text>
    <Text style={{ marginTop: 3 }}>
      {`Conditions de règlement : ${data.paymentConditions ?? defaultPaymentConditions} — Pas d'escompte pour paiement anticipé`}
    </Text>
    <Text style={{ marginTop: 2 }}>
      En cas de retard de paiement : indemnité forfaitaire de recouvrement 40 € + intérêts au taux BCE majoré de 10 points (art. L441-10 C. com.)
    </Text>
  </View>
);

/** Issued-at date line shown in the header right column */
export const PdfIssuedAtLine: React.FC<{ issuedAt: Date }> = ({ issuedAt }) => (
  <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right', marginTop: 4 }}>
    Émise le {formatDate(issuedAt)}
  </Text>
);
