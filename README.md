# Emergent Maintenance Inventory App

## Backend Setup

### MongoDB Configuration

The backend supports multiple environment variable names for flexible deployment:

#### Recommended Environment Variables
- `MONGODB_URI` - Primary MongoDB connection string
- `MONGODB_DB_NAME` - Database name (defaults to "emergent_inventory")

#### Alternative Environment Variables
The backend also accepts these alternative names for broader compatibility:
- MongoDB URL: `MONGO_URI`, `MONGO_URL`, `DATABASE_URL`
- Database name: `DB_NAME`

The system checks these variables in order and uses the first non-empty value found.

### Render Deployment Setup

#### Option 1: Environment Variables
Set these in your Render service's environment variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=emergent_inventory
```

#### Option 2: Secret Files
Create a Secret File named `.env` in your Render service with content:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=emergent_inventory
```
The backend automatically loads from `/etc/secrets/.env` (Render's Secret Files mount point).

### Troubleshooting

#### Diagnostic Endpoint
For debugging environment variable visibility, temporarily enable diagnostics:

1. Set `DIAGNOSTICS_ENABLED=true` in your environment
2. Access `GET /api/diag/env-keys` to see which MongoDB-related variables are detected
3. Remember to disable diagnostics (`DIAGNOSTICS_ENABLED=false` or remove the variable) after debugging

The diagnostic endpoint returns a JSON object showing boolean presence of environment variables without exposing secret values.

#### Startup Logs
The backend logs which environment variables were detected on startup:
- If successful: Shows which variable name was used (values are redacted)
- If failed: Shows which variables were checked and which were present but empty

## Frontend Setup

See `frontend/README.md` for frontend setup instructions.
