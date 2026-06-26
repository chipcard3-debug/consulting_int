export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'ax-consulting',
    ai_backend_configured: Boolean(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY),
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
    timestamp: new Date().toISOString()
  });
}
