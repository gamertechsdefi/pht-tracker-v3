/**
 * OneSignal Push Notification Service
 * Handles server-side notification sending via OneSignal API
 */

const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

export interface NotificationPayload {
    title: string;
    message: string;
    url?: string;
    icon?: string;
    image?: string;
    data?: Record<string, unknown>;
}

export interface PriceAlertPayload {
    tokenSymbol: string;
    tokenAddress: string;
    chain: string;
    currentPrice: number;
    targetPrice: number;
    percentageChange: number;
}

export interface NewListingPayload {
    tokenSymbol: string;
    tokenName: string;
    tokenAddress: string;
    chain: string;
    initialPrice?: number;
}

/**
 * Send a notification to all subscribed users
 */
export async function sendNotificationToAll(payload: NotificationPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
            throw new Error('OneSignal credentials not configured');
        }

        const response = await fetch(ONESIGNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ['All'],
                headings: { en: payload.title },
                contents: { en: payload.message },
                url: payload.url,
                chrome_web_icon: payload.icon,
                chrome_web_image: payload.image,
                data: payload.data,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('OneSignal API error:', result);
            return { success: false, error: result.errors?.[0] || 'Failed to send notification' };
        }

        console.log('Notification sent successfully:', result.id);
        return { success: true, id: result.id };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Send a price alert notification
 */
export async function sendPriceAlert(alert: PriceAlertPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    const direction = alert.percentageChange > 0 ? '📈' : '📉';
    const changeText = alert.percentageChange > 0 ? 'up' : 'down';

    return sendNotificationToAll({
        title: `${direction} ${alert.tokenSymbol} Price Alert`,
        message: `${alert.tokenSymbol} is ${changeText} ${Math.abs(alert.percentageChange).toFixed(2)}%! Current price: $${alert.currentPrice.toFixed(8)}`,
        url: `https://firescreener.com/${alert.chain}/${alert.tokenAddress}`,
        icon: '/favicon.ico',
        data: {
            type: 'price_alert',
            tokenSymbol: alert.tokenSymbol,
            tokenAddress: alert.tokenAddress,
            chain: alert.chain,
            currentPrice: alert.currentPrice,
            targetPrice: alert.targetPrice,
            percentageChange: alert.percentageChange,
        },
    });
}

/**
 * Send a new listing notification
 */
export async function sendNewListing(listing: NewListingPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    const priceText = listing.initialPrice ? ` at $${listing.initialPrice.toFixed(8)}` : '';

    return sendNotificationToAll({
        title: `🔥 New Token Listed: ${listing.tokenSymbol}`,
        message: `${listing.tokenName} (${listing.tokenSymbol}) is now available on ${listing.chain.toUpperCase()}${priceText}`,
        url: `https://firescreener.com/${listing.chain}/${listing.tokenAddress}`,
        icon: '/favicon.ico',
        data: {
            type: 'new_listing',
            tokenSymbol: listing.tokenSymbol,
            tokenName: listing.tokenName,
            tokenAddress: listing.tokenAddress,
            chain: listing.chain,
            initialPrice: listing.initialPrice,
        },
    });
}

/**
 * Send a notification to specific users by external user IDs
 */
export async function sendNotificationToUsers(
    userIds: string[],
    payload: NotificationPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
            throw new Error('OneSignal credentials not configured');
        }

        const response = await fetch(ONESIGNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: userIds,
                headings: { en: payload.title },
                contents: { en: payload.message },
                url: payload.url,
                chrome_web_icon: payload.icon,
                chrome_web_image: payload.image,
                data: payload.data,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('OneSignal API error:', result);
            return { success: false, error: result.errors?.[0] || 'Failed to send notification' };
        }

        console.log('Notification sent to users:', result.id);
        return { success: true, id: result.id };
    } catch (error) {
        console.error('Error sending notification to users:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
