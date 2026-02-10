import { NextRequest, NextResponse } from 'next/server';
import { sendPriceAlert, sendNewListing, sendNotificationToAll, type PriceAlertPayload, type NewListingPayload, type NotificationPayload } from '@/lib/onesignal';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, ...data } = body;

        if (!type) {
            return NextResponse.json(
                { success: false, error: 'Notification type is required' },
                { status: 400 }
            );
        }

        let result;

        switch (type) {
            case 'price_alert': {
                const alertData = data as PriceAlertPayload;

                // Validate required fields
                if (!alertData.tokenSymbol || !alertData.tokenAddress || !alertData.chain ||
                    alertData.currentPrice === undefined || alertData.targetPrice === undefined ||
                    alertData.percentageChange === undefined) {
                    return NextResponse.json(
                        { success: false, error: 'Missing required fields for price alert' },
                        { status: 400 }
                    );
                }

                result = await sendPriceAlert(alertData);
                break;
            }

            case 'new_listing': {
                const listingData = data as NewListingPayload;

                // Validate required fields
                if (!listingData.tokenSymbol || !listingData.tokenName ||
                    !listingData.tokenAddress || !listingData.chain) {
                    return NextResponse.json(
                        { success: false, error: 'Missing required fields for new listing' },
                        { status: 400 }
                    );
                }

                result = await sendNewListing(listingData);
                break;
            }

            case 'custom': {
                const customData = data as NotificationPayload;

                // Validate required fields
                if (!customData.title || !customData.message) {
                    return NextResponse.json(
                        { success: false, error: 'Title and message are required for custom notifications' },
                        { status: 400 }
                    );
                }

                result = await sendNotificationToAll(customData);
                break;
            }

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown notification type: ${type}` },
                    { status: 400 }
                );
        }

        if (result.success) {
            return NextResponse.json({
                success: true,
                id: result.id,
                message: 'Notification sent successfully'
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Notification API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send notification'
            },
            { status: 500 }
        );
    }
}
