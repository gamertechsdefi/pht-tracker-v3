"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider() {
  useEffect(() => {
    OneSignal.init({
      appId: "9ad13f4d-03af-4407-b965-fe9378f378cd",
      setInitialized: true,
      serviceWorkerParam: {
        scope: "/" 
      },
      serviceWorkerPath: "OneSignalSDKWorker.js",  
      // safari_web_id: "web.onesignal.auto.48d27e8c-5bf0-4f8f-a083-e09c208eb2cb",
      notifyButton: {
        enable: true,
      } as any,
      allowLocalhostAsSecureOrigin: true,
    });
  }, []);

  // const [initialized, setInitialized] = useState(false);
  // OneSignal.init({ appId: '9ad13f4d-03af-4407-b965-fe9378f378cd' }).then(() => {
  //   setInitialized(true);
  //   OneSignal.Slidedown.promptPush();
  // });

  return null;
}