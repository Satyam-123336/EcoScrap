import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client function (for chatbot only)
function getGeminiClient() {
  console.log("Getting Gemini client for chatbot:");
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found in environment variables, returning null");
    return null;
  }
  if (process.env.GEMINI_API_KEY.length < 10) {
    console.warn("GEMINI_API_KEY seems too short. Please verify it's correct.");
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini client created successfully for chatbot");
    return genAI;
  } catch (error) {
    console.error("Error creating Gemini client for chatbot:", error);
    return null;
  }
}

// Chatbot assistant for e-waste questions using Gemini
export async function getChatbotResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const genAI = getGeminiClient();
  console.log("Gemini available:", !!genAI);
  console.log("Message:", message);
  console.log("History length:", conversationHistory.length);
  console.log("History:", conversationHistory);
  
  if (!genAI) {
    console.log("Using mock chatbot system");
    return generateMockResponse(message, conversationHistory);
  }

  try {
    console.log("Attempting to use Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Gemini model created successfully");

    // Build conversation history for Gemini
    // Filter out assistant messages that come before the first user message
    const validHistory = conversationHistory.filter((msg, index) => {
      if (index === 0 && msg.role === "assistant") {
        return false; // Skip first message if it's from assistant
      }
      return true;
    });

    console.log("Original history length:", conversationHistory.length);
    console.log("Valid history length:", validHistory.length);

    const chat = model.startChat({
      history: validHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: 1024, // Increased for longer answers
        temperature: 0.7,
      },
    });
    console.log("Chat session created with history length:", conversationHistory.length);

    const systemPrompt = `You are EcoBot, a helpful assistant for EcoScrap Pickup, an e-waste collection service. You help users with:

1. Questions about e-waste recycling and pickup services
2. Information about what electronic items can be collected
3. Environmental impact and sustainability tips
4. How to prepare devices for pickup (data removal, battery safety, etc.)
5. EcoPoints rewards system and environmental certificates

Keep responses helpful, friendly, and focused on environmental sustainability.
Always encourage proper e-waste disposal and highlight environmental benefits.
Maintain conversation context across turns.

Current user message: ${message}`;

    console.log("Sending message to Gemini...");
    const result = await chat.sendMessage(systemPrompt);
    console.log("Received response from Gemini");
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response text length:", text.length);

    if (!text || text.trim().length === 0) {
      console.warn("Gemini returned empty response, using fallback");
      return generateMockResponse(message, conversationHistory);
    }

    return text;
  } catch (error: any) {
    console.error("Error generating chatbot response with Gemini:", error);

    // Handle specific error types
    if (error?.status === 400) {
      console.error("Gemini API error: Bad request - possibly invalid API key or malformed request");
    } else if (error?.status === 401) {
      console.error("Gemini API error: Unauthorized - invalid API key");
    } else if (error?.status === 403) {
      console.error("Gemini API error: Forbidden - API key doesn't have required permissions");
    } else if (error?.status === 429) {
      console.error("Gemini API error: Rate limit exceeded");
    } else if (error?.status >= 500) {
      console.error("Gemini API error: Server error - service temporarily unavailable");
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      console.error("Gemini API error: Network connection failed");
    }

    console.log("Falling back to mock chatbot response");
    return generateMockResponse(message, conversationHistory);
  }
}

