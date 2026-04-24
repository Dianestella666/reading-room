export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { system, messages, max_tokens } = req.body;

    // Convert Anthropic format → Gemini format
    const geminiMessages = [];
    if (system) {
      geminiMessages.push({ role: 'user', parts: [{ text: '[系统设定]\n' + system }] });
      geminiMessages.push({ role: 'model', parts: [{ text: '明白，我会按照设定来。' }] });
    }
    messages.forEach(m => {
      geminiMessages.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      });
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: max_tokens || 1000 }
      })
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '（没有回复）';

    // Return in Anthropic-compatible format so frontend doesn't need to change
    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy error' });
  }
}
