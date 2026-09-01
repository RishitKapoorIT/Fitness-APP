/// <reference types="@types/deno" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contents, systemPrompt } = await req.json();

    // Retrieve API key from environment secrets
    const rawApiKey = Deno.env.get('GEMINI_API_KEY');
    const apiKey = rawApiKey ? rawApiKey.trim() : null;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return new Response(
        JSON.stringify({
          error: {
            message: "GEMINI_API_KEY is not set in your Supabase project secrets."
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Google Gemini API (using official model name gemini-1.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error status:', response.status, data);
      return new Response(
        JSON.stringify({
          error: {
            message: data?.error?.message || `Gemini API returned status ${response.status}`
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Edge function exception:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal Server Error' } }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
