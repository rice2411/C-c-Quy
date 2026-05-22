/**
 * Debug endpoint: GET /api/debug/env
 * Trả về list env vars có sẵn ở serverless runtime (KHÔNG lộ value, chỉ first 4 chars).
 * Mục đích: xác minh SERPAPI_API_KEY có được load không.
 *
 * CẢNH BÁO: endpoint này chỉ nên enable trong dev. Production nên xoá hoặc gate auth.
 */
import type { ApiRequest, ApiResponse } from '../../types/api';

const EXPECTED_KEYS = [
  'SERPAPI_API_KEY',
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'GEMINI_API_KEY',
  'VISION_API_KEY',
  'ZALO_TOKEN',
];

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const status: Record<string, { present: boolean; preview: string | null; length: number }> = {};
  for (const key of EXPECTED_KEYS) {
    const val = process.env[key];
    status[key] = {
      present: !!val,
      preview: val ? `${val.slice(0, 4)}...${val.slice(-2)}` : null,
      length: val ? val.length : 0,
    };
  }
  return res.status(200).json({
    nodeEnv: process.env.NODE_ENV || null,
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelRegion: process.env.VERCEL_REGION || null,
    envVars: status,
  });
}
