
// Frontend API base URL
// Uses EXPO_PUBLIC_BACKEND_URL if provided; otherwise defaults to your live backend.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://chimes-backend.onrender.com';
