import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  companyName: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  companyDetails: { fontSize: 10, color: '#666', marginTop: 4 },
  invoiceTitle: { fontSize: 28, color: '#1e3a8a', textAlign: 'right' },
  invoiceMeta: { marginTop: 10, textAlign: 'right', fontSize: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8, marginTop: 20 },
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

export const PurchaseBillPDF = ({ bill }) => {
  const date = new Date(bill.createdAt).toLocaleDateString('en-IN');
  const totalBase = bill.total_amount - bill.total_gst;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{bill.tenant?.company_name || 'Himalayan Business'}</Text>
            {bill.tenant?.address && <Text style={styles.companyDetails}>{bill.tenant.address}</Text>}
            <Text style={styles.companyDetails}>
              {[
                bill.tenant?.gst_number ? `GSTIN: ${bill.tenant.gst_number}` : null,
                bill.tenant?.phone ? `Phone: ${bill.tenant.phone}` : null,
                bill.tenant?.email ? `Email: ${bill.tenant.email}` : null,
              ].filter(Boolean).join(' | ')}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>PURCHASE BILL</Text>
            <View style={styles.invoiceMeta}>
              <Text>Bill #: {bill.bill_number}</Text>
              <Text>Date: {date}</Text>
              <Text>Status: {bill.status}</Text>
              {bill.due_date && <Text>Due Date: {new Date(bill.due_date).toLocaleDateString('en-IN')}</Text>}
            </View>
          </View>
        </View>

        {/* Supplier Info */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Supplier:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{bill.supplier.name}</Text>
          {bill.supplier.phone && <Text style={{ marginTop: 2 }}>Phone: {bill.supplier.phone}</Text>}
          {bill.supplier.address && <Text style={{ marginTop: 2 }}>{bill.supplier.address}</Text>}
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
          {bill.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.product.name}</Text>
              </View>
              <Text style={styles.col2}>{item.quantity} {item.product.unit}</Text>
              <Text style={styles.col3}>{fmt(item.purchase_price_per_unit)}</Text>
              <Text style={styles.col4}>{fmt(item.gst_amount)}</Text>
              <Text style={styles.col5}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{fmt(totalBase)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>GST Input Credit:</Text>
            <Text>{fmt(bill.total_gst)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Grand Total:</Text>
            <Text>{fmt(bill.total_amount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{bill.tenant?.company_name || 'Himalayan Business'} - Internal Purchase Record</Text>
          <Text style={{ marginTop: 4 }}>This is a computer-generated document.</Text>
        </View>
      </Page>
    </Document>
  );
};
