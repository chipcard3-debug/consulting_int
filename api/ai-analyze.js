const FIELD_META = [
  ['company', '기업명 / 방문일 / 참석자'],
  ['business', '주요 사업·서비스'],
  ['customers', '주요 고객 또는 대상'],
  ['ai_level', 'AI 활용 수준'],
  ['vibe_level', '바이브코딩 이해도'],
  ['leader_needs', '대표자 주요 니즈'],
  ['staff_needs', '직원 주요 니즈'],
  ['improve_work', '가장 개선이 필요한 업무'],
  ['desired_output', '희망 결과물'],
  ['scope', '이번 컨설팅에서 가능한 범위'],
  ['out_of_scope', '제외하거나 후속으로 넘길 내용'],
  ['education', '진행한 교육 내용'],
  ['next_steps', '다음 단계 준비사항']
];

function normalizeField(value, fallbackLabel) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      value: String(value.value || value.summary || value.text || '').trim() || '확인 필요',
      confidence: Number(value.confidence || 0.78),
      evidence: Array.isArray(value.evidence) ? value.evidence.slice(0, 3).map(String) : [],
      raw_summary: String(value.raw_summary || value.value || '').trim()
    };
  }
  return { value: String(value || '확인 필요').trim(), confidence: 0.75, evidence: [], raw_summary: String(value || '') };
}

function stripDangerousRawWords(text) {
  return String(text || '')
    .replace(/1단계 기록표/g, '검토 항목')
    .replace(/기록내용/g, '정리 내용')
    .replace(/근거요약/g, '확인 근거')
    .replace(/prompt\.txt/g, '입력 자료')
    .replace(/전사문|전사본/g, '회의록');
}

function coercePayload(parsed, model) {
  const fields = {};
  const srcFields = parsed.fields || parsed.analysis || parsed;
  for (const [id, label] of FIELD_META) {
    fields[id] = normalizeField(srcFields[id] ?? srcFields[label] ?? parsed[id], label);
    fields[id].value = stripDangerousRawWords(fields[id].value);
    fields[id].raw_summary = stripDangerousRawWords(fields[id].raw_summary);
    fields[id].evidence = (fields[id].evidence || []).map(stripDangerousRawWords);
  }
  let proposals = Array.isArray(parsed.proposals) ? parsed.proposals : [];
  proposals = proposals.slice(0, 4).map((p, i) => ({
    title: stripDangerousRawWords(p.title || `AI 적용 프로토타입 후보 ${i + 1}`),
    summary: stripDangerousRawWords(p.summary || p.description || ''),
    reason: stripDangerousRawWords(p.reason || p.recommendation || ''),
    effect: stripDangerousRawWords(p.effect || ''),
    plan: stripDangerousRawWords(p.plan || p.nextAction || ''),
    score: Number(p.score || 90 - i * 5),
    pocScope: stripDangerousRawWords(p.pocScope || '')
  }));
  return {
    engine: 'google-gemini-vercel',
    model: model,
    fields,
    proposals,
    report_markdown: stripDangerousRawWords(parsed.report_markdown || ''),
    usage: parsed.usage || null
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const started = Date.now();
  try {
    const transcript = String((req.body || {}).transcript || '').trim();
    if (transcript.length < 20) return res.status(400).json({ error: '컨설팅 회의록이 너무 짧습니다.' });

    const apiKey = process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY or OPENAI_API_KEY is not configured.' });

    const model = process.env.AI_MODEL || 'gemini-2.0-flash';
    const schemaGuide = FIELD_META.map(([id, label]) => `- ${id}: ${label}`).join('\n');
    const prompt = `당신은 한국어 AX 현장 컨설팅 보고서 작성 보조자입니다.\n회의록을 분석해 화면용 JSON만 반환하세요.\n절대 raw 기록표, prompt.txt, 전사문, 기록내용, 근거요약 같은 내부 표현을 출력하지 마세요.\n각 값은 회의록 원문 복붙이 아니라 컨설팅 보고서에 들어갈 자연스러운 AI 적용 각색 문구로 작성하세요.\n\n필수 fields 키:\n${schemaGuide}\n\n각 fields[id]는 {"value":"...", "confidence":0.0~1.0, "evidence":["짧은 확인 근거"]} 형태입니다.\nproposals는 다음 회차에서 시연 가능한 AI 적용 프로토타입 후보 3개입니다. 각 항목은 title, summary, reason, effect, plan, score, pocScope를 포함하세요.\n\n회의록:\n${transcript.slice(0, 24000)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: { parts: [{ text: 'Return strict JSON only. Korean business writing. No markdown.' }] }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const raw = await r.text();
    if (!r.ok) return res.status(502).json({ error: 'Google AI API error', detail: raw.slice(0, 1000) });

    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Empty response from Gemini', detail: raw.slice(0, 500) });

    const parsed = JSON.parse(text || '{}');
    const out = coercePayload(parsed, model);
    out.latency_sec = Math.round((Date.now() - started) / 100) / 10;
    out.usage = data.usageMetadata || null;
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
