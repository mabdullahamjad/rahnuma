import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query, network } = await request.json();
    if (typeof query !== 'string' || !query.trim()) throw new Error('A question is required.');
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error('The assistant is not configured yet.');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'system',
            content: `You are Rah-Numa, a transit guide for Islamabad and Rawalpindi. Use the supplied route network for bus instructions. PIMS Metro Station and PIMS Hospital are different stops; never invent a transfer at Pak Secretariat. For a named neighbourhood or landmark, use web search to identify its location and nearest transit station, state that the walking distance is estimated, then give the transit legs. Be concise and cite current web sources when used.\n\nNetwork:\n${network ?? ''}`,
          },
          { role: 'user', content: query },
        ],
        search_settings: { country: 'pakistan', include_domains: ['cda.gov.pk', 'pma.punjab.gov.pk', 'maps.google.com'] },
        citation_options: 'enabled',
      }),
    });
    if (!response.ok) throw new Error(`Groq request failed (${response.status}).`);
    const payload = await response.json();
    return Response.json({ answer: payload.choices?.[0]?.message?.content ?? 'I could not prepare a response.' }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Assistant request failed.' }, { status: 500, headers: corsHeaders });
  }
});
