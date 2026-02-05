 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const { imageBase64, room, language = "en" } = await req.json();
     
     if (!imageBase64) {
       return new Response(
         JSON.stringify({ error: "No image provided" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       console.error("LOVABLE_API_KEY not configured");
       return new Response(
         JSON.stringify({ error: "AI service not configured" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const systemPrompt = `You are an expert property inspector analyzing photos for defects and issues. 
 Analyze the image and identify any problems, damage, safety hazards, or maintenance issues.
 
 Focus on:
 - Structural issues (cracks, damage, deterioration)
 - Water damage or moisture problems
 - Electrical hazards
 - Plumbing issues
 - HVAC problems
 - Safety concerns
 - General maintenance needs
 
 Room context: ${room || "unspecified"}
 
 You MUST respond using the suggest_findings tool with your analysis.`;
 
     const userPrompt = language === "es" 
       ? "Analiza esta foto de inspección de propiedad e identifica cualquier problema, daño o preocupación de mantenimiento. Proporciona hallazgos detallados."
       : "Analyze this property inspection photo and identify any issues, damage, or maintenance concerns. Provide detailed findings.";
 
     console.log("Calling Lovable AI for photo analysis...");
     
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
               description: "Return structured inspection findings for the analyzed photo",
               parameters: {
                 type: "object",
                 properties: {
                   findings: {
                     type: "array",
                     items: {
                       type: "object",
                       properties: {
                         title: { type: "string", description: "Brief title of the issue (max 50 chars)" },
                         title_es: { type: "string", description: "Spanish translation of the title" },
                         description: { type: "string", description: "Detailed description of what was observed" },
                         description_es: { type: "string", description: "Spanish translation of description" },
                         recommendation: { type: "string", description: "Recommended action to address the issue" },
                         recommendation_es: { type: "string", description: "Spanish translation of recommendation" },
                         severity: { type: "string", enum: ["minor", "moderate", "severe"], description: "Severity level" },
                         category: { type: "string", enum: ["roofing", "plumbing", "electrical", "hvac", "foundation", "safety", "general"], description: "Issue category" },
                         confidence: { type: "number", description: "Confidence score 0-100" }
                       },
                       required: ["title", "description", "recommendation", "severity", "category", "confidence"]
                     }
                   },
                   overallCondition: {
                     type: "string",
                     enum: ["good", "fair", "poor"],
                     description: "Overall condition assessment"
                   },
                   summary: {
                     type: "string",
                     description: "Brief summary of the inspection findings"
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
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       
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
         JSON.stringify({ error: "AI analysis failed" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const data = await response.json();
     console.log("AI response received");
     
     // Extract tool call result
     const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
     if (!toolCall || toolCall.function.name !== "suggest_findings") {
       console.error("No valid tool call in response");
       return new Response(
         JSON.stringify({ error: "Invalid AI response format" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const result = JSON.parse(toolCall.function.arguments);
     console.log("Analysis complete:", result.findings?.length || 0, "findings");
 
     return new Response(
       JSON.stringify(result),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Error in analyze-photo:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });