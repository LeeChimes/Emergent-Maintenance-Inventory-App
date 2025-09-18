import React from "react";
import { View, Text, StyleSheet } from "react-native";

const suppliers = [
  { name: "Kone Ltd", contact: "01234 567890", email: "info@kone.com" },
  { name: "Ironmongery Direct", contact: "020 1234 5678", email: "sales@ironmongerydirect.com" },
  { name: "City Electricals", contact: "0161 987 6543", email: "support@cityelectricals.co.uk" },
];

export default function SuppliersListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suppliers Directory</Text>
      {suppliers.map((s, i) => (
        <View key={i} style={styles.supplierCard}>
          <Text style={styles.supplierName}>{s.name}</Text>
          <Text style={styles.supplierDetail}>Phone: {s.contact}</Text>
          <Text style={styles.supplierDetail}>Email: {s.email}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#18181b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 18 },
  supplierCard: { backgroundColor: '#232323', borderRadius: 10, padding: 16, marginBottom: 14 },
  supplierName: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  supplierDetail: { fontSize: 15, color: '#fff', marginTop: 2 },
});
