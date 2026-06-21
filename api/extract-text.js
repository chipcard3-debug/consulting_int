export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  return res.status(400).json({ error: 'Vercel 버전은 TXT/MD 파일은 브라우저에서 직접 읽고, DOCX 추출은 후속 단계에서 지원합니다. 회의록 텍스트를 직접 붙여넣어 주세요.' });
}
