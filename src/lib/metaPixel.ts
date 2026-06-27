type QueuedFacebookPixel = ((...args: unknown[]) => void) & {
  loaded: boolean;
  queue: unknown[][];
  version: string;
};

const scheduleWhenIdle = (callback: () => void) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback);
    return;
  }

  window.setTimeout(callback, 2_500);
};

/** Load Meta Pixel only when a valid build-time ID is configured. */
export const initMetaPixel = () => {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
  if (!pixelId || typeof window === "undefined" || window.fbq) return;

  scheduleWhenIdle(() => {
    if (window.fbq) return;

    const queue: unknown[][] = [];
    const fbq = ((...args: unknown[]) => queue.push(args)) as QueuedFacebookPixel;
    fbq.loaded = true;
    fbq.queue = queue;
    fbq.version = "2.0";
    window.fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    fbq("init", pixelId);
    fbq("track", "PageView");
  });
};
