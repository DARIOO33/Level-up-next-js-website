export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

export const metaPixelEnabled = META_PIXEL_ID.length > 0;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

type Content = { id: string; quantity: number; item_price: number };

type TrackPayload = {
  value: number;
  currency?: string;
  content_ids?: string[];
  contents?: Content[];
  content_type?: string;
  num_items?: number;
};

/** Safe wrapper — no-ops during SSR or when no pixel ID is configured. */
export function track(event: string, payload?: TrackPayload) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, payload);
}
