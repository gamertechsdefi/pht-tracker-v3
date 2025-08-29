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

import AnalyticsDashboard from '@/components/AnalyticsDashboard';

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
      <AnalyticsDashboard
        visitorsOnly={visitorsOnly}
        pageviewsOnly={pageviewsOnly}
        pagesOnly={pagesOnly}
        referrersOnly={referrersOnly}
        visitorsLoading={visitorsLoading}
        pageviewsLoading={pageviewsLoading}
        pagesLoading={pagesLoading}
        referrersLoading={referrersLoading}
        visitorsError={visitorsError}
        pageviewsError={pageviewsError}
        pagesError={pagesError}
        referrersError={referrersError}
      />
    </div>
  );
}