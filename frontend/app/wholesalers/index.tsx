import React from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Switch } from "react-native";
import Screen from "../components/Screen";
import { useTheme } from "../../theme";
import { useRouter } from "expo-router";
import { listWholesalers } from "../../services/wholesalers";
import type { Wholesaler } from "../../types/wholesaler";

export default function WholesalersList() {
  const t = useTheme();
  const router = useRouter();
  const [items, setItems] = React.useState<Wholesaler[]>([]);
  const [q, setQ] = React.useState("");
  const [onlyPref, setOnlyPref] = React.useState(false);

  React.useEffect(() => { (async () => setItems(await listWholesalers()))(); }, []);

  const data = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(w => {
      if (onlyPref && !w.preferred) return false;
      if (!term) return true;
      return (w.name||"").toLowerCase().includes(term)
          || (w.contactName||"").toLowerCase().includes(term)
          || (w.phone||"").toLowerCase().includes(term)
          || (w.email||"").toLowerCase().includes(term);
    });
  }, [items,q,onlyPref]);

  const s = StyleSheet.create({
    row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border },
    name: { color: t.colors.text, fontWeight: "700" },
    small: { color: t.colors.textDim, marginTop: 4 },
    top: { flexDirection: "row", gap: 10, marginBottom: 12 },
    input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: t.colors.text, backgroundColor: t.colors.bgSurface },
    btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: t.colors.brandPrimary },
    btnText: { color: t.colors.textOnBrand, fontWeight: "700" },
    filter: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    star: { color: t.colors.text, marginLeft: 6 },
  });

  const Stars = ({ n }: { n?: number }) => <Text style={s.star}>{"★".repeat(n||0)}</Text>;

  return (
    <Screen padded>
      <View style={s.top}>
        <TextInput placeholder="Search wholesalers..." placeholderTextColor={t.colors.textDim} value={q} onChangeText={setQ} style={s.input} />
        <Pressable onPress={() => router.push("/wholesalers/new")} style={s.btn}><Text style={s.btnText}>Add</Text></Pressable>
      </View>
      <View style={s.filter}>
        <Switch value={onlyPref} onValueChange={setOnlyPref} /><Text style={{color:t.colors.text}}>Preferred only</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/wholesalers/${item.id}`)} style={s.row}>
            <Text style={s.name}>{item.name} {item.preferred ? "★" : ""}</Text>
            <Text style={s.small}>{[item.contactName, item.phone, item.email].filter(Boolean).join(" · ") || "No contact set"}</Text>
            <Stars n={item.rating as any} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{color:t.colors.textDim, marginTop:16}}>No wholesalers yet.</Text>}
      />
    </Screen>
  );
}
