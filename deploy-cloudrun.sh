# Deploy JanSetu AI to Google Cloud Run
# Usage: ./deploy-cloudrun.sh <PROJECT_ID> <REGION>
# Optimized for production with performance and security best practices

PROJECT_ID=${1:-"your-gcp-project-id"}
REGION=${2:-"asia-south1"} # Mumbai region for low latency across India
SERVICE_NAME="jansetu-ai"

echo "=========================================================="
echo "🚀 Deploying JanSetu AI to Google Cloud Run"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "=========================================================="

# Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build and submit container image via Google Cloud Build with caching
echo "🔨 Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --timeout 20m \
  --cache

# Deploy to Cloud Run with optimized configuration
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 100 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars GEMINI_MODEL=gemini-2.5-flash,NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --ingress all \
  --network-tags jansetu-public \
  --labels app=jansetu-ai,environment=production,version=2.5

# Configure IAM policy for public access
echo "🔐 Configuring IAM policy..."
gcloud run services add-iam-policy-binding $SERVICE_NAME \
  --region $REGION \
  --member allUsers \
  --role roles/run.invoker

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo "=========================================================="
echo "✅ JanSetu AI deployed successfully on Google Cloud Run!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📍 Region: $REGION"
echo "💾 Memory: 2Gi | CPU: 2"
echo "📊 Auto-scaling: 0-100 instances"
echo "=========================================================="
echo "🎯 Next steps:"
echo "1. Test the deployment: curl $SERVICE_URL/api/health"
echo "2. Set GEMINI_API_KEY secret: gcloud secrets create GEMINI_API_KEY --replication-policy automatic"
echo "3. Monitor logs: gcloud logs tail /projects/$PROJECT_ID/services/$SERVICE_NAME"
echo "=========================================================="
