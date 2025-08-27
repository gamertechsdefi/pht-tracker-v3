// pages/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface AnalyticsData {
  pageviews: number;
  visitors: number;
  pages: { page: string; pageviews: number }[];
  referrers: { referrer: string; pageviews: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return (
    <div className="container mx-auto">
      <Header />
      <div className="px-4 pt-8">
        <h1 className="text-3xl font-bold text-white mb-4">Analytics</h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-white">Loading analytics...</div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-2">Pageviews</h2>
              <p className="text-3xl text-white">{analytics.pageviews}</p>
            </div>
            <div className="bg-neutral-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-2">Visitors</h2>
              <p className="text-3xl text-white">{analytics.visitors}</p>
            </div>
            <div className="bg-neutral-800 p-4 rounded-lg md:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-2">Top Pages</h2>
              <ul>
                {analytics.pages.map((page) => (
                  <li key={page.page} className="text-white flex justify-between">
                    <span>{page.page}</span>
                    <span>{page.pageviews}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-800 p-4 rounded-lg md:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-2">Top Referrers</h2>
              <ul>
                {analytics.referrers.map((referrer) => (
                  <li key={referrer.referrer} className="text-white flex justify-between">
                    <span>{referrer.referrer}</span>
                    <span>{referrer.pageviews}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-white">No analytics data available</div>
        )}
      </div>
    </div>
  );
}