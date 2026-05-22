/**
 * SerpApi Google Maps service — gọi qua serverless proxy `/api/serpapi/*`.
 * SerpApi không bật CORS nên không thể fetch trực tiếp từ browser.
 * Local dev cần `vercel dev` để serve api/*.
 */

export interface SerpApiMapsPlace {
  position?: number;
  title: string;
  place_id?: string;
  data_id?: string;
  data_cid?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  types?: string[];
  address?: string;
  phone?: string;
  open_state?: string;
  hours?: string;
  description?: string;
  thumbnail?: string;
  price?: string;
  gps_coordinates?: { latitude: number; longitude: number; };
  service_options?: Record<string, boolean>;
  website?: string;
}

export interface SerpApiMapsResult {
  search_metadata?: { id?: string; status?: string; created_at?: string; google_maps_url?: string; };
  search_parameters?: Record<string, string>;
  local_results?: SerpApiMapsPlace[];
  place_results?: SerpApiMapsPlace;
  error?: string;
}

export interface SerpApiMapsQuery {
  q: string;
  ll?: string;
  type?: 'search' | 'place';
  start?: number;
  hl?: string;
}

export interface SerpApiDirectionsTrip {
  /** Khoảng cách METERS (integer). Chia 1000 để ra km. */
  distance?: number;
  /** Thời gian SECONDS (integer). */
  duration?: number;
  /** Chuỗi hiển thị đã localize, vd "3.4 km" tuỳ distance_unit. */
  formatted_distance?: string;
  formatted_duration?: string;
  via?: string;
  travel_mode?: string;
  extensions?: string[];
  icon?: string;
  trips?: any[];
}

export interface SerpApiDirectionsResult {
  directions?: SerpApiDirectionsTrip[];
  durations?: Array<{ travel_mode?: string; duration?: number; formatted_duration?: string }>;
  error?: string;
}

export interface SerpApiDirectionsQuery {
  startAddr?: string;
  endAddr?: string;
  startCoords?: string;
  endCoords?: string;
  /** 6=Best (default), 0=Driving, 9=Two-wheeler, 3=Transit, 2=Walking, 1=Cycling, 4=Flight */
  travelMode?: 0 | 1 | 2 | 3 | 4 | 6 | 9;
  /** 0 = km (default), 1 = miles */
  distanceUnit?: 0 | 1;
  hl?: string;
}

const MAPS_URL = '/api/serpapi/maps';
const DIRECTIONS_URL = '/api/serpapi/directions';

export const searchGoogleMaps = async (
  apiKey: string | null | undefined,
  query: SerpApiMapsQuery,
): Promise<SerpApiMapsResult> => {
  if (!query.q?.trim()) throw new Error('Thiếu query string');
  const resp = await fetch(MAPS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(apiKey ? { apiKey } : {}),
      q: query.q.trim(),
      ll: query.ll,
      type: query.type || 'search',
      hl: query.hl || 'vi',
      start: query.start,
    }),
  });
  const data: SerpApiMapsResult & { error?: string } = await resp.json().catch(() => ({} as any));
  if (!resp.ok) throw new Error(data?.error || `Proxy ${resp.status}`);
  if (data.error) throw new Error(data.error);
  return data;
};

export const getDirections = async (
  apiKey: string | null | undefined,
  query: SerpApiDirectionsQuery,
): Promise<SerpApiDirectionsResult> => {
  if (!(query.startAddr || query.startCoords) || !(query.endAddr || query.endCoords)) {
    throw new Error('Cần ít nhất start và end (addr hoặc coords)');
  }
  const resp = await fetch(DIRECTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(apiKey ? { apiKey } : {}),
      startAddr: query.startAddr,
      endAddr: query.endAddr,
      startCoords: query.startCoords,
      endCoords: query.endCoords,
      travelMode: query.travelMode ?? 6,
      distanceUnit: query.distanceUnit ?? 0, // 0=km, 1=miles
      hl: query.hl || 'vi',
    }),
  });
  const data: SerpApiDirectionsResult & { error?: string } = await resp.json().catch(() => ({} as any));
  if (!resp.ok) throw new Error(data?.error || `Proxy ${resp.status}`);
  if (data.error) throw new Error(data.error);
  return data;
};
