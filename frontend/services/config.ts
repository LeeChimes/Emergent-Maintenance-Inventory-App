export const Config = {
  // Computed automatically. Override via EXPO_PUBLIC_HOME_PATH if needed.
  HOME_PATH: (process?.env?.EXPO_PUBLIC_HOME_PATH as string) || "/dashboard",
};