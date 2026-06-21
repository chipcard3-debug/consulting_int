export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'ax-consulting',
    ai_backend_configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.AI_MODEL || 'gpt-5.5',
    timestamp: new Date().toISOString()
  });
}
