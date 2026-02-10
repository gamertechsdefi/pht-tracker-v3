# Push Notification Usage Examples

## API Endpoint

The notification API is available at `/api/notifications/send` and accepts POST requests with different notification types.

### Price Alert Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "price_alert",
    "tokenSymbol": "PHT",
    "tokenAddress": "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
    "chain": "bsc",
    "currentPrice": 0.00000123,
    "targetPrice": 0.00000100,
    "percentageChange": 23.5
  }'
```

### New Listing Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "new_listing",
    "tokenSymbol": "NEWTOKEN",
    "tokenName": "New Token",
    "tokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "chain": "bsc",
    "initialPrice": 0.00001234
  }'
```

### Custom Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "title": "FireScreener Update",
    "message": "Check out our new features!",
    "url": "https://firescreener.com",
    "icon": "/favicon.ico"
  }'
```

## Using in Code

### From Server-Side Code

```typescript
import { sendPriceAlert, sendNewListing } from '@/lib/onesignal';

// Send a price alert
await sendPriceAlert({
  tokenSymbol: 'PHT',
  tokenAddress: '0x885c99a787BE6b41cbf964174C771A9f7ec48e04',
  chain: 'bsc',
  currentPrice: 0.00000123,
  targetPrice: 0.00000100,
  percentageChange: 23.5
});

// Send a new listing notification
await sendNewListing({
  tokenSymbol: 'NEWTOKEN',
  tokenName: 'New Token',
  tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
  chain: 'bsc',
  initialPrice: 0.00001234
});
```

### From API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendPriceAlert } from '@/lib/onesignal';

export async function POST(req: NextRequest) {
  // Your logic to detect price changes
  const result = await sendPriceAlert({
    tokenSymbol: 'PHT',
    tokenAddress: '0x885c99a787BE6b41cbf964174C771A9f7ec48e04',
    chain: 'bsc',
    currentPrice: 0.00000123,
    targetPrice: 0.00000100,
    percentageChange: 23.5
  });
  
  return NextResponse.json(result);
}
```

## Integration Points

### 1. Price Monitoring (Cron Job or Real-time)

You can integrate price alerts into your existing price monitoring system:

```typescript
// In a cron job or real-time price monitor
if (priceChangePercentage > threshold) {
  await sendPriceAlert({
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    chain: token.chain,
    currentPrice: currentPrice,
    targetPrice: previousPrice,
    percentageChange: priceChangePercentage
  });
}
```

### 2. New Token Detection

When a new token is added to your system:

```typescript
// When adding a new token to database
await sendNewListing({
  tokenSymbol: newToken.symbol,
  tokenName: newToken.name,
  tokenAddress: newToken.address,
  chain: newToken.chain,
  initialPrice: newToken.price
});
```

## Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3000 in your browser**

3. **Allow notification permission when prompted**

4. **Send a test notification using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/send \
     -H "Content-Type: application/json" \
     -d '{
       "type": "custom",
       "title": "Test Notification",
       "message": "This is a test from FireScreener!",
       "url": "https://firescreener.com"
     }'
   ```

5. **You should receive a browser notification!**

## OneSignal Dashboard

View notification analytics and manage settings at:
https://dashboard.onesignal.com/apps/9ad13f4d-03af-4407-b965-fe9378f378cd
