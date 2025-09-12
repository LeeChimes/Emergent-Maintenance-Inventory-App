# Emergent Maintenance Inventory App

A mobile-first asset inventory management system for Chimes Shopping Centre maintenance team.

## Recent Updates - Phase 0 Repairs

### Authentication Changes
Login now requires PIN authentication via POST `/api/auth/login` with JSON body:
```json
{
  "user_id": "lee_carter",
  "pin": "1234"
}
```

**Legacy Support**: Query parameter login (`?user_id=lee_carter`) works only if `ALLOW_LEGACY_LOGIN=true` is set in environment variables (enabled during transition).

### Default Users
All default development users use PIN: `1234`
- lee_carter (supervisor)
- dan_carter (supervisor) 
- lee_paull (engineer)
- dean_turnill (engineer)
- luis (engineer)

### New Features
- **AI Chat**: POST `/api/ai-chat` provides deterministic help based on keywords
- **Error Reporting**: POST `/api/error-reports` collects app errors for investigation
- **Delivery Management**: Wired delivery routes are now accessible
- **Secure User Management**: PINs are masked (••••) and validated in real-time

## Quick Test Steps

### Backend API Test
```bash
# Test PIN login (correct PIN)
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "lee_carter", "pin": "1234"}'

# Test PIN login (wrong PIN - should return 401)
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "lee_carter", "pin": "9999"}'

# Test AI Chat
curl -X POST "http://localhost:8000/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I log a delivery?"}'

# Test Error Reporting
curl -X POST "http://localhost:8000/api/error-reports" \
  -H "Content-Type: application/json" \
  -d '{"error": "Test error", "screen": "Dashboard"}'

# Test Delivery Routes
curl "http://localhost:8000/api/deliveries"
```

### Frontend Test
1. Launch app - should show user selection screen
2. Tap any user - PIN modal should appear (no role-based bypass)
3. Enter wrong PIN - should shake and show error
4. Enter correct PIN (1234) - should log in successfully
5. Engineers should be redirected to engineer-hub
6. Supervisors should stay on dashboard

### Environment Setup
1. Copy `backend/.env.example` to `backend/.env`
2. Copy `frontend/.env.example` to `frontend/.env` 
3. Update URLs as needed for your deployment

## Architecture
- **Backend**: FastAPI with MongoDB
- **Frontend**: React Native (Expo)
- **Authentication**: PIN-based with JWT tokens
- **Deployment**: Backend on Render, Frontend via Expo
