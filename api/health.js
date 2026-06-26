export default function handler(req, res) {
  const key = process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '';
  res.status(200).json({
    ok: true,
    service: 'ax-consulting',
    ai_backend_configured: Boolean(key),
    key_preview: key ? `${key.slice(0, 6)}...${key.slice(-4)} (len:${key.length})` : 'none',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
    timestamp: new Date().toISOString()
  });
}
