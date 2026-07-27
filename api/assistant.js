// Vercel serverless function. GROQ_API_KEY is read only on the server and is
// never included in the browser bundle.
export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });

  try {
    const { query, network } = request.body ?? {};
    if (typeof query !== 'string' || !query.trim()) return response.status(400).json({ error: 'A question is required.' });
    if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'The assistant is not configured.' });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'system',
            content: `You are Rah-Numa, a transit guide for Islamabad and Rawalpindi. Use the supplied route network for bus instructions. PIMS Metro Station and PIMS Hospital are different stops: Red, Green and Blue connect at PIMS Metro; feeder routes use PIMS Hospital. Never invent a transfer between them. For a named landmark or neighbourhood, use OpenStreetMap-derived location context when supplied and state that walking distance is estimated. Prefer the route with the fewest bus changes. Be concise.\n\nNetwork:\n${network ?? ''}`,
          },
          { role: 'user', content: query },
        ],
        search_settings: { country: 'pakistan', include_domains: ['cda.gov.pk', 'pma.punjab.gov.pk', 'maps.google.com'] },
        citation_options: 'enabled',
      }),
    });

    if (!groqResponse.ok) throw new Error(`Groq request failed (${groqResponse.status}).`);
    const payload = await groqResponse.json();
    return response.status(200).json({ answer: payload.choices?.[0]?.message?.content ?? 'I could not prepare a response.' });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Assistant request failed.' });
  }
}
