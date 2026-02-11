"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

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
                            scope: "/"
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
                        serviceWorkerPath: "/OneSignalSDKWorker.js",
                        allowLocalhostAsSecureOrigin: true,
                    });
                    console.log("OneSignal: Initialized successfully");
                } catch (err) {
                    console.error("OneSignal: Init error:", err);
                }
            }
        };

        initOneSignal();
    }, []);

    return <>{children}</>;
}
