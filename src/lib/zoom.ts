"use client";

import zoomSdk from "@zoom/appssdk";

type ZoomInitState = {
  isReady: boolean;
  context: string;
};

let initPromise: Promise<ZoomInitState> | null = null;

export async function initializeZoomSdk(): Promise<ZoomInitState> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await zoomSdk.config({
        capabilities: ["getRunningContext"],
        version: "0.16"
      });
      const contextResult = await zoomSdk.getRunningContext();

      return {
        isReady: true,
        context: contextResult?.context ?? "unknown"
      };
    } catch {
      return {
        isReady: false,
        context: "browser"
      };
    }
  })();

  return initPromise;
}
