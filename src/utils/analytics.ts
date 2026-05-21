function getVisitorId(): string {
  let id = localStorage.getItem("hn_visitor_id");
  if (!id) {
    id = "v_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("hn_visitor_id", id);
  }
  return id;
}

function trackEvent(type: "pageview" | "productview", data?: { path?: string; productId?: string; category?: string }) {
  try {
    const payload: any = { visitorId: getVisitorId(), type, timestamp: new Date().toISOString() };
    if (data?.path) payload.path = data.path;
    if (data?.productId) payload.productId = data.productId;
    if (data?.category) payload.category = data.category;
    payload.path = payload.path || window.location.pathname;
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
  } catch {}
}

export function trackPageView(path?: string) {
  trackEvent("pageview", { path: path || window.location.pathname });
}

export function trackProductView(productId: string, category: string) {
  trackEvent("productview", { productId, category, path: window.location.pathname });
}

export async function fetchRecommendations(): Promise<any[]> {
  try {
    const visitorId = getVisitorId();
    const res = await fetch(`/api/analytics/recommendations?visitorId=${encodeURIComponent(visitorId)}`);
    if (res.ok) return await res.json();
    return [];
  } catch { return []; }
}

export { getVisitorId };
