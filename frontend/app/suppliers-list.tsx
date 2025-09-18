import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";

const suppliers = [
  { name: "Kone Ltd", contact: "01234 567890", email: "info@kone.com" },
  { name: "Ironmongery Direct", contact: "020 1234 5678", email: "sales@ironmongerydirect.com" },
  { name: "City Electricals", contact: "0161 987 6543", email: "support@cityelectricals.co.uk" },
];

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#18181b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 18 },
  supplierCard: { backgroundColor: '#232323', borderRadius: 10, padding: 16, marginBottom: 14 },
  supplierName: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  supplierDetail: { fontSize: 15, color: '#fff', marginTop: 2 },
  detailsBtn: { marginTop: 10, backgroundColor: '#10B981', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start' },
  detailsBtnTxt: { color: '#fff', fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#232323', borderRadius: 12, padding: 24, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#10B981', marginBottom: 10 },
  modalDetail: { fontSize: 16, color: '#fff', marginBottom: 6 },
  closeBtn: { marginTop: 18, backgroundColor: '#10B981', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 24 },
  closeBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default function SuppliersListScreen() {
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (supplier) => {
    setSelected(supplier);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suppliers Directory</Text>
      {suppliers.map((s, i) => (
        <View key={i} style={styles.supplierCard}>
          <Text style={styles.supplierName}>{s.name}</Text>
          <Text style={styles.supplierDetail}>Phone: {s.contact}</Text>
          <Text style={styles.supplierDetail}>Email: {s.email}</Text>
          <TouchableOpacity style={styles.detailsBtn} onPress={() => openModal(s)}>
            <Text style={styles.detailsBtnTxt}>View Details</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={closeModal}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.modalDetail}>Phone: {selected?.contact}</Text>
            <Text style={styles.modalDetail}>Email: {selected?.email}</Text>
            <Text style={styles.modalDetail}>Address: Example Address, City</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <Text style={styles.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}