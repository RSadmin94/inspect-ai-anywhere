import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// JWT verification is disabled for this function - security enforced via:
// 1. License validation (must have active license)
// 2. Max payload size limit
// 3. Rate limiting per device/license
// 4. Generic error messages
export const config = {
  jwt: {
    verify: false,
  },
};

// Allowed origins for CORS - restricts API access to known domains
const ALLOWED_ORIGINS = [
  'https://inspect-ai-anywhere.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://365-inspect-ai.netlify.app',
  // add your custom domain when ready:
  // 'https://app.365inspectai.com',
];

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.lovable.app')) return true;
  if (origin.endsWith('.netlify.app')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in allowed list
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Rate limiting: track requests per device per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(deviceId: string, maxRequests: number = 5): boolean {
  const now = Date.now();
  const key = deviceId;
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Verify license by querying the licenses table
async function verifyLicense(licenseKey: string): Promise<boolean> {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return false;
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Query licenses table to check if license is active and allows AI analysis
    const { data: license, error } = await supabase
      .from('licenses')
      .select('is_active, allow_ai')
      .eq('license_key', licenseKey)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !license) {
      console.warn('License verification failed');
      return false;
    }
    
    // Check if AI analysis is allowed for this license
    if (!license.allow_ai) {
      console.warn('AI analysis not allowed for this license');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('License verification error');
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, room, language = "en", licenseKey, deviceId } = await req.json();

    // Validate required fields
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!licenseKey || typeof licenseKey !== "string") {
      return new Response(
        JSON.stringify({ error: "License key required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!deviceId || typeof deviceId !== "string") {
      return new Response(
        JSON.stringify({ error: "Device ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(deviceId, 5)) {
      console.warn('Rate limit exceeded for device:', deviceId);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // License verification
    const isLicenseValid = await verifyLicense(licenseKey);
    if (!isLicenseValid) {
      console.warn('Invalid or inactive license');
      return new Response(
        JSON.stringify({ error: "Analysis failed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit base64 payload to ~10MB to prevent memory exhaustion and excessive API costs
    const MAX_BASE64_SIZE = 10 * 1024 * 1024;
    if (imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 10MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["en", "es"].includes(language)) {
      return new Response(
        JSON.stringify({ error: "Unsupported language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("AI service not configured");
      return new Response(
        JSON.stringify({ error: "Analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 365 InspectAI Best-of Hybrid Report System Prompt
    const systemPrompt = `You are an expert licensed property inspector analyzing photos for a professional, court-defensible home inspection report.

SYSTEM ROLE:
Your job is to generate findings that strictly follow the Best-of Hybrid Inspection Report format.
Your output must read as if written by a licensed home inspector, not software.

CRITICAL WRITING RULES (MUST FOLLOW):
- Professional, neutral, factual tone throughout
- Third-person voice only ("was observed", "appears to", "is recommended")
- NEVER use emotional language or absolutes ("will fail", "guaranteed", "dangerous")
- NEVER speculate beyond visible conditions
- NEVER mention AI, software, or automated analysis

REQUIRED PHRASES TO USE:
- "Observed" / "Was observed"
- "Appears to" / "Appeared to"
- "At the time of inspection"
- "Recommend further evaluation by [specialist type]"
- "Conditions at the time of inspection"
- "Visual inspection revealed"
- "Could not be determined through visual inspection alone"

PHRASES TO AVOID:
- "I found" / "I noticed" (use third person)
- "Definitely" / "Certainly" / "Absolutely"
- "Will cause" / "Will result in"
- "Dangerous" / "Hazardous" (use "safety concern" instead)
- Any marketing language or casual phrasing
- Any emojis

FINDING STRUCTURE (Observation → Implication → Recommendation):
Each finding MUST follow this exact pattern:

1. OBSERVATION: What is visible/observed (factual, objective)
   Example: "Cracking was observed along the foundation wall extending approximately 3 feet."

2. IMPLICATION: Why it matters (professional assessment)
   Example: "While the extent of movement cannot be determined through visual inspection alone, such cracking may indicate settlement or structural stress."

3. RECOMMENDATION: What to do next (actionable)
   Example: "Recommend evaluation by a qualified structural engineer prior to closing."

STATUS LABELS (assign one to each finding):
- "safety" - Immediate safety concerns requiring prompt attention
- "repair" - Major defects requiring repair
- "maintenance" - Routine maintenance items
- "monitor" - Items to observe over time

SEVERITY MAPPING:
- "severe" = Safety concerns or major structural/system defects
- "moderate" = Repair needed, functional but deficient
- "minor" = Maintenance or monitoring items

Room/Area context: ${room || "unspecified area"}

QUALITY CHECK BEFORE RESPONDING:
- Is the language professional and court-defensible?
- Does each finding follow Observation → Implication → Recommendation?
- Are status labels correctly assigned?
- Would another licensed inspector accept this without edits?

You MUST respond using the suggest_findings tool with your analysis.`;

    const userPrompt = language === "es" 
      ? "Analiza esta foto de inspección de propiedad. Identifica hallazgos siguiendo el formato Observación → Implicación → Recomendación. Usa lenguaje profesional de informe de inspección."
      : "Analyze this property inspection photo. Identify findings following the Observation → Implication → Recommendation format. Use professional home inspection report language.";

    console.log("Processing photo analysis request");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                } 
              }
            ]
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_findings",
              description: "Return structured inspection findings following the Best-of Hybrid report format",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { 
                          type: "string", 
                          description: "Professional title of the finding (max 60 chars, no emotional language)" 
                        },
                        title_es: { 
                          type: "string", 
                          description: "Spanish translation of the title" 
                        },
                        observation: {
                          type: "string",
                          description: "What was observed (factual, objective description)"
                        },
                        observation_es: {
                          type: "string",
                          description: "Spanish translation of observation"
                        },
                        implication: {
                          type: "string",
                          description: "Why it matters (professional assessment of significance)"
                        },
                        implication_es: {
                          type: "string",
                          description: "Spanish translation of implication"
                        },
                        recommendation: { 
                          type: "string", 
                          description: "Recommended action (format: 'Recommend [action] by [professional if needed]')" 
                        },
                        recommendation_es: { 
                          type: "string", 
                          description: "Spanish translation of recommendation" 
                        },
                        description: { 
                          type: "string", 
                          description: "Full finding combining observation and implication in professional language" 
                        },
                        description_es: { 
                          type: "string", 
                          description: "Spanish translation of full description" 
                        },
                        severity: { 
                          type: "string", 
                          enum: ["minor", "moderate", "severe"], 
                          description: "Severity: severe=safety/major defects, moderate=repair needed, minor=maintenance/monitor" 
                        },
                        status: {
                          type: "string",
                          enum: ["safety", "repair", "maintenance", "monitor"],
                          description: "Status label for categorization in report"
                        },
                        category: { 
                          type: "string", 
                          enum: ["roofing", "plumbing", "electrical", "hvac", "foundation", "safety", "general"], 
                          description: "System category" 
                        },
                        confidence: { 
                          type: "number", 
                          description: "Confidence score 0-100 (implicit, do not state in text)" 
                        }
                      },
                      required: ["title", "observation", "implication", "recommendation", "description", "severity", "status", "category", "confidence"]
                    }
                  },
                  overallCondition: {
                    type: "string",
                    enum: ["satisfactory", "marginal", "deficient"],
                    description: "Overall condition: satisfactory=good, marginal=fair, deficient=poor"
                  },
                  summary: {
                    type: "string",
                    description: "Brief professional summary (1-2 sentences, no speculation)"
                  },
                  summary_es: {
                    type: "string",
                    description: "Spanish translation of summary"
                  }
                },
                required: ["findings", "overallCondition", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_findings" } },
      }),
    });

    if (!response.ok) {
      await response.text(); // Consume body to prevent resource leak
      console.error("AI request failed with status:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_findings") {
      console.error("Invalid response format");
      return new Response(
        JSON.stringify({ error: "Analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Map overallCondition to legacy format for compatibility
    if (result.overallCondition === "satisfactory") result.overallCondition = "good";
    else if (result.overallCondition === "marginal") result.overallCondition = "fair";
    else if (result.overallCondition === "deficient") result.overallCondition = "poor";
    
    const findingsCount = result.findings?.length || 0;
    console.log(`Analysis complete: ${findingsCount} findings`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Photo analysis error");
    return new Response(
      JSON.stringify({ error: "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
