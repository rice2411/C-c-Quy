import type { ApiRequest, ApiResponse } from '../../types/api';

const SERPAPI_BASE = 'https://serpapi.com/search.json';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const apiKey = (body.apiKey as string) || process.env.SERPAPI_API_KEY ;
    const q = (body.q as string)?.trim();
    const ll = (body.ll as string) || undefined;
    const type = (body.type as string) || 'search';
    const hl = (body.hl as string) || 'vi';
    const start = body.start != null ? Number(body.start) : undefined;

    if (!apiKey) return res.status(400).json({ error: 'Thiếu SerpApi API key' });
    if (!q) return res.status(400).json({ error: 'Thiếu query (body.q)' });

    const params = new URLSearchParams({ engine: 'google_maps', api_key: apiKey, q, type, hl });
    if (ll) params.set('ll', ll);
    if (start != null && !isNaN(start)) params.set('start', String(start));

    const resp: any = await (globalThis as any).fetch(`${SERPAPI_BASE}?${params.toString()}`);
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); }
    catch { return res.status(resp.status).json({ error: 'Non-JSON response', body: text.slice(0, 500) }); }
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || `SerpApi ${resp.status}`, raw: data });
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[serpapi/maps] error:', error?.message || error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
