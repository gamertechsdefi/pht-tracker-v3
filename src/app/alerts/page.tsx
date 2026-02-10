'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { FaBell } from 'react-icons/fa';

interface AlertConfig {
    id: string;
    token: {
        contract: string;
        chain: string;
        symbol: string;
        name: string;
        logo: string;
    };
    enabled: boolean;
    type: 'price' | 'percentage';
    frequency: 'hourly' | 'daily';
    targetPrice?: number;
    percentageChange?: number;
    createdAt: string;
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load alerts from localStorage
        const loadAlerts = () => {
            try {
                const savedAlerts = localStorage.getItem('priceAlerts');
                if (savedAlerts) {
                    setAlerts(JSON.parse(savedAlerts));
                }
            } catch (error) {
                console.error('Failed to load alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAlerts();
    }, []);

    const toggleAlert = (alertId: string) => {
        const updatedAlerts = alerts.map((alert) =>
            alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
        );
        setAlerts(updatedAlerts);
        localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
    };

    const deleteAlert = (alertId: string) => {
        const updatedAlerts = alerts.filter((alert) => alert.id !== alertId);
        setAlerts(updatedAlerts);
        localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
    };

    const getAlertDescription = (alert: AlertConfig): string => {
        if (alert.type === 'percentage') {
            return `Alert when price changes by ±${alert.percentageChange}%`;
        } else {
            return `Alert when price reaches $${alert.targetPrice}`;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 px-8 md:px-16 mt-8 mb-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Price Alerts
                        </h1>
                    </div>

                    {/* Alerts List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div
                                className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                                role="status"
                            >
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="bg-neutral-900 rounded-xl p-8 text-center">
                            <FaBell className="text-5xl text-neutral-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">
                                No alerts configured
                            </h2>
                            <p className="text-neutral-400 mb-6">
                                Visit a token page and click "Set Alert" to create your first price alert
                            </p>
                            <a
                                href="/"
                                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all"
                            >
                                Browse Tokens
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className=" rounded-xl p-4 md:p-6 border-2 border-orange-600 hover:border-neutral-700 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Token Logo */}
                                        <img
                                            src={alert.token.logo}
                                            alt={`${alert.token.symbol} logo`}
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-contain flex-shrink-0"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/file.svg';
                                            }}
                                        />

                                        {/* Alert Details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Token Name & Symbol */}
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg md:text-xl font-bold text-white">
                                                    {alert.token.name}
                                                </h3>
                                                <p className="text-lg md:text-xl font-bold">
                                                    {alert.token.symbol.toUpperCase()}
                                                </p>
                                            </div>

                                            {/* Alert Type & Details */}
                                            <div className="space-y-1 mb-3">
                                                {/* <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="px-3 py-1 bg-neutral-800 text-white text-sm rounded-full">
                                                        {alert.type === 'percentage' ? 'Percentage' : 'Price Target'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-neutral-800 text-white text-sm rounded-full">
                                                        {alert.frequency === 'hourly' ? 'Hourly' : 'Daily'}
                                                    </span>
                                                </div> */}
                                                <p className="text-sm text-neutral-300">
                                                    {getAlertDescription(alert)}
                                                </p>
                                            </div>

                                            {/* Action Buttons - Mobile */}
                                            <div className="flex gap-2 md:hidden items-center">
                                                <button
                                                    onClick={() => toggleAlert(alert.id)}
                                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${alert.enabled ? 'bg-orange-500' : 'bg-neutral-500'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${alert.enabled ? 'translate-x-7' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                <span className="text-sm text-neutral-400 md:block hidden">
                                                    {alert.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={() => deleteAlert(alert.id)}
                                                    className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons - Desktop */}
                                        <div className="hidden md:flex gap-3 items-start">
                                            <span className="text-sm text-white mt-2">
                                                {alert.enabled ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={() => toggleAlert(alert.id)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${alert.enabled ? 'bg-orange-500' : 'bg-orange-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${alert.enabled ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <button
                                                onClick={() => deleteAlert(alert.id)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
