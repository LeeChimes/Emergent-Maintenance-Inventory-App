# Emergent Maintenance Inventory App
2.
## Overview
This is a React Native (Expo) mobile application for managing maintenance inventory at Chimes Shopping Centre, with a FastAPI backend.

## Recent Changes (Phase 0 - PIN Authentication)
- **PIN Authentication**: All users (engineers and supervisors) now require PIN authentication
- **Server-side Validation**: PIN verification is now enforced on the backend
- **Default PINs**: All default users have PIN "1234" 
- **Security**: PINs are no longer displayed in plain text in user management

## Setup

### Backend
1. Install dependencies: `pip install -r backend/requirements.txt`
2. Copy `backend/.env.example` to `backend/.env` and configure MongoDB URI
3. Run: `cd backend && python server.py`

### Frontend  
1. Install dependencies: `cd frontend && npm install`
2. Copy `frontend/.env.example` to `frontend/.env` and configure backend URL
3. Run: `npm start`

## Default Users
All users have PIN: **1234**
- Lee Carter (supervisor)
- Dan Carter (supervisor)
- Lee Paull (engineer) 
- Dean Turnill (engineer)
- Luis (engineer)
