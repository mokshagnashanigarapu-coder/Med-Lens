#!/bin/bash
# MedLens Google Cloud Run Deployment Script

set -e

PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"us-central1"}
SERVICE_NAME="medlens"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP Project ID is missing. Usage: ./deploy-cloudrun.sh [PROJECT_ID] [REGION]"
  exit 1
fi

echo "=================================================="
echo " Deploying MedLens to Google Cloud Run"
echo " Project: ${PROJECT_ID}"
echo " Region:  ${REGION}"
echo " Service: ${SERVICE_NAME}"
echo "=================================================="

# Build container using Google Cloud Build
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

# Deploy container to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL="gemini-2.5-flash"

echo "=================================================="
echo " MedLens Cloud Run Deployment Complete!"
echo "=================================================="
