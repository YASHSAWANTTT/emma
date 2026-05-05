export type DemoVideoRender =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string };

/**
 * Map a public demo URL to an iframe embed or a direct <video> source.
 */
export function resolveDemoVideoEmbed(rawUrl: string): DemoVideoRender | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
      }
      if (u.pathname.startsWith("/embed/")) {
        return { kind: "iframe", src: trimmed };
      }
    }

    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }

    if (u.hostname.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[0] === "video" ? parts[1] : parts[0];
      if (id && /^\d+$/.test(id)) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
      }
    }
  } catch {
    /* not a valid URL — may still be a relative path */
  }

  return { kind: "video", src: trimmed };
}
