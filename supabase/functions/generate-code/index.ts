import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CodeGenerationRequest {
  prompt: string
  language: 'javascript' | 'python'
  context?: string
  sessionId: string
  existingFiles?: Array<{
    filename: string
    content: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, language, context, sessionId, existingFiles = [] }: CodeGenerationRequest = await req.json()

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    console.log('Using GROQ API Key:', groqApiKey.substring(0, 10) + '...')

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

    // Generate code with Groq
    const systemPrompt = `You are CodexOrb, an expert AI coding assistant. Generate high-quality, production-ready code based on user requests.

IMPORTANT RULES:
1. Generate ONLY the code content, no explanations or markdown
2. Code must be syntactically correct and runnable
3. Use modern best practices for ${language}
4. Include proper error handling
5. Add meaningful comments
6. Follow clean code principles

Context: ${context}
Language: ${language}
Existing files: ${existingFiles.map(f => f.filename).join(', ')}

Generate code for: ${prompt}`

    console.log('Making request to Groq API...')

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('Groq API error:', groqResponse.status, errorText)
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`)
    }

    const groqData = await groqResponse.json()
    const generatedCode = groqData.choices[0]?.message?.content || ''

    console.log('Code generated successfully, length:', generatedCode.length)

    // Analyze code quality
    const analysisResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Analyze this ${language} code for quality, security, and best practices. Return JSON with healthScore (0-100) and issues array:

\`\`\`${language}
${generatedCode}
\`\`\`

JSON only:`
        }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    let healthScore = 85
    let issues: any[] = []

    if (analysisResponse.ok) {
      try {
        const analysisData = await analysisResponse.json()
        const analysis = JSON.parse(analysisData.choices[0]?.message?.content || '{}')
        healthScore = Math.max(60, Math.min(100, analysis.healthScore || 85))
        issues = analysis.issues || []
        console.log('Code analysis completed, health score:', healthScore)
      } catch (e) {
        console.log('Analysis parsing failed, using defaults')
      }
    }

    // Generate filename
    const filename = generateFilename(prompt, language)

    // Save to database
    const { data: codeFile, error: dbError } = await supabase
      .from('code_files')
      .insert({
        session_id: sessionId,
        filename,
        content: generatedCode,
        language,
        health_score: healthScore,
        issues
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Generate AI response
    const aiResponseData = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'system',
          content: 'You are CodexOrb AI, a helpful coding assistant. Respond conversationally about the code you just generated.'
        }, {
          role: 'user',
          content: `I generated ${filename} with ${language} code for: ${prompt}. Give a brief, friendly response about what was created.`
        }],
        temperature: 0.7,
        max_tokens: 256,
      }),
    })

    let aiMessage = `I've generated ${filename} for you! The code includes everything you requested.`
    if (aiResponseData.ok) {
      const aiData = await aiResponseData.json()
      aiMessage = aiData.choices[0]?.message?.content || aiMessage
    }

    // Save AI message
    await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: aiMessage,
        type: 'ai'
      })

    console.log('Code generation completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        codeFile,
        aiMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
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

function generateFilename(prompt: string, language: string): string {
  const lowerPrompt = prompt.toLowerCase()
  const ext = language === 'javascript' ? 'js' : 'py'
  
  if (lowerPrompt.includes('todo') || lowerPrompt.includes('task')) {
    return `todo-app.${ext}`
  }
  if (lowerPrompt.includes('calculator') || lowerPrompt.includes('calc')) {
    return `calculator.${ext}`
  }
  if (lowerPrompt.includes('api') || lowerPrompt.includes('server')) {
    return `api-server.${ext}`
  }
  if (lowerPrompt.includes('auth') || lowerPrompt.includes('login')) {
    return `auth.${ext}`
  }
  if (lowerPrompt.includes('database') || lowerPrompt.includes('db')) {
    return `database.${ext}`
  }
  if (lowerPrompt.includes('component') || lowerPrompt.includes('ui')) {
    return `component.${ext}`
  }
  if (lowerPrompt.includes('util') || lowerPrompt.includes('helper')) {
    return `utils.${ext}`
  }
  
  const timestamp = Date.now().toString().slice(-4)
  return `generated-${timestamp}.${ext}`
}