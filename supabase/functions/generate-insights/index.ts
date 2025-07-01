
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, questionnaires, diaryEntries, focusAreas, userRole } = await req.json();

    console.log('Received request for user:', userId);
    console.log('OpenAI API Key present:', !!openAIApiKey);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please add your API key in the settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context for AI
    const context = `
Role: ${userRole?.toUpperCase() || 'UNKNOWN'}

Recent Questionnaire Responses:
${questionnaires?.map((q: any) => `
- ${q.questionnaires?.title || 'Untitled'} (${q.questionnaires?.quarter || 'No quarter'} ${q.questionnaires?.year || 'No year'})
  Answers: ${q.answers?.map((a: any) => a.answer_text).join('; ') || 'No answers provided'}
`).join('\n') || 'No questionnaire data available'}

Diary Entries:
${diaryEntries?.map((entry: any) => `
- ${entry.title || 'Untitled'} (${entry.category || 'Uncategorized'})
  Notes: ${entry.notes || 'No notes'}
  Timeline: ${entry.timeline || 'No timeline'}
`).join('\n') || 'No diary entries available'}

Focus Areas & Goals:
${focusAreas?.map((area: any) => `
- ${area.title || 'Untitled'} (${area.progress_percent || 0}% complete)
  Description: ${area.description || 'No description'}
  Deadline: ${area.deadline || 'No deadline'}
  Quarter: ${area.quarter || 'No quarter'} ${area.year || ''}
`).join('\n') || 'No focus areas available'}
    `;

    const prompt = `As a professional executive coach, analyze the following data from a ${userRole || 'professional'} and provide personalized insights, recommendations, and coaching advice. Focus on:

1. Leadership development patterns
2. Goal achievement strategies
3. Areas for improvement
4. Strengths to leverage
5. Actionable next steps

Data to analyze:
${context}

Provide a comprehensive coaching summary that is encouraging, actionable, and professional. Structure your response with clear sections and specific recommendations. Keep the tone supportive and motivational.`;

    console.log('Making request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional executive coach and leadership development expert. Provide insightful, actionable coaching advice based on the data provided. Be encouraging and specific in your recommendations.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    const insights = data.choices[0].message.content;
    console.log('Generated insights, length:', insights?.length);

    // Save insights to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const currentDate = new Date();
    const quarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;
    const year = currentDate.getFullYear();

    const { error: insertError } = await supabase
      .from('ai_summaries')
      .insert([{
        user_id: userId,
        type: 'coaching_insights',
        content: insights,
        quarter: quarter,
        year: year
      }]);

    if (insertError) {
      console.error('Error saving insights:', insertError);
      throw insertError;
    }

    console.log('Successfully saved insights to database');

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate insights. Please check your API key and try again.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
