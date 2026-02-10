# PriceAlertButton Component

## Overview

The `PriceAlertButton` component provides a user interface for setting up price alerts on tokens. Users can configure alerts based on price targets or percentage changes, with options for hourly or daily notifications.

## Features

- **Alert Type Options:**
  - **Percentage**: Alert when price changes by a specified percentage (±)
  - **Price**: Alert when price reaches a specific target value

- **Frequency Options:**
  - **Hourly**: Check and notify every hour
  - **Daily**: Check and notify once every 24 hours

- **Visual Feedback:**
  - Active alerts show a yellow bell icon
  - Inactive alerts show a gray bell slash icon
  - Modal interface for configuration

## Usage

```tsx
import PriceAlertButton from '@/components/PriceAlertButton';

<PriceAlertButton
  tokenSymbol="PHT"
  tokenAddress="0x885c99a787BE6b41cbf964174C771A9f7ec48e04"
  chain="bsc"
  currentPrice={0.00000123}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `tokenSymbol` | `string` | Token symbol (e.g., "PHT") |
| `tokenAddress` | `string` | Token contract address |
| `chain` | `string` | Blockchain chain (e.g., "bsc", "sol") |
| `currentPrice` | `number` | Current token price in USD |

## Component State

The component manages the following state:

```typescript
interface AlertConfig {
  enabled: boolean;           // Whether alert is active
  type: 'price' | 'percentage'; // Alert type
  frequency: 'hourly' | 'daily'; // Check frequency
  targetPrice?: number;       // Target price (for price alerts)
  percentageChange?: number;  // Percentage threshold (for % alerts)
}
```

## Integration Example

In a token detail page:

```tsx
import PriceAlertButton from '@/components/PriceAlertButton';

export default function TokenPage({ params }: { params: { chain: string; contractAddress: string } }) {
  const [tokenData, setTokenData] = useState(null);

  // ... fetch token data

  return (
    <div>
      <h1>{tokenData.symbol}</h1>
      <p>Price: ${tokenData.price}</p>
      
      <PriceAlertButton
        tokenSymbol={tokenData.symbol}
        tokenAddress={params.contractAddress}
        chain={params.chain}
        currentPrice={tokenData.price}
      />
    </div>
  );
}
```

## Next Steps (Backend Integration)

To make the alerts functional, you'll need to:

1. **Store Alert Configuration:**
   - Save to localStorage for client-side persistence
   - Or save to database/Supabase for cross-device sync

2. **Create Alert Monitoring System:**
   - Cron job or scheduled function to check prices
   - Compare current price against user's alert conditions
   - Trigger OneSignal notifications when conditions are met

3. **User Authentication (Optional):**
   - Link alerts to user accounts
   - Allow users to manage multiple alerts across devices

## Styling

The component uses Tailwind CSS with a dark theme:
- Gray backgrounds (`bg-gray-700`, `bg-gray-800`)
- Yellow accent color for active states (`bg-yellow-500`)
- Smooth transitions and hover effects
- Responsive modal design
