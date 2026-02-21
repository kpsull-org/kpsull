import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceData } from '../../../domain/entities/invoice.entity';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '2 solid #000000',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  },
  invoiceTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: '8 12',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 12',
    borderBottom: '0.5 solid #eeeeee',
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsSection: {
    marginTop: 16,
    borderTop: '1 solid #eeeeee',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalFinal: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2 solid #000000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  deliveryBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderLeft: '3 solid #000000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '0.5 solid #dddddd',
    paddingTop: 10,
    color: '#999999',
    fontSize: 7,
    textAlign: 'center',
  },
});

const formatAmount = (centimes: number): string =>
  `${(centimes / 100).toFixed(2)} \u20AC`;

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR').format(date);

interface Props {
  data: InvoiceData;
}

export const ClientOrderTemplate: React.FC<Props> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>KPSULL</Text>
          <Text style={{ fontSize: 9, color: '#666666', marginTop: 4 }}>{data.issuer.address}</Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>SIRET : {data.issuer.siret}</Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>{data.issuer.email}</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>{data.number}</Text>
          <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right', marginTop: 4 }}>
            Émise le {formatDate(data.issuedAt)}
          </Text>
          {data.dueAt && (
            <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right' }}>
              Échéance : {formatDate(data.dueAt)}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.row, { marginBottom: 32 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendeur</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.issuer.name}</Text>
          <Text style={{ color: '#666666' }}>{data.issuer.email}</Text>
        </View>
        <View style={[styles.section, { alignItems: 'flex-end' }]}>
          <Text style={styles.sectionTitle}>Facturé à</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.recipient.name}</Text>
          <Text style={{ color: '#666666' }}>{data.recipient.email}</Text>
          {data.recipient.address && (
            <Text style={{ color: '#666666' }}>{data.recipient.address}</Text>
          )}
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colDescription}>Produit</Text>
        <Text style={styles.colQty}>Qté</Text>
        <Text style={styles.colPrice}>Prix unitaire</Text>
        <Text style={styles.colTotal}>Total</Text>
      </View>
      {data.items.map((item, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={styles.colDescription}>{item.description}</Text>
          <Text style={styles.colQty}>{item.quantity}</Text>
          <Text style={styles.colPrice}>{formatAmount(item.unitPrice)}</Text>
          <Text style={styles.colTotal}>{formatAmount(item.totalPrice)}</Text>
        </View>
      ))}

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

      {(data.shippingAddress ?? data.shippingCarrier ?? data.notes) && (
        <View style={styles.deliveryBox}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          {data.shippingCarrier && (
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              {`Transporteur : ${data.shippingCarrier}${data.shippingTrackingNumber ? ` — Suivi : ${data.shippingTrackingNumber}` : ''}`}
            </Text>
          )}
          {data.shippingAddress && (
            <View>
              <Text style={{ color: '#444444' }}>{data.shippingAddress.street}</Text>
              {data.shippingAddress.streetComplement && (
                <Text style={{ color: '#444444' }}>{data.shippingAddress.streetComplement}</Text>
              )}
              <Text style={{ color: '#444444' }}>{`${data.shippingAddress.postalCode} ${data.shippingAddress.city}`}</Text>
              <Text style={{ color: '#444444' }}>{data.shippingAddress.country}</Text>
            </View>
          )}
          {data.notes && !data.shippingAddress && (
            <Text style={{ color: '#444444' }}>{data.notes}</Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text>
          {`${data.issuer.name} — SIRET ${data.issuer.siret}${data.issuer.vatNumber ? ` — N° TVA ${data.issuer.vatNumber}` : ''} — ${data.issuer.email}`}
        </Text>
        <Text style={{ marginTop: 3 }}>
          {`Conditions de règlement : ${data.paymentConditions ?? 'Paiement immédiat par carte bancaire'} — Pas d'escompte pour paiement anticipé`}
        </Text>
        <Text style={{ marginTop: 2 }}>
          En cas de retard de paiement : indemnité forfaitaire de recouvrement 40 € + intérêts au taux BCE majoré de 10 points (art. L441-10 C. com.)
        </Text>
      </View>
    </Page>
  </Document>
);
