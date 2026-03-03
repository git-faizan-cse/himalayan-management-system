import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts if needed, or stick to built-in Helvetica/Times
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  companyName: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  companyDetails: { fontSize: 10, color: '#666', marginTop: 4 },
  invoiceTitle: { fontSize: 28, color: '#1e3a8a', textAlign: 'right' },
  invoiceMeta: { marginTop: 10, textAlign: 'right', fontSize: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8, marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  table: { width: '100%', marginTop: 20 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: 8, fontWeight: 'bold', fontSize: 10
  },
  tableRow: {
    flexDirection: 'row', borderBottom: '1px solid #e2e8f0', padding: 8, fontSize: 9
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: { width: '40%', alignSelf: 'flex-end', marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: 12 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 9, borderTop: '1px solid #e2e8f0', paddingTop: 10 }
});

const fmt = (n) => `Rs. ${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const InvoicePDF = ({ invoice }) => {
  const date = new Date(invoice.createdAt).toLocaleDateString('en-IN');
  const totalBase = invoice.total_amount - invoice.total_gst;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{invoice.tenant?.company_name || 'Himalayan Business'}</Text>
            {invoice.tenant?.address && <Text style={styles.companyDetails}>{invoice.tenant.address}</Text>}
            <Text style={styles.companyDetails}>
              {[
                invoice.tenant?.gst_number ? `GSTIN: ${invoice.tenant.gst_number}` : null,
                invoice.tenant?.phone ? `Phone: ${invoice.tenant.phone}` : null,
                invoice.tenant?.email ? `Email: ${invoice.tenant.email}` : null,
              ].filter(Boolean).join(' | ')}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <Text>Invoice #: {invoice.invoice_number}</Text>
              <Text>Date: {date}</Text>
              <Text>Status: {invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{invoice.customer.name}</Text>
          {invoice.customer.phone && <Text style={{ marginTop: 2 }}>Phone: {invoice.customer.phone}</Text>}
          {invoice.customer.address && <Text style={{ marginTop: 2 }}>{invoice.customer.address}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Item Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Rate</Text>
            <Text style={styles.col4}>GST</Text>
            <Text style={styles.col5}>Amount</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.product.name}</Text>
              </View>
              <Text style={styles.col2}>{item.quantity} {item.product.unit}</Text>
              <Text style={styles.col3}>{fmt(item.price_per_unit)}</Text>
              <Text style={styles.col4}>{fmt(item.gst_amount)}</Text>
              <Text style={styles.col5}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal (excl. GST):</Text>
            <Text>{fmt(totalBase)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total GST:</Text>
            <Text>{fmt(invoice.total_gst)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Grand Total:</Text>
            <Text>{fmt(invoice.total_amount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text style={{ marginTop: 4 }}>This is a computer-generated invoice and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );
};
