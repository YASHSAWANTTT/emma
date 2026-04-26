type PublicZoomConfig = {
  clientId: string;
};

type ServerZoomConfig = {
  clientId: string;
  clientSecret: string;
  secretToken: string;
};

export function getPublicZoomConfig(): PublicZoomConfig {
  return {
    clientId: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID ?? ""
  };
}

export function getServerZoomConfig(): ServerZoomConfig {
  return {
    clientId: process.env.ZOOM_CLIENT_ID ?? "",
    clientSecret: process.env.ZOOM_CLIENT_SECRET ?? "",
    secretToken: process.env.ZOOM_SECRET_TOKEN ?? ""
  };
}
