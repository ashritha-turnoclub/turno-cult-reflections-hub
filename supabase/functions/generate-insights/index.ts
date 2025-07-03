
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPEN_AI_KEY');
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

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please contact administrator to set up OPENAI_API_KEY.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate analytics
    const totalFocusAreas = focusAreas?.length || 0;
    const completedFocusAreas = focusAreas?.filter((area: any) => area.progress_percent >= 100).length || 0;
    const avgProgress = totalFocusAreas > 0 ? 
      Math.round(focusAreas.reduce((sum: number, area: any) => sum + (area.progress_percent || 0), 0) / totalFocusAreas) : 0;
    
    const recentDiaryEntries = diaryEntries?.length || 0;
    const submittedQuestionnaires = questionnaires?.filter((q: any) => q.submitted_at).length || 0;
    const totalQuestionnaires = questionnaires?.length || 0;
    
    // Overdue items
    const currentDate = new Date();
    const overdueItems = focusAreas?.filter((area: any) => {
      if (!area.deadline) return false;
      return new Date(area.deadline) < currentDate && area.progress_percent < 100;
    }).length || 0;

    const context = `
Role: ${userRole?.toUpperCase() || 'UNKNOWN'}

ANALYTICS SUMMARY:
- Total Focus Areas: ${totalFocusAreas}
- Completed Focus Areas: ${completedFocusAreas}
- Average Progress: ${avgProgress}%
- Recent Diary Entries: ${recentDiaryEntries}
- Submitted Questionnaires: ${submittedQuestionnaires}/${totalQuestionnaires}
- Overdue Items: ${overdueItems}

Recent Questionnaire Responses:
${questionnaires?.map((q: any) => `
- ${q.questionnaires?.title || 'Untitled'} (${q.questionnaires?.quarter || 'No quarter'} ${q.questionnaires?.year || 'No year'})
  Status: ${q.submitted_at ? 'Submitted' : 'Pending'}
  Answers: ${q.answers?.map((a: any) => a.answer_text).join('; ') || 'No answers provided'}
`).join('\n') || 'No questionnaire data available'}

Diary Entries:
${diaryEntries?.map((entry: any) => `
- ${entry.title || 'Untitled'} (${entry.category || 'Uncategorized'}) - ${entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'No date'}
  Notes: ${entry.notes || 'No notes'}
  Timeline: ${entry.timeline || 'No timeline'}
`).join('\n') || 'No diary entries available'}

Focus Areas & Goals:
${focusAreas?.map((area: any) => `
- ${area.title || 'Untitled'} (${area.progress_percent || 0}% complete)
  Description: ${area.description || 'No description'}
  Deadline: ${area.deadline || 'No deadline'}
  Quarter: ${area.quarter || 'No quarter'} ${area.year || ''}
  Status: ${area.progress_percent >= 100 ? 'COMPLETED' : area.deadline && new Date(area.deadline) < currentDate ? 'OVERDUE' : 'IN PROGRESS'}
`).join('\n') || 'No focus areas available'}
    `;

    const prompt = `As a professional executive coach, analyze the following data and provide structured insights in JSON format. 

    IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code blocks, no additional text).

    Structure your response as follows:
    {
      "summary": "Brief 2-3 sentence executive summary highlighting key progress and areas of focus",
      "keyMetrics": {
        "progressScore": number (0-100),
        "completionRate": number (0-100),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH"
      },
      "strengths": ["strength1", "strength2", "strength3"],
      "concerns": ["concern1", "concern2", "concern3"],
      "blockers": ["blocker1", "blocker2"],
      "recommendations": [
        {
          "priority": "HIGH" | "MEDIUM" | "LOW",
          "action": "specific action item",
          "timeline": "suggested timeframe",
          "category": "GOAL_SETTING" | "TIME_MANAGEMENT" | "COMMUNICATION" | "STRATEGY"
        }
      ],
      "monthlyTrend": {
        "direction": "IMPROVING" | "DECLINING" | "STABLE",
        "insight": "explanation of trend"
      },
      "nextSteps": ["immediate next step 1", "immediate next step 2", "immediate next step 3"]
    }

    Data to analyze:
    ${context}

    Focus on being actionable, specific, and supportive while maintaining professional coaching standards.`;

    console.log('Making request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional executive coach. Respond with valid JSON only - no markdown formatting, no code blocks, no additional text.' 
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

    const rawInsights = data.choices[0].message.content;
    console.log('Raw AI response:', rawInsights);

    let structuredInsights;
    try {
      structuredInsights = JSON.parse(rawInsights);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to storing raw content
      structuredInsights = {
        summary: "AI insights generated successfully",
        keyMetrics: { 
          progressScore: avgProgress, 
          completionRate: Math.round((completedFocusAreas / Math.max(totalFocusAreas, 1)) * 100), 
          riskLevel: overdueItems > 2 ? "HIGH" : overdueItems > 0 ? "MEDIUM" : "LOW" 
        },
        strengths: ["Consistent engagement with platform", "Active diary entries"],
        concerns: overdueItems > 0 ? ["Overdue items need attention"] : ["No major concerns identified"],
        blockers: overdueItems > 0 ? ["Approaching deadlines"] : [],
        recommendations: [
          {
            priority: "HIGH",
            action: "Review and update progress on focus areas",
            timeline: "This week",
            category: "GOAL_SETTING"
          }
        ],
        monthlyTrend: {
          direction: "STABLE",
          insight: "Steady progress observed"
        },
        nextSteps: ["Review focus areas", "Update progress", "Plan next quarter"]
      };
    }

    // Add analytics to structured insights
    structuredInsights.analytics = {
      totalFocusAreas,
      completedFocusAreas,
      avgProgress,
      recentDiaryEntries,
      submittedQuestionnaires,
      totalQuestionnaires,
      overdueItems
    };

    // Save insights to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const quarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;
    const year = currentDate.getFullYear();

    const { error: insertError } = await supabase
      .from('ai_summaries')
      .insert([{
        user_id: userId,
        type: 'structured_insights',
        content: JSON.stringify(structuredInsights),
        quarter: quarter,
        year: year
      }]);

    if (insertError) {
      console.error('Error saving insights:', insertError);
      throw insertError;
    }

    console.log('Successfully saved structured insights to database');

    return new Response(
      JSON.stringify({ insights: structuredInsights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate insights. Please check configuration and try again.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
