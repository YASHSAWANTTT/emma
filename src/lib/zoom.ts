"use client";

import zoomSdk from "@zoom/appssdk";
import { getPublicZoomConfig } from "@/lib/env";

type ZoomInitState = {
  isReady: boolean;
  context: string;
  isConfigured: boolean;
};

let initPromise: Promise<ZoomInitState> | null = null;

export async function initializeZoomSdk(): Promise<ZoomInitState> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const publicZoomConfig = getPublicZoomConfig();
    const isConfigured = Boolean(publicZoomConfig.clientId);

    try {
      await zoomSdk.config({
        capabilities: ["getRunningContext"],
        version: "0.16"
      });
      const contextResult = await zoomSdk.getRunningContext();

      return {
        isReady: true,
        context: contextResult?.context ?? "unknown",
        isConfigured
      };
    } catch {
      return {
        isReady: false,
        context: "browser",
        isConfigured
      };
    }
  })();

  return initPromise;
}
