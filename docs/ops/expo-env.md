# Expo Environment Configuration

## Overview

The Expo app uses a centralized configuration system for the backend URL with automatic fallback behavior.

## Fallback Behavior

The app will work out of the box without any environment variables set. It uses this configuration priority:

1. `EXPO_PUBLIC_BACKEND_URL` environment variable (if set)
2. Fallback to `https://chimes-backend.onrender.com` (default production backend)

## Setting Backend URL

### Local Development

For local development, create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
# Edit the URL as needed:
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### EAS Builds (Expo Application Services)

For production builds via EAS, set the environment variable in the Expo dashboard:

1. Go to your project in the Expo dashboard
2. Navigate to "Secrets" or "Environment Variables"
3. Add `EXPO_PUBLIC_BACKEND_URL` with your backend URL

Alternatively, you can set it in your `eas.json` configuration file:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://your-backend.com"
      }
    }
  }
}
```

## Verification

To verify the configuration is working:

1. Check that the app starts without errors
2. Look for successful API calls in the network tab/logs
3. Test core functionality like viewing inventory or dashboard

## Troubleshooting

- **App can't connect to backend**: Verify the URL is accessible and includes the protocol (http/https)
- **Environment variable not working**: Make sure you're using `EXPO_PUBLIC_` prefix for client-side variables
- **Local development issues**: Ensure your local backend is running and accessible at the specified URL