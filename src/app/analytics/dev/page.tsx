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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [visitorsOnly, setVisitorsOnly] = useState<VisitorsData | null>(null);
  const [pageviewsOnly, setPageviewsOnly] = useState<PageviewsData | null>(null);
  const [pagesOnly, setPagesOnly] = useState<PagesData | null>(null);
  const [referrersOnly, setReferrersOnly] = useState<ReferrersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [pageviewsLoading, setPageviewsLoading] = useState(true);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [referrersLoading, setReferrersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorsError, setVisitorsError] = useState<string | null>(null);
  const [pageviewsError, setPageviewsError] = useState<string | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [referrersError, setReferrersError] = useState<string | null>(null);

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

    async function fetchVisitorsOnly() {
      try {
        const response = await fetch('/api/analytics/visitors');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch visitors data');
        }
        const data = await response.json();
        setVisitorsOnly(data);
      } catch (err: any) {
        setVisitorsError(err.message);
      } finally {
        setVisitorsLoading(false);
      }
    }

    async function fetchPageviewsOnly() {
      try {
        const response = await fetch('/api/stats/views');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch pageviews data');
        }
        const data = await response.json();
        setPageviewsOnly(data);
      } catch (err: any) {
        setPageviewsError(err.message);
      } finally {
        setPageviewsLoading(false);
      }
    }

    async function fetchPagesOnly() {
      try {
        const response = await fetch('/api/stats/pages');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch pages data');
        }
        const data = await response.json();
        setPagesOnly(data);
      } catch (err: any) {
        setPagesError(err.message);
      } finally {
        setPagesLoading(false);
      }
    }

    async function fetchReferrersOnly() {
      try {
        const response = await fetch('/api/stats/referrers');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch referrers data');
        }
        const data = await response.json();
        setReferrersOnly(data);
      } catch (err: any) {
        setReferrersError(err.message);
      } finally {
        setReferrersLoading(false);
      }
    }

    fetchAnalytics();
    fetchVisitorsOnly();
    fetchPageviewsOnly();
    fetchPagesOnly();
    fetchReferrersOnly();
  }, []);

  return (
    <div className="container mx-auto">
      <Header />
      <div className="px-4 pt-8">
        <h1 className="text-3xl font-bold text-white mb-4">Analytics API Responses</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Raw JSON Responses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Full Analytics Response */}
            {/* <div className="bg-neutral-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2 font-mono">GET /api/analytics</p>
              {error && (
                <div className="bg-red-500 text-white p-2 rounded mb-2">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {loading ? (
                <div className="text-white">Loading...</div>
              ) : analytics ? (
                <div className="bg-neutral-800 p-3 rounded">
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {JSON.stringify(analytics, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
            </div> */}

            {/* Visitors Only */}
            <div className="bg-neutral-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2 font-mono">GET /api/stats/visitors</p>
              {visitorsError && (
                <div className="bg-red-500 text-white p-2 rounded mb-2">
                  <p className="text-sm">{visitorsError}</p>
                </div>
              )}
              {visitorsLoading ? (
                <div className="text-white">Loading...</div>
              ) : visitorsOnly ? (
                <div className="bg-neutral-800 p-3 rounded">
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {JSON.stringify(visitorsOnly, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
            </div>

            {/* Pageviews Only */}
            <div className="bg-neutral-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2 font-mono">GET /api/stats/views</p>
              {pageviewsError && (
                <div className="bg-red-500 text-white p-2 rounded mb-2">
                  <p className="text-sm">{pageviewsError}</p>
                </div>
              )}
              {pageviewsLoading ? (
                <div className="text-white">Loading...</div>
              ) : pageviewsOnly ? (
                <div className="bg-neutral-800 p-3 rounded">
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {JSON.stringify(pageviewsOnly, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
            </div>

            {/* Pages Only */}
            <div className="bg-neutral-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2 font-mono">GET /api/stats/pages</p>
              {pagesError && (
                <div className="bg-red-500 text-white p-2 rounded mb-2">
                  <p className="text-sm">{pagesError}</p>
                </div>
              )}
              {pagesLoading ? (
                <div className="text-white">Loading...</div>
              ) : pagesOnly ? (
                <div className="bg-neutral-800 p-3 rounded">
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {JSON.stringify(pagesOnly, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
            </div>

            {/* Referrers Only */}
            <div className="bg-neutral-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2 font-mono">GET /api/stats/referrers</p>
              {referrersError && (
                <div className="bg-red-500 text-white p-2 rounded mb-2">
                  <p className="text-sm">{referrersError}</p>
                </div>
              )}
              {referrersLoading ? (
                <div className="text-white">Loading...</div>
              ) : referrersOnly ? (
                <div className="bg-neutral-800 p-3 rounded">
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {JSON.stringify(referrersOnly, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}