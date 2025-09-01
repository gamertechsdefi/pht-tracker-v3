import React from 'react';
import { TimeRange, AnalyticsResponse } from '@/types/analytics';

const timeRangeLabels: Record<TimeRange, string> = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days'
};

interface DataCardProps {
  title: string;
  value: number | undefined;
  loading: boolean;
  error: string | null;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, loading, error }) => (
  <div className="bg-neutral-800 p-4 rounded-lg">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {loading ? (
      <div className="text-white">Loading...</div>
    ) : error ? (
      <div className="text-red-500">{error}</div>
    ) : (
      <p className="text-3xl font-bold text-white">{value?.toLocaleString()}</p>
    )}
  </div>
);

interface AnalyticsDashboardProps {
  analytics: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  loading,
  error,
  timeRange,
  onTimeRangeChange,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="bg-neutral-800 border border-orange-500 text-white rounded-lg px-4 py-2"
        >
          {Object.entries(timeRangeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DataCard
          title="Pageviews"
          value={analytics?.pageviews}
          loading={loading}
          error={error}
        />
        <DataCard
          title="Visitors"
          value={analytics?.visitors}
          loading={loading}
          error={error}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
          <table className="w-full text-white">
            <thead>
              <tr>
                <th className="text-left">Page</th>
                <th className="text-right">Pageviews</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.pages.slice(0, 10).map((page, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="py-2">{page.page}</td>
                  <td className="text-right">{page.pageviews.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
          <table className="w-full text-white">
            <thead>
              <tr>
                <th className="text-left">Referrer</th>
                <th className="text-right">Pageviews</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.referrers.slice(0, 10).map((referrer, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="py-2">{referrer.referrer || 'Direct'}</td>
                  <td className="text-right">{referrer.pageviews.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {analytics && (
        <div className="text-sm text-gray-400 text-center mt-6">
          Data from {new Date(analytics.start).toLocaleDateString()} to {new Date(analytics.end).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
