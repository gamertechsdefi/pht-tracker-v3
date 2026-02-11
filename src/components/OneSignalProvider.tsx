"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            OneSignal.init({
                appId: '9ad13f4d-03af-4407-b965-fe9378f378cd',
                setInitialized: true,
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
            }).catch(err => {
                console.error("OneSignal init error:", err);
            });
        }
    }, []);

    return <>{children}</>;
}
