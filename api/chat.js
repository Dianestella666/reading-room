export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { system, messages, max_tokens } = req.body;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: max_tokens || 1000,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages
        ]
      })
    });

    const data = await response.json();
    console.log('DeepSeek status:', response.status);

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      console.error('Empty response:', JSON.stringify(data));
      res.status(200).json({ content: [{ type: 'text', text: '（没有收到回复，请稍后再试）' }] });
      return;
    }

    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
