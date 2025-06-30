import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  sessionId: string
  context?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, sessionId, context }: ChatRequest = await req.json()

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    console.log('Using GROQ API Key for chat:', groqApiKey.substring(0, 10) + '...')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, type')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversationHistory = recentMessages
      ?.reverse()
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n') || ''

    // Generate AI response with Groq
    const systemPrompt = `You are CodexOrb AI, a helpful and intelligent coding assistant. You help users build software through natural conversation.

Key traits:
- Friendly, encouraging, and professional
- Explain technical concepts clearly
- Suggest improvements and best practices
- Ask clarifying questions when needed
- Keep responses concise but helpful
- Focus on practical solutions

Context: ${context}
Recent conversation:
${conversationHistory}

Respond naturally to the user's message.`

    console.log('Making request to Groq API for chat response...')

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('Groq API error:', groqResponse.status, errorText)
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`)
    }

    const groqData = await groqResponse.json()
    const aiResponse = groqData.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.'

    console.log('Chat response generated successfully')

    // Save AI message to database
    const { data: aiMessage, error: dbError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: aiResponse,
        type: 'ai'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: aiMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Chat response error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})