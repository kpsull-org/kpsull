import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared PDF template styles and utility formatters.
 *
 * Centralised here to avoid duplication across invoice template files.
 */
export const sharedStyles = StyleSheet.create({
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

/** Format an amount in centimes to a human-readable euro string (e.g. "12.50 €") */
export const formatAmount = (centimes: number): string =>
  `${(centimes / 100).toFixed(2)} \u20AC`;

/** Format a Date to a short French locale string (e.g. "21/02/2026") */
export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR').format(date);

/** Format a Date to a long month+year French string (e.g. "février 2026") */
export const formatPeriod = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
