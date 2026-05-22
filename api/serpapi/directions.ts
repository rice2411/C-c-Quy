import type { ApiRequest, ApiResponse } from '../../types/api';

const SERPAPI_BASE = 'https://serpapi.com/search.json';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const apiKey = (body.apiKey as string) || process.env.SERPAPI_API_KEY ;
    if (!apiKey) return res.status(400).json({ error: 'Thiếu SerpApi API key' });

    const startAddr = (body.startAddr as string) || '';
    const endAddr = (body.endAddr as string) || '';
    const startCoords = (body.startCoords as string) || '';
    const endCoords = (body.endCoords as string) || '';
    const travelMode = Number(body.travelMode ?? 6);
    const distanceUnit = Number(body.distanceUnit ?? 0); // 0=km, 1=miles
    const hl = (body.hl as string) || 'vi';

    if (!(startAddr || startCoords) || !(endAddr || endCoords)) {
      return res.status(400).json({ error: 'Cần ít nhất startAddr/startCoords và endAddr/endCoords' });
    }

    const params = new URLSearchParams({
      engine: 'google_maps_directions',
      api_key: apiKey,
      travel_mode: String(travelMode),
      distance_unit: String(distanceUnit),
      hl,
    });
    if (startAddr) params.set('start_addr', startAddr);
    if (endAddr) params.set('end_addr', endAddr);
    if (startCoords) params.set('start_coords', startCoords);
    if (endCoords) params.set('end_coords', endCoords);

    const resp: any = await (globalThis as any).fetch(`${SERPAPI_BASE}?${params.toString()}`);
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); }
    catch { return res.status(resp.status).json({ error: 'Non-JSON response', body: text.slice(0, 500) }); }
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || `SerpApi ${resp.status}`, raw: data });
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[serpapi/directions] error:', error?.message || error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
