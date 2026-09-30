param (
    [string]$ProjectId = "your-gcp-project-id",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "jansetu-ai"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying JanSetu AI to Google Cloud Run" -ForegroundColor Green
Write-Host "Project: $ProjectId | Region: $Region" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Enable required APIs
Write-Host "📋 Enabling required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build and submit container image with caching
Write-Host "🔨 Building container image..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$ProjectId/$ServiceName --timeout 20m --cache

# Deploy to Cloud Run with optimized configuration
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName --image gcr.io/$ProjectId/$ServiceName --platform managed --region $Region --allow-unauthenticated --memory 2Gi --cpu 2 --min-instances 0 --max-instances 100 --timeout 300 --concurrency 80 --set-env-vars GEMINI_MODEL=gemini-2.5-flash,NODE_ENV=production --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest --ingress all --network-tags jansetu-public --labels app=jansetu-ai,environment=production,version=2.5

# Configure IAM policy for public access
Write-Host "🔐 Configuring IAM policy..." -ForegroundColor Yellow
gcloud run services add-iam-policy-binding $ServiceName --region $Region --member allUsers --role roles/run.invoker

# Get service URL
$ServiceUrl = gcloud run services describe $ServiceName --region $Region --format 'value(status.url)'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ JanSetu AI deployed successfully on Google Cloud Run!" -ForegroundColor Green
Write-Host "🌐 Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "📍 Region: $Region" -ForegroundColor Yellow
Write-Host "💾 Memory: 2Gi | CPU: 2" -ForegroundColor Yellow
Write-Host "📊 Auto-scaling: 0-100 instances" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎯 Next steps:" -ForegroundColor Green
Write-Host "1. Test the deployment: curl $ServiceUrl/api/health" -ForegroundColor White
Write-Host "2. Set GEMINI_API_KEY secret: gcloud secrets create GEMINI_API_KEY --replication-policy automatic" -ForegroundColor White
Write-Host "3. Monitor logs: gcloud logs tail /projects/$ProjectId/services/$ServiceName" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
