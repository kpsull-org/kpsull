import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceData } from '../../../domain/entities/invoice.entity';
import { formatAmount, formatDate, formatPeriod } from './shared-styles';

/**
 * Platform Summary template uses its own distinct styles
 * (dark headers, compact layout) while reusing shared formatters.
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderBottom: '2 solid #000000',
    paddingBottom: 16,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  },
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '3 8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 6,
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: '6 10',
    marginBottom: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 10',
    borderBottom: '0.5 solid #eeeeee',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '5 10',
    borderBottom: '0.5 solid #eeeeee',
    backgroundColor: '#fafafa',
  },
  colType: { flex: 1.5 },
  colCreator: { flex: 2 },
  colPeriod: { flex: 1.5 },
  colAmount: { flex: 1, textAlign: 'right' },
  summaryBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #000000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '0.5 solid #dddddd',
    paddingTop: 10,
    color: '#aaaaaa',
    fontSize: 7,
    textAlign: 'center',
  },
});

interface Props {
  data: InvoiceData;
  subscriptionTotal?: number;
  commissionTotal?: number;
}

export const PlatformSummaryTemplate: React.FC<Props> = ({ data, subscriptionTotal = 0, commissionTotal = 0 }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>KPSULL</Text>
          <Text style={styles.badge}>Usage interne — Confidentiel</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>RÉCAPITULATIF MENSUEL PLATEFORME</Text>
          <Text style={{ fontSize: 9, color: '#666666', textAlign: 'right' }}>{data.number}</Text>
          {data.period && (
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginTop: 4 }}>
              {formatPeriod(data.period)}
            </Text>
          )}
          <Text style={{ fontSize: 8, color: '#999999', textAlign: 'right', marginTop: 2 }}>
            Généré le {formatDate(data.issuedAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Détail des transactions</Text>

      <View style={styles.tableHeader}>
        <Text style={styles.colType}>Type</Text>
        <Text style={styles.colCreator}>Créateur</Text>
        <Text style={styles.colPeriod}>Date</Text>
        <Text style={styles.colAmount}>Montant HT</Text>
      </View>
      {data.items.map((item, index) => (
        <View key={item.description} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={styles.colType}>{item.description.startsWith('Commission') ? 'Commission' : 'Abonnement'}</Text>
          <Text style={styles.colCreator}>{item.description}</Text>
          <Text style={styles.colPeriod} />
          <Text style={styles.colAmount}>{formatAmount(item.totalPrice)}</Text>
        </View>
      ))}

      <View style={styles.summaryBox}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Résumé financier
        </Text>
        <View style={styles.summaryRow}>
          <Text>Revenus abonnements</Text>
          <Text>{formatAmount(subscriptionTotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Revenus commissions</Text>
          <Text>{formatAmount(commissionTotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: '#666666' }}>TVA collectée ({(data.taxRate * 100).toFixed(0)} %)</Text>
          <Text style={{ color: '#666666' }}>{formatAmount(data.taxAmount)}</Text>
        </View>
        <View style={styles.summaryTotal}>
          <Text>CA PLATEFORME HT</Text>
          <Text>{formatAmount(data.subtotal)}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Document confidentiel — {data.issuer.name} — SIRET {data.issuer.siret} — Exercice {data.issuedAt.getFullYear()}
      </Text>
    </Page>
  </Document>
);
