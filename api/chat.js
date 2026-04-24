export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { system, messages, max_tokens } = req.body;

    // Build Gemini contents array
    const contents = [];

    // Add message history
    messages.forEach(m => {
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      });
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const body = {
      contents,
      generationConfig: { maxOutputTokens: max_tokens || 1000 },
    };

    // Pass system instruction separately
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data).slice(0, 500));

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('Empty text, full response:', JSON.stringify(data));
      res.status(200).json({ content: [{ type: 'text', text: '（Gemini 没有返回内容，请稍后再试）' }] });
      return;
    }

    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
