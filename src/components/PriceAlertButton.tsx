'use client';

import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import OneSignal from 'react-onesignal';

interface Token {
    contract: string;
    chain: string;
    symbol: string;
    name: string;
    logo: string;
}

interface PriceAlertButtonProps {
    token: Token;
    className?: string;
}

type AlertType = 'price' | 'percentage';
type AlertFrequency = 'hourly' | 'daily';

interface AlertConfig {
    type: AlertType;
    frequency: AlertFrequency;
    targetPrice?: number;
    percentageChange?: number;
}

export default function PriceAlertButton({
    token,
    className = '',
}: PriceAlertButtonProps) {
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [showModal, setShowModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        type: 'percentage',
        frequency: 'daily',
        percentageChange: 10,
    });

    // Fetch current price
    useEffect(() => {
        async function fetchPrice() {
            try {
                const response = await fetch(`/api/${token.chain}/token-price/${token.contract}`);
                if (response.ok) {
                    const data = await response.json();
                    setCurrentPrice(parseFloat(data.price) || 0);
                }
            } catch (error) {
                console.error('Failed to fetch price:', error);
            }
        }
        if (token.contract && token.chain) {
            fetchPrice();
        }
    }, [token.contract, token.chain]);

    const handleToggleAlert = () => {
        setShowModal(true);
    };

    const handleSaveAlert = async () => {
        // Check if OneSignal is ready
        if (typeof window !== 'undefined') {
            try {
                const isPermissionGranted = OneSignal.Notifications?.permission;

                if (isPermissionGranted === undefined) {
                    alert('Notifications are still loading. Please wait a second and try again.');
                    return;
                }

                if (!isPermissionGranted) {
                    // Trigger slidedown
                    await OneSignal.Slidedown.promptPush();

                    // Explain to user
                    alert('Notification permission is required to receive price alerts. Please "Allow" notifications and then click "Save Alert" again.');
                    return;
                }
            } catch (error) {
                console.error('Error checking OneSignal permission:', error);
                alert('Notification system error. Please refresh the page.');
                return;
            }
        }

        const newAlert = {
            id: `${token.contract}-${token.chain}-${Date.now()}`,
            token: {
                contract: token.contract,
                chain: token.chain,
                symbol: token.symbol,
                name: token.name,
                logo: token.logo,
            },
            enabled: true,
            type: alertConfig.type,
            frequency: alertConfig.frequency,
            targetPrice: alertConfig.targetPrice,
            percentageChange: alertConfig.percentageChange,
            createdAt: new Date().toISOString(),
        };

        try {
            const savedAlerts = localStorage.getItem('priceAlerts');
            let alerts = savedAlerts ? JSON.parse(savedAlerts) : [];

            // Add new alert (no longer removing existing ones)
            alerts.push(newAlert);
            localStorage.setItem('priceAlerts', JSON.stringify(alerts));

            // Reset form to default state
            setAlertConfig({
                type: 'percentage',
                frequency: 'daily',
                percentageChange: 10,
            });
            setShowModal(false);

            console.log('Alert saved:', newAlert);
        } catch (error) {
            console.error('Failed to save alert:', error);
            alert('Failed to save alert. Please try again.');
        }
    };

    const handleCancelAlert = () => {
        setShowModal(false);
    };

    return (
        <>
            {/* Alert Button */}
            <button
                onClick={handleToggleAlert}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-neutral-700 text-white hover:bg-neutral-600 ${className}`}
            >
                <FaBell className="text-lg" />
                <span className='hidden md:block'>Set Alert</span>
            </button>

            {/* Configuration Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Set Price Alert for {token.symbol.toUpperCase()}
                        </h2>

                        <div className="space-y-4">
                            {/* Current Price Display */}
                            <div className="bg-neutral-700 p-3 rounded-lg">
                                <p className="text-neutral-400 text-sm">Current Price</p>
                                <p className="text-white text-xl font-bold">
                                    ${currentPrice.toFixed(8)}
                                </p>
                            </div>

                            {/* Alert Type Selection */}
                            <div>
                                <label className="block text-white font-medium mb-2">
                                    Alert Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() =>
                                            setAlertConfig({ ...alertConfig, type: 'percentage' })
                                        }
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${alertConfig.type === 'percentage'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-neutral-700 text-white hover:bg-neutral-600'
                                            }`}
                                    >
                                        Percentage
                                    </button>
                                    <button
                                        onClick={() =>
                                            setAlertConfig({ ...alertConfig, type: 'price' })
                                        }
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${alertConfig.type === 'price'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-neutral-700 text-white hover:bg-neutral-600'
                                            }`}
                                    >
                                        Price
                                    </button>
                                </div>
                            </div>

                            {/* Alert Value Input */}
                            {alertConfig.type === 'percentage' ? (
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Percentage Change (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={alertConfig.percentageChange || ''}
                                        onChange={(e) =>
                                            setAlertConfig({
                                                ...alertConfig,
                                                percentageChange: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="e.g., 10"
                                        className="w-full px-4 py-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <p className="text-neutral-400 text-sm mt-1">
                                        Alert when price changes by ±{alertConfig.percentageChange || 0}%
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Target Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={alertConfig.targetPrice || ''}
                                        onChange={(e) =>
                                            setAlertConfig({
                                                ...alertConfig,
                                                targetPrice: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="e.g., 0.00001234"
                                        step="0.00000001"
                                        className="w-full px-4 py-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <p className="text-neutral-400 text-sm mt-1">
                                        Alert when price reaches ${alertConfig.targetPrice || 0}
                                    </p>
                                </div>
                            )}

                            {/* Frequency Selection */}
                            <div>
                                <label className="block text-white font-medium mb-2">
                                    Alert Frequency
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() =>
                                            setAlertConfig({ ...alertConfig, frequency: 'hourly' })
                                        }
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${alertConfig.frequency === 'hourly'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-neutral-700 text-white hover:bg-neutral-600'
                                            }`}
                                    >
                                        Hourly
                                    </button>
                                    <button
                                        onClick={() =>
                                            setAlertConfig({ ...alertConfig, frequency: 'daily' })
                                        }
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${alertConfig.frequency === 'daily'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-neutral-700 text-white hover:bg-neutral-600'
                                            }`}
                                    >
                                        Daily
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCancelAlert}
                                className="flex-1 px-4 py-2 bg-neutral-700 text-white rounded-lg font-medium hover:bg-neutral-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAlert}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all"
                            >
                                Save Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
