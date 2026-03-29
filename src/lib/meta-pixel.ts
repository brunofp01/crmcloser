/**
 * Meta Pixel (Facebook Pixel) Utility
 * Helps firing standard and custom events from React components.
 */

declare global {
  interface Window {
    fbq: any;
  }
}

export const trackPixelEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (params) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
    console.log(`[Meta Pixel] Event tracked: ${eventName}`, params || '');
  }
};

export const MetaEvents = {
  PAGE_VIEW: 'PageView',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  VIEW_CONTENT: 'ViewContent',
};
