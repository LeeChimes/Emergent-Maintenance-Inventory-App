# Render Deployment & Smoke Testing

## Overview

This document describes the automated deployment and testing workflow for the Chimes Backend on Render.

## Workflow Behavior

The GitHub Actions workflow `render-deploy-smoke.yml` supports two modes:

### Automatic Smoke Testing (Push to Main)
- **Trigger**: Every push to `main` branch
- **Actions**: Runs smoke tests only
- **Tests**: 
  - GET `/` (health check)
  - GET `/api/tools` (API functionality)
  - GET `/api/materials` (API functionality)
- **Backend URL**: Uses default `https://chimes-backend.onrender.com` or configurable input

### Manual Deployment + Smoke Testing
- **Trigger**: Manual workflow dispatch
- **Actions**: Optional deployment + smoke tests + optional seeding
- **Deploy**: Only runs when manually triggered (never on push)
- **Seed**: Only runs when `run_seed` is set to `true` in manual dispatch

## Safety Features

- **No accidental deploys**: Deployment only happens on manual workflow dispatch
- **Automatic regression detection**: Smoke tests run on every main branch push
- **Configurable backend URL**: Can test against different environments

## Manual Workflow Inputs

When manually triggering the workflow, you can configure:

- `backend_url`: Backend URL to test (default: `https://chimes-backend.onrender.com`)
- `run_seed`: Whether to run database seeding after deployment (default: `false`)

## Default Backend URL

The production backend is deployed at `https://chimes-backend.onrender.com` and serves as both:
- The default fallback URL in the Expo app configuration
- The default target for smoke tests and deployments

## Usage

### Running Smoke Tests Only
- Push to `main` branch - tests run automatically
- No deployment occurs, only health verification

### Deploying + Testing
1. Go to GitHub Actions
2. Select "Render Deploy & Smoke Tests" workflow
3. Click "Run workflow"
4. Optionally configure backend URL and seeding
5. Deploy + smoke tests + optional seeding will run

This ensures production stability while allowing safe, controlled deployments.