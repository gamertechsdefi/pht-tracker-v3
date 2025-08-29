import React from 'react';

// interface AnalyticsData {
//   pageviews: number;
//   visitors: number;
//   pages: { page: string; pageviews: number }[];
//   referrers: { referrer: string; pageviews: number }[];
// }

interface VisitorsData {
  visitors: number;
}

interface PageviewsData {
  pageviews: number;
}

interface PagesData {
  pages: { page: string; pageviews: number }[];
}

interface ReferrersData {
  referrers: { referrer: string; pageviews: number }[];
}

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
  visitorsOnly: VisitorsData | null;
  pageviewsOnly: PageviewsData | null;
  pagesOnly: PagesData | null;
  referrersOnly: ReferrersData | null;
  visitorsLoading: boolean;
  pageviewsLoading: boolean;
  pagesLoading: boolean;
  referrersLoading: boolean;
  visitorsError: string | null;
  pageviewsError: string | null;
  pagesError: string | null;
  referrersError: string | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  visitorsOnly,
  pageviewsOnly,
  pagesOnly,
  referrersOnly,
  visitorsLoading,
  pageviewsLoading,
  pagesLoading,
  referrersLoading,
  visitorsError,
  pageviewsError,
  pagesError,
  referrersError,
}) => {
  return (
    <div className="px-4 pt-8">
      <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DataCard
          title="Pageviews"
          value={pageviewsOnly?.pageviews}
          loading={pageviewsLoading}
          error={pageviewsError}
        />
        <DataCard
          title="Visitors"
          value={visitorsOnly?.visitors}
          loading={visitorsLoading}
          error={visitorsError}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
          {pagesLoading ? (
            <div className="text-white">Loading...</div>
          ) : pagesError ? (
            <div className="text-red-500">{pagesError}</div>
          ) : (
            <table className="w-full text-white">
              <thead>
                <tr>
                  <th className="text-left">Page</th>
                  <th className="text-right">Pageviews</th>
                </tr>
              </thead>
              <tbody>
                {pagesOnly?.pages.map((page, index) => (
                  <tr key={index}>
                    <td>{page.page}</td>
                    <td className="text-right">{page.pageviews.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
          {referrersLoading ? (
            <div className="text-white">Loading...</div>
          ) : referrersError ? (
            <div className="text-red-500">{referrersError}</div>
          ) : (
            <table className="w-full text-white">
              <thead>
                <tr>
                  <th className="text-left">Referrer</th>
                  <th className="text-right">Pageviews</th>
                </tr>
              </thead>
              <tbody>
                {referrersOnly?.referrers.map((referrer, index) => (
                  <tr key={index}>
                    <td>{referrer.referrer}</td>
                    <td className="text-right">{referrer.pageviews.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
