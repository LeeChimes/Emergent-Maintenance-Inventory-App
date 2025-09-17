import React, { createContext, useContext, PropsWithChildren } from "react";
import { colors } from "./colors";
import { spacing, radius } from "./spacing";
import { typography } from "./typography";
import { Platform, StyleSheet } from "react-native";

export const shadow = {
  card: Platform.select({
    web: { boxShadow: "0 4px 12px rgba(0,0,0,0.25)" },
    ios: { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 6 },
    default: {},
  }) as object,
  fab: Platform.select({
    web: { boxShadow: "0 6px 16px rgba(0,0,0,0.30)" },
    ios: { shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 8 },
    default: {},
  }) as object,
};

export const theme = { colors, spacing, radius, typography, shadow };
export type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function makeStyles(builder: (t: Theme) => any) {
  return () => {
    const t = useTheme();
    return StyleSheet.create(builder(t));
  };
}