// Mock chatbot response generator with conversation context (fallback)
function generateMockResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const messageLower = message.toLowerCase();
  
  // Check if this is a follow-up question based on conversation history
  if (conversationHistory.length > 1) {
    const lastAssistantMessage = conversationHistory.findLast(msg => msg.role === 'assistant')?.content?.toLowerCase() || '';
    const lastUserMessage = conversationHistory.findLast(msg => msg.role === 'user')?.content?.toLowerCase() || '';
    
    console.log("Mock: Last assistant:", lastAssistantMessage.substring(0, 50));
    console.log("Mock: Last user:", lastUserMessage.substring(0, 50));
    
    // Context-aware responses
    if (lastAssistantMessage.includes('recycl') && (messageLower.includes('how') || messageLower.includes('what') || messageLower.includes('prepar'))) {
      return "Great follow-up! To prepare devices for recycling:\n\n1. Data Security: Remove all personal data, photos, and accounts\n2. Battery Safety: Remove batteries if possible (especially lithium-ion)\n3. Device Condition: Note any damage or special handling requirements\n4. Location: Place items in a secure, accessible location\n\nOur team will handle the rest safely and professionally!";
    }
    
    if (lastAssistantMessage.includes('point') && (messageLower.includes('how') || messageLower.includes('what') || messageLower.includes('earn'))) {
      return "Perfect! Here's how you earn EcoPoints:\n\n  of e-waste recycled\n  over time and unlock higher levels\n : Eco Beginner  Eco Champion  Eco Legend  Eco Master\n : Each kg saves approximately 0.4kg of CO2\n\nKeep recycling to climb the ranks!";
    }
    
    if (lastAssistantMessage.includes('pickup') && (messageLower.includes('when') || messageLower.includes('how') || messageLower.includes('schedule'))) {
      return "Excellent question! Our pickup service works like this:\n\n : Schedule anytime, day or night\n : Typically arrives within 24 hours\n : Monitor your pickup progress\n : Choose your preferred pickup time\n : Trained technicians ensure proper handling\n\nJust schedule through our app and we'll take care of the rest!";
    }
    
    // General follow-up response
    if (messageLower.includes('more') || messageLower.includes('else') || messageLower.includes('what about') || messageLower.includes('how about') || messageLower.includes('tell me') || messageLower.includes('explain')) {
      return "I'm glad I could help with that! Is there anything else you'd like to know about e-waste recycling, our services, or environmental impact? I'm here to answer all your questions!";
    }
  }
  
  // Initial responses based on keywords
  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
    return "Hi! I'm EcoBot, your e-waste recycling assistant. I can help you with:\n\n Recycling questions and guidelines\n Pickup scheduling information\n EcoPoints and rewards system\n Environmental impact details\n Device preparation tips\n\nWhat would you like to know about e-waste recycling?";
  }
  
  if (messageLower.includes('recycle') || messageLower.includes('device') || messageLower.includes('electronic')) {
    return "Great question! Most electronic devices can be recycled, including:\n\n Mobile phones and smartphones\n Laptops and desktop computers\n Tablets and e-readers\n Chargers and cables\n Batteries (lithium-ion and alkaline)\n Small appliances\n\nBefore recycling, always remove personal data and, if possible, remove batteries. This ensures both security and safety during the recycling process.";
  }
  
  if (messageLower.includes('point') || messageLower.includes('reward') || messageLower.includes('eco')) {
    return "EcoPoints are our reward system for recycling e-waste! Here's how it works:\n\n You earn  of e-waste recycled\n Points accumulate over time and unlock higher levels\n : Eco Beginner  Eco Champion  Eco Legend  Eco Master\n Points can be used for environmental certificates and achievements\n The more you recycle, the more you contribute to saving the planet!";
  }
  
  if (messageLower.includes('prepare') || messageLower.includes('ready') || messageLower.includes('data')) {
    return "To prepare your device for pickup:\n\n1. : Remove all personal data, photos, and accounts\n2. : Remove batteries if possible (especially lithium-ion)\n3. : Note any damage or special handling requirements\n4. : Place items in a secure, accessible location\n5. : Have your pickup request details ready\n\nOur team will handle the rest safely and professionally!";
  }
  
  if (messageLower.includes('pickup') || messageLower.includes('drone') || messageLower.includes('schedule')) {
    return "Our drone pickup service is available 24/7 and offers:\n\n : Typically arrives within 24 hours of scheduling\n : Secure handling of all e-waste items\n : Monitor your pickup progress\n : Choose your preferred pickup time\n : Trained technicians ensure proper handling\n\nJust schedule through our app and we'll take care of the rest!";
  }
  
  if (messageLower.includes('environment') || messageLower.includes('planet') || messageLower.includes('co2') || messageLower.includes('green')) {
    return "Recycling e-waste has tremendous environmental benefits:\n\n : Each kg of e-waste saves approximately 0.4kg of CO2\n : Prevents mining of rare earth metals\n : Keeps toxic materials out of landfills\n : Recycling uses less energy than mining new materials\n : Prevents toxic chemicals from contaminating water sources\n\nEvery device you recycle makes a real difference!";
  }
  
  return "I'm here to help with all your e-waste recycling questions! You can ask me about:\n\n What items can be recycled\n How to prepare devices for pickup\n Our EcoPoints reward system\n Environmental impact of recycling\n Pickup scheduling and process\n Safety guidelines and best practices\n\nWhat would you like to know more about?";
}

