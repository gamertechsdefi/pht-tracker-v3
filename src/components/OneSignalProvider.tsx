"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { toast } from "react-hot-toast";

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initOneSignal = async () => {
            if (typeof window !== "undefined") {
                try {
                    console.log("OneSignal: Initializing...");
                    await OneSignal.init({
                        appId: '9ad13f4d-03af-4407-b965-fe9378f378cd',
                        // setInitialized: true,
                        serviceWorkerParam: {
                            scope: "/onesignal"
                        },
                        slidedown: {
                            enabled: true,
                            prompt: {
                                type: "push",
                            },
                            delay: {
                                pageViews: 1,
                                timeDelay: 5,
                            },
                            autoPrompt: true,
                            text: {
                                actionMessage: "Allow notifications to get price alerts and new listings early",
                                acceptButton: "Allow",
                                cancelButton: "No Thanks",
                            },
                        },
                        serviceWorkerPath: "/onesignal/OneSignalSDKWorker.js",
                        allowLocalhostAsSecureOrigin: true,
                    });
                    console.log("OneSignal: Initialized successfully");

                    // Check for permission and show toast if not granted
                    const permission = OneSignal.Notifications.permission;
                    if (!permission) {
                        toast((t) => (
                            <div className="flex flex-col gap-2">
                                <span className="font-medium text-neutral-900">
                                    Get price alerts and new listings instantly!
                                </span>
                                <button
                                    onClick={() => {
                                        OneSignal.Slidedown.promptPush();
                                        toast.dismiss(t.id);
                                    }}
                                    className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors"
                                >
                                    Enable Notifications
                                </button>
                            </div>
                        ), {
                            duration: 10000,
                            position: "bottom-right",
                            id: "notification-prompt",
                        });
                    }
                } catch (err) {
                    console.error("OneSignal: Init error:", err);
                }
            }
        };

        initOneSignal();
    }, []);

    return <>{children}</>;
}
