
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

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context for AI
    const context = `
Role: ${userRole.toUpperCase()}

Recent Questionnaire Responses:
${questionnaires.map((q: any) => `
- ${q.questionnaires?.title} (${q.questionnaires?.quarter} ${q.questionnaires?.year})
  Answers: ${q.answers?.map((a: any) => a.answer_text).join('; ') || 'No answers'}
`).join('\n')}

Diary Entries:
${diaryEntries.map((entry: any) => `
- ${entry.title} (${entry.category || 'Uncategorized'})
  Notes: ${entry.notes}
  Timeline: ${entry.timeline || 'No timeline'}
`).join('\n')}

Focus Areas & Goals:
${focusAreas.map((area: any) => `
- ${area.title} (${area.progress_percent}% complete)
  Description: ${area.description || 'No description'}
  Deadline: ${area.deadline || 'No deadline'}
  Quarter: ${area.quarter || 'No quarter'} ${area.year || ''}
`).join('\n')}
    `;

    const prompt = `As a professional executive coach, analyze the following data from a ${userRole} and provide personalized insights, recommendations, and coaching advice. Focus on:

1. Leadership development patterns
2. Goal achievement strategies
3. Areas for improvement
4. Strengths to leverage
5. Actionable next steps

Data to analyze:
${context}

Provide a comprehensive coaching summary that is encouraging, actionable, and professional. Structure your response with clear sections and specific recommendations.`;

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
            content: 'You are a professional executive coach and leadership development expert. Provide insightful, actionable coaching advice based on the data provided.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const insights = data.choices[0].message.content;

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

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
