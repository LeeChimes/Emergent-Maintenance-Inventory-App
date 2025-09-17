import React from "react";
import { Text, TextInput, Pressable, StyleSheet, Alert, View } from "react-native";
import Screen from "../components/Screen";
import { useTheme } from "../../theme";
import { useRouter } from "expo-router";
import { upsertWholesaler } from "../../services/wholesalers";

export default function WholesalerNew() {
  const t = useTheme();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");

  const s = StyleSheet.create({
    field: { borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: t.colors.text, backgroundColor: t.colors.bgSurface, marginBottom: 12 },
    btn: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: t.colors.brandPrimary },
    btnText: { color: t.colors.textOnBrand, fontWeight: "700" },
    title: { color: t.colors.text, fontSize: 20, fontWeight: "800", marginBottom: 12 },
  });

  const save = async () => {
    const nm = name.trim();
    if (!nm) { Alert.alert("Wholesaler", "Name is required."); return; }
    const rec = await upsertWholesaler({ name: nm, contactName: contactName.trim()||undefined, phone: phone.trim()||undefined, email: email.trim()||undefined, address: address.trim()||undefined });
    router.replace(`/wholesalers/${rec.id}`);
  };

  return (
    <Screen padded>
      <Text style={s.title}>New Wholesaler</Text>
      <TextInput placeholder="Name *" placeholderTextColor={t.colors.textDim} value={name} onChangeText={setName} style={s.field} />
      <TextInput placeholder="Contact name" placeholderTextColor={t.colors.textDim} value={contactName} onChangeText={setContactName} style={s.field} />
      <TextInput placeholder="Phone" placeholderTextColor={t.colors.textDim} value={phone} onChangeText={setPhone} style={s.field} keyboardType="phone-pad" />
      <TextInput placeholder="Email" placeholderTextColor={t.colors.textDim} value={email} onChangeText={setEmail} style={s.field} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Address" placeholderTextColor={t.colors.textDim} value={address} onChangeText={setAddress} style={[s.field,{height:80,textAlignVertical:"top"}]} multiline />
      <Pressable onPress={save} style={s.btn}><Text style={s.btnText}>Save</Text></Pressable>
    </Screen>
  );
}
