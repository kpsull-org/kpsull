import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { InvoiceData } from '../../../domain/entities/invoice.entity';
import { sharedStyles as styles, formatDate } from './shared-styles';
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

export const ClientOrderTemplate: React.FC<Props> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PdfIssuerBrand data={data} />
        <View>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>{data.number}</Text>
          <PdfIssuedAtLine issuedAt={data.issuedAt} />
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
      <PdfItemRows items={data.items} />

      <PdfTotalsSection data={data} />

      {(data.shippingAddress ?? data.shippingCarrier ?? data.notes) && (
        <View style={styles.deliveryBox}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          {data.shippingCarrier && (
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              {(() => {
                const trackingPart = data.shippingTrackingNumber ? ` — Suivi : ${data.shippingTrackingNumber}` : '';
                return `Transporteur : ${data.shippingCarrier}${trackingPart}`;
              })()}
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

      <PdfLegalFooter
        data={data}
        defaultPaymentConditions="Paiement immédiat par carte bancaire"
      />
    </Page>
  </Document>
);
