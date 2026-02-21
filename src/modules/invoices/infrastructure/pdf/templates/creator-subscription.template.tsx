import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { InvoiceData } from '../../../domain/entities/invoice.entity';
import { sharedStyles as styles, formatAmount, formatDate, formatPeriod } from './shared-styles';

interface Props {
  data: InvoiceData;
}

export const CreatorSubscriptionTemplate: React.FC<Props> = ({ data }) => (
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
          <Text style={styles.invoiceTitle}>FACTURE D&apos;ABONNEMENT</Text>
          <Text style={styles.invoiceNumber}>{data.number}</Text>
          <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right', marginTop: 4 }}>
            Émise le {formatDate(data.issuedAt)}
          </Text>
          {data.period && (
            <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right' }}>
              Période : {formatPeriod(data.period)}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.row, { marginBottom: 32 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Émetteur</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.issuer.name}</Text>
          <Text style={{ color: '#666666' }}>{data.issuer.email}</Text>
        </View>
        <View style={[styles.section, { alignItems: 'flex-end' }]}>
          <Text style={styles.sectionTitle}>Facturé à</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.recipient.name}</Text>
          <Text style={{ color: '#666666' }}>{data.recipient.email}</Text>
          {data.recipient.siret && (
            <Text style={{ color: '#666666' }}>SIRET : {data.recipient.siret}</Text>
          )}
          {data.recipient.address && (
            <Text style={{ color: '#666666' }}>{data.recipient.address}</Text>
          )}
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colDescription}>Description</Text>
        <Text style={styles.colQty}>Qté</Text>
        <Text style={styles.colPrice}>Prix unitaire HT</Text>
        <Text style={styles.colTotal}>Total HT</Text>
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

      <View style={styles.footer}>
        <Text>
          {`${data.issuer.name} — SIRET ${data.issuer.siret}${data.issuer.vatNumber ? ` — N° TVA ${data.issuer.vatNumber}` : ''} — ${data.issuer.email}`}
        </Text>
        <Text style={{ marginTop: 3 }}>
          {`Conditions de règlement : ${data.paymentConditions ?? 'Paiement à réception de facture'} — Pas d'escompte pour paiement anticipé`}
        </Text>
        <Text style={{ marginTop: 2 }}>
          En cas de retard de paiement : indemnité forfaitaire de recouvrement 40 € + intérêts au taux BCE majoré de 10 points (art. L441-10 C. com.)
        </Text>
      </View>
    </Page>
  </Document>
);
