export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface AnalyticsParams {
    start?: string;
    end?: string;
    timeRange?: TimeRange;
}

export interface AnalyticsResponse {
    pageviews: number;
    visitors: number;
    pages: PageStat[];
    referrers: ReferrerStat[];
    timeRange: TimeRange;
    start: string;
    end: string;
}

export interface PageStat {
    page: string;
    pageviews: number;
}

export interface ReferrerStat {
    referrer: string;
    pageviews: number;
}

export function getTimeRangeDates(timeRange: TimeRange = '24h'): { start: string; end: string } {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
        case '7d':
            start.setDate(end.getDate() - 7);
            break;
        case '30d':
            start.setDate(end.getDate() - 30);
            break;
        case '90d':
            start.setDate(end.getDate() - 90);
            break;
        default: // 24h
            start.setDate(end.getDate() - 1);
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}
