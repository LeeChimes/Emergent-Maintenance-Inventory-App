# Render Deployment and Smoke Testing

This document explains how to set up and use the automated Render deployment and smoke testing workflow.

## Overview

The `render-deploy-smoke.yml` GitHub Actions workflow automates:
- Triggering a Render deployment via Deploy Hook
- Waiting for the service to become healthy
- Running smoke tests against key API endpoints
- Optionally seeding development data

## Setup Instructions

### Step 1: Create a Render Deploy Hook

1. Go to your Render Dashboard
2. Navigate to your service (e.g., `chimes-backend`)
3. Go to the **Settings** tab
4. Scroll down to **Deploy Hooks**
5. Click **Add Deploy Hook**
6. Give it a name like "GitHub Actions Deploy"
7. Copy the generated webhook URL (it will look like: `https://api.render.com/deploy/srv-xxxxx?key=yyyyy`)

### Step 2: Add the Deploy Hook as a GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set the name to: `RENDER_DEPLOY_HOOK_URL`
5. Paste the webhook URL from Step 1 as the value
6. Click **Add secret**

## Running the Workflow

### Manual Execution

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **"Render: deploy and smoke"** from the left sidebar
4. Click **"Run workflow"**
5. Configure the parameters:
   - **base_url**: The URL of your deployed service (default: `https://chimes-backend.onrender.com`)
   - **run_seed**: Whether to reset data with development seed (default: `false`)
   - **wait_timeout_seconds**: Maximum time to wait for health (default: `600`)
6. Click **"Run workflow"**

### Workflow Parameters

- **base_url** (required): The base URL of your deployed service
  - Default: `https://chimes-backend.onrender.com`
  - Change this to match your actual Render service URL

- **run_seed** (optional): Whether to run the development seed
  - Default: `false` (safe default to prevent accidental data resets)
  - Set to `true` only when you want to reset all data with fresh seed data
  - ⚠️ **WARNING**: This will delete all existing data!

- **wait_timeout_seconds** (optional): How long to wait for the service to be healthy
  - Default: `600` (10 minutes)
  - Increase if your service takes longer to deploy and start

## What the Workflow Does

### 1. Deploy Trigger (Optional)
- If `RENDER_DEPLOY_HOOK_URL` secret exists, triggers a new deployment
- If no secret is configured, skips deployment and tests the existing service

### 2. Health Check Polling
- Polls `{base_url}/` endpoint until it returns HTTP 200
- Waits up to the configured timeout period
- Shows elapsed time and service status

### 3. Smoke Tests
- Tests `{base_url}/api/tools` for HTTP 200 response
- Tests `{base_url}/api/materials` for HTTP 200 response
- Fails the workflow if any endpoint is not responding correctly

### 4. Development Seed (Optional)
- Only runs if `run_seed` parameter is set to `true`
- Calls `{base_url}/api/dev/seed-basic` endpoint
- Displays the count of created materials, tools, and transactions
- ⚠️ **Resets all data** - use carefully!

## Workflow Scenarios

### Scenario 1: Deploy and Test (Recommended)
- Configure `RENDER_DEPLOY_HOOK_URL` secret
- Run workflow with default parameters
- Result: New deployment triggered, health checked, smoke tested

### Scenario 2: Test Only
- No `RENDER_DEPLOY_HOOK_URL` secret configured
- Run workflow with default parameters  
- Result: Tests existing deployment without triggering new deploy

### Scenario 3: Deploy, Test, and Seed
- Configure `RENDER_DEPLOY_HOOK_URL` secret
- Run workflow with `run_seed: true`
- Result: New deployment, health check, smoke tests, and fresh seed data
- ⚠️ **Use with caution** - this resets all data!

## Troubleshooting

### Service Health Check Fails
- Verify the `base_url` parameter matches your actual Render service URL
- Check Render dashboard for deployment status and logs
- Increase `wait_timeout_seconds` if deployment is slow

### Deploy Hook Fails
- Verify `RENDER_DEPLOY_HOOK_URL` secret is correctly set
- Check that the webhook URL is valid and not expired
- Ensure your Render service has deploy hooks enabled

### Smoke Tests Fail
- Check if your service is actually running and healthy
- Verify the API endpoints `/api/tools` and `/api/materials` exist and return data
- Look at the service logs in Render dashboard for errors

### Seed Endpoint Fails
- Ensure your service has the `/api/dev/seed-basic` endpoint implemented
- Check service logs for database connection issues
- Verify the database is connected and accessible

## Future Enhancements

This workflow can be extended with:
- Automatic deployment on push to main branch
- Integration tests beyond basic smoke tests
- Slack/email notifications on success/failure
- Database backup before seeding
- Blue/green deployment support

## Security Notes

- The deploy hook URL contains sensitive information - keep it secure
- The seed endpoint can reset all data - use `run_seed: true` carefully
- Consider restricting who can run the workflow with branch protection rules