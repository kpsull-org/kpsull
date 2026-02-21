import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { InvoiceData } from '../../../domain/entities/invoice.entity';
import { sharedStyles as styles, formatPeriod } from './shared-styles';
import {
  PdfIssuerBrand,
  PdfIssuedAtLine,
  PdfItemRows,
  PdfTotalsSection,
  PdfLegalFooter,
} from './shared-components';

interface Props {
  data: InvoiceData;
}

export const CreatorSubscriptionTemplate: React.FC<Props> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PdfIssuerBrand data={data} />
        <View>
          <Text style={styles.invoiceTitle}>FACTURE D&apos;ABONNEMENT</Text>
          <Text style={styles.invoiceNumber}>{data.number}</Text>
          <PdfIssuedAtLine issuedAt={data.issuedAt} />
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
      <PdfItemRows items={data.items} />

      <PdfTotalsSection data={data} />

      <PdfLegalFooter
        data={data}
        defaultPaymentConditions="Paiement à réception de facture"
      />
    </Page>
  </Document>
);
