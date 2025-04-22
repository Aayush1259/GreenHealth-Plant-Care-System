import { NextRequest, NextResponse } from 'next/server';
import { askGreenAiAssistant } from '@/ai/flows/green-ai-assistant';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Direct fallback response if needed
const DEFAULT_FALLBACK_RESPONSE = {
  advice: "I'm sorry, I couldn't process your request at this time. Please try asking a different plant-related question or try again later."
};

// Direct AI call implementation (bypassing server action)
async function directGeminiCall(question: string): Promise<string> {
  // Get API key from environment
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.warn('Google Gemini API key not configured for direct call');
    return "I'm sorry, but I'm not fully configured at the moment. Please contact the site administrator to set up the AI service properly.";
  }

  try {
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare the prompt with plant knowledge constraints
    const prompt = `You are a specialized AI assistant providing expert advice ONLY about plants, trees, and leaves.
    
    IMPORTANT: You MUST ONLY answer questions related to plants, trees, leaves, gardening, plant care, or plant-related topics.
    If the user asks about ANY other topic not related to plants, politely inform them that you can only assist with plant-related inquiries.
    
    Question: ${question}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text || text.trim() === '') {
      return "I understand your question about plants, but I couldn't generate specific advice. Please try asking in a different way.";
    }
    
    return text;
  } catch (error) {
    console.error('Error in direct Gemini call:', error);
    return "I encountered an error while analyzing your plant question. This might be due to high demand or a temporary issue. Please try again in a moment.";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          error: 'Invalid request format.',
          advice: 'Please provide a valid question in JSON format.'
        },
        { status: 200 } // Using 200 to ensure client processes the response
      );
    }

    // Validate the question
    const { question } = body;
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Invalid request. Please provide a valid question.',
          advice: 'Please provide a valid plant-related question.' 
        },
        { status: 200 }
      );
    }
    
    try {
      // Try to use the server action directly from within the API route
      console.log("API route attempting to call askGreenAiAssistant with question:", question);
      const result = await askGreenAiAssistant({ question });
      
      // Validate the result thoroughly
      if (!result) {
        console.error("AI returned null result");
        return NextResponse.json(DEFAULT_FALLBACK_RESPONSE);
      }
      
      if (!result.advice || typeof result.advice !== 'string' || result.advice.trim() === '') {
        console.error("AI returned result without valid advice:", result);
        return NextResponse.json(DEFAULT_FALLBACK_RESPONSE);
      }
      
      // Return the valid result
      console.log("AI returned valid advice, length:", result.advice.length);
      return NextResponse.json({
        advice: result.advice
      });
    } catch (aiError) {
      // Log AI service error with detailed information
      console.error('Error in AI assistant call, trying direct Gemini approach:', aiError);
      
      try {
        // Fall back to direct Gemini call
        console.log("Attempting direct Gemini call for question:", question);
        const directAdvice = await directGeminiCall(question);
        
        // Return the direct result if we got one
        if (directAdvice && directAdvice.trim() !== '') {
          return NextResponse.json({
            advice: directAdvice
          });
        }
      } catch (directError) {
        console.error('Direct Gemini call also failed:', directError);
      }
      
      // Create a more specific error message based on the error
      let fallbackAdvice = DEFAULT_FALLBACK_RESPONSE.advice;
      
      if (aiError instanceof Error) {
        const errorMsg = aiError.message.toLowerCase();
        
        if (errorMsg.includes('api key') || errorMsg.includes('configure')) {
          fallbackAdvice = "The AI service is not properly configured. Please contact the site administrator.";
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('connection')) {
          fallbackAdvice = "I'm having trouble connecting to my plant knowledge database. Please check your internet connection and try again.";
        } else if (errorMsg.includes('non-plant') || errorMsg.includes('not related to plant')) {
          fallbackAdvice = "I'm specialized in plant knowledge only. I can help with questions about plants, trees, gardening, or plant care. Please ask me something about plants!";
        }
      }
      
      // Always return a 200 status with advice to ensure client can display something
      return NextResponse.json({ advice: fallbackAdvice }, { status: 200 });
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in assistant API route:', error);
    
    // Ensure we always return a valid response even in the worst case
    return NextResponse.json(
      DEFAULT_FALLBACK_RESPONSE,
      { status: 200 }
    );
  }
} 