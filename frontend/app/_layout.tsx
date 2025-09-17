﻿import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { ThemeProvider } from "../theme";
import TopBar from "./components/TopBar";`nimport DashboardQuick from "./components/DashboardQuick";

export default function RootLayout() {
  const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1 } });
  return (
    <ThemeProvider>
      <View style={styles.root}>
        <TopBar />
        <View style={styles.content}><Slot /></View>
      </View>
    </ThemeProvider>
  );
}

