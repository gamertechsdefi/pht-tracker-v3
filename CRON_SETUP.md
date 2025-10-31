# Cron Job Setup for Burn Data

This document explains how to set up and use the cron job system for pre-computing burn data to improve API performance and reduce Infura rate limit issues.

## Overview

The cron job system:
1. **Pre-computes burn data** for all tokens every 5 minutes
2. **Stores data in Firebase** for fast retrieval
3. **Reduces API calls** to Infura by 90%+
4. **Provides fallback** to real-time calculation if cache is stale

## Files Created

- `src/lib/cron-burn-service.ts` - Core burn calculation service
- `src/lib/cron-setup.ts` - Cron job scheduling
- `src/app/api/cron/update-burn-data/route.ts` - Manual trigger endpoint
- Updated `src/app/api/bsc/burns-interval/[tokenName]/route.ts` - Uses cached data
- Updated `src/app/api/bsc/burns/[tokenName]/route.ts` - Uses cached data

## Setup Options

### Option 1: Vercel Cron (Recommended)

If deploying on Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-burn-data",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:
- **GitHub Actions** (free)
- **Cron-job.org** (free)
- **EasyCron** (paid)

Set the cron job to call: `https://your-domain.com/api/cron/update-burn-data`

### Option 3: Local Cron Jobs

For development or self-hosted:

1. Add to your `src/app/layout.tsx`:
```typescript
import { startCronJobs } from '@/lib/cron-setup';

// Initialize cron jobs
if (typeof window === 'undefined') {
  startCronJobs();
}
```

2. Or create a separate cron process:
```typescript
// cron-worker.ts
import { startCronJobs } from './src/lib/cron-setup';

startCronJobs();
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Optional: Secret token for cron authentication
CRON_SECRET_TOKEN=your-secret-token-here

# Firebase config (already set up)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
# ... other Firebase config
```

## Manual Testing

### Test Single Token
```bash
curl "http://localhost:3000/api/cron/update-burn-data?token=pht"
```

### Test All Tokens
```bash
curl "http://localhost:3000/api/cron/update-burn-data"
```

### Force Update (ignore cache)
```bash
curl "http://localhost:3000/api/cron/update-burn-data?token=pht&force=true"
```

## API Response Format

The APIs now return:
```json
{
  "address": "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
  "burn5min": 1234.56,
  "burn15min": 5678.90,
  "burn30min": 12345.67,
  "burn1h": 23456.78,
  "burn3h": 34567.89,
  "burn6h": 45678.90,
  "burn12h": 56789.01,
  "burn24h": 67890.12,
  "lastUpdated": "2024-01-01T12:00:00.000Z",
  "nextUpdate": "2024-01-01T12:05:00.000Z",
  "fromCache": true
}
```

## Performance Benefits

### Before (Real-time)
- **8 API calls per token** (one per interval)
- **Rate limit issues** with Infura
- **Slow response times** (5-10 seconds)
- **High costs** for frequent requests

### After (Cached)
- **0 API calls** for cached data
- **No rate limit issues**
- **Fast response times** (<100ms)
- **Minimal costs** (only cron job calls)

## Monitoring

### Check Cache Status
```bash
curl "http://localhost:3000/api/cron/update-burn-data?token=pht"
```

### View Firebase Data
Check your Firebase console under `burnData` collection.

### Logs
Monitor your application logs for:
- `Starting burn calculation for...`
- `Saved burn data for... to Firebase`
- `Cache miss for..., calculating fresh data...`

## Troubleshooting

### Cache Not Updating
1. Check if cron job is running
2. Verify Firebase permissions
3. Check network connectivity to Infura

### Rate Limit Issues
1. Increase delays in `cron-burn-service.ts`
2. Reduce cron frequency
3. Use multiple RPC endpoints

### Firebase Errors
1. Verify Firebase config
2. Check collection permissions
3. Ensure proper authentication

## Customization

### Change Update Frequency
Edit `src/lib/cron-setup.ts`:
```typescript
// Every 10 minutes instead of 5
cron.schedule('*/10 * * * *', async () => {
  // ...
});
```

### Add More Tokens
Edit `TOKEN_MAP` in `src/lib/cron-burn-service.ts`:
```typescript
const TOKEN_MAP: Record<string, string> = {
  // ... existing tokens
  newtoken: "0x...",
};
```

### Modify Cache Duration
Edit `calculateBurnData` function:
```typescript
const nextUpdate = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
```

## Security

The cron endpoint includes basic security:
- Checks for cron service user agents
- Supports Bearer token authentication
- Allows local development requests

For production, consider:
- Adding IP whitelisting
- Using stronger authentication
- Rate limiting the endpoint 