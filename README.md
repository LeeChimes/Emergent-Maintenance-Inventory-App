# Emergent Maintenance Inventory App

A full-stack inventory management application with Expo/React Native frontend and FastAPI backend.

## Backend Setup

### Requirements
- Python 3.8+
- MongoDB (optional for development)

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017  # Optional - graceful fallback if missing
MONGODB_DB_NAME=emergent_inventory     # Optional - defaults to "emergent_inventory"
PORT=8000                              # Optional - defaults to 8000
```

### Running the Backend
```bash
cd backend
python server.py
```

The backend will start and:
- Connect to MongoDB if `MONGODB_URI` is set
- Gracefully handle missing database (logs warning, continues running)
- Return 500 errors for inventory operations when DB is unavailable
- Create helpful indexes on first DB connection
- Auto-create default users if database is empty

### API Documentation
Once running, visit `http://localhost:8000/docs` for interactive API documentation.

### Seeding Test Data
If you have a MongoDB connection configured, you can seed the database with sample data:

```bash
# Via curl (POST)
curl -X POST http://localhost:8000/api/dev/seed-basic

# Or via browser (GET)
open http://localhost:8000/api/dev/seed-basic
```

This creates sample materials, tools, and transactions for testing.

## Frontend Setup

### Requirements
- Node.js 18+
- Expo CLI

### Installation
```bash
cd frontend
npm install
```

### Running the Frontend
```bash
cd frontend
npx expo start
```

### Configuration
The frontend automatically connects to the deployed backend at `https://chimes-backend.onrender.com`. 

To use a different backend URL, set the environment variable:
```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

## API Endpoints

### Materials
- `GET /api/materials` - List all materials
- `GET /api/materials/{id}` - Get specific material
- `POST /api/materials` - Create material
- `PUT /api/materials/{id}` - Update material

### Tools
- `GET /api/tools` - List all tools
- `GET /api/tools/{id}` - Get specific tool
- `POST /api/tools` - Create tool
- `PUT /api/tools/{id}` - Update tool

### Alerts
- `GET /api/alerts/low-stock` - Get low stock alerts

### Transactions
- `GET /api/transactions` - List transactions (recent first)
- `POST /api/transactions` - Create transaction

### Development
- `GET/POST /api/dev/seed-basic` - Seed database with sample data
