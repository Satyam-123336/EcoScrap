import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Analyze e-waste image using OpenAI vision
export async function analyzeEWasteImage(base64Image: string): Promise<{
  classification: string;
  confidence: number;
  recyclable: boolean;
  estimatedWeight: string;
  suggestions: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert e-waste classification system. Analyze the electronic waste item in the image and provide detailed information. 
          
          Respond with JSON in this exact format:
          {
            "classification": "specific item name (e.g., 'Laptop Computer', 'Smartphone', 'LCD Monitor')",
            "confidence": number between 0 and 1,
            "recyclable": boolean,
            "estimatedWeight": "weight estimate with unit (e.g., '2.5 kg', '150 g')",
            "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
          }
          
          For suggestions, provide helpful tips about proper disposal, data security, or preparation steps.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this electronic waste item and classify it according to the JSON format specified."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      classification: result.classification || 'Unknown Electronic Device',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      recyclable: result.recyclable !== false,
      estimatedWeight: result.estimatedWeight || '1.0 kg',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [
        'Remove personal data before disposal',
        'Check local recycling guidelines',
        'Consider donation if device is functional'
      ]
    };
  } catch (error) {
    console.error('Error analyzing e-waste image:', error);
    return {
      classification: 'Electronic Device',
      confidence: 0.3,
      recyclable: true,
      estimatedWeight: '1.0 kg',
      suggestions: [
        'Unable to analyze image automatically',
        'Please verify item classification manually',
        'Contact support if needed'
      ]
    };
  }
}

// Chatbot assistant for e-waste questions
export async function getChatbotResponse(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are EcoBot, a helpful assistant for EcoScrap Pickup, an e-waste collection service. You help users with:
        
        1. Questions about e-waste recycling and pickup services
        2. Information about what electronic items can be collected
        3. Environmental impact and sustainability tips
        4. How to prepare devices for pickup (data removal, battery safety, etc.)
        5. EcoPoints rewards system and environmental certificates
        
        Keep responses helpful, friendly, and focused on environmental sustainability. Always encourage proper e-waste disposal and highlight the environmental benefits.
        
        If asked about specific pickup requests or account details, direct users to their dashboard or contact support.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages as any,
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process your message. Please try again.";
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return "I'm temporarily unavailable. Please try again later or contact our support team for assistance.";
  }
}