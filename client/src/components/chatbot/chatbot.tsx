import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm EcoBot, your e-waste recycling assistant. I can help you with:\n\n Recycling questions and guidelines\n Pickup scheduling information\n EcoPoints and rewards system\n Environmental impact details\n Device preparation tips\n\nWhat would you like to know about e-waste recycling?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateMessageId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    
    // Rate limiting - prevent spam
    const now = Date.now();
    if (now - lastMessageTime < 1000) { // 1 second between messages
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: "Please wait a moment before sending another message.",
          timestamp: new Date(),
        },
      ]);
      return;
    }
    
    // Basic input validation
    if (trimmedInput.length > 1000) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: "Your message is too long. Please keep it under 1000 characters.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    // show user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastMessageTime(now);

    // Use a callback approach to ensure we have the latest state
    const sendToAPI = async () => {
      try {
        // Get the current messages state to build conversation history
        const currentMessages = [...messages, userMessage];
        const conversationHistory = currentMessages.slice(-6).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        console.log("Current messages state:", messages.length);
        console.log("Messages after adding user message:", currentMessages.length);
        console.log("Conversation history being sent:", conversationHistory);

        console.log("Sending to API:", {
          message: userMessage.content,
          historyLength: conversationHistory.length,
          history: conversationHistory
        });
        
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            history: conversationHistory,
          }),
        });

        if (!response.ok) throw new Error("Failed to get chatbot response");

        const data = await response.json();
        console.log("API Response:", data);
        console.log("Adding assistant message to conversation");

        const assistantMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: "assistant",
            content: `Sorry, I'm having trouble responding right now. Error: ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    // Execute the API call
    sendToAPI();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg z-50 bg-eco-primary hover:bg-eco-green"
        size="icon"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[450px] sm:h-[600px] max-h-[85vh] shadow-2xl border-2 border-gray-200 z-50 flex flex-col bg-white">
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-2 sm:pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-eco-primary" />
          <span className="hidden sm:inline">EcoBot Assistant</span>
          <span className="sm:hidden">EcoBot</span>
        </CardTitle>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="w-7 h-7 sm:w-8 sm:h-8"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0 min-h-0">
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 chatbot-messages bg-gray-50"
          style={{ minHeight: "300px" }}
        >
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-eco-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-xl break-words shadow-sm ${
                    message.role === "user"
                      ? "bg-eco-primary text-white rounded-br-md ml-auto"
                      : "bg-gray-50 text-gray-900 rounded-bl-md border border-gray-200"
                  }`}
                >
                  <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed chat-message-content">
                    {message.content}
                  </p>
                  <span className={`text-xs opacity-60 mt-2 block ${
                    message.role === "user" ? "text-white/80" : "text-gray-500"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-eco-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-eco-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-eco-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-eco-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 pt-2 sm:pt-3 border-t bg-white">
          <div className="flex gap-2 mb-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about e-waste recycling..."
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base border-gray-300 focus:border-eco-primary focus:ring-eco-primary"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-eco-primary hover:bg-eco-green"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          {}
          <div className="text-xs text-gray-400 text-center">
            <span className="mr-2">Messages: {messages.length}</span>
            <span className="mr-2">|</span>
            <span className="mr-2">Loading: {isLoading ? 'Yes' : 'No'}</span>
            <span className="mr-2">|</span>
            <span>History: {messages.slice(-6).length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

