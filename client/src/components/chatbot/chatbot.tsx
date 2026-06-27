import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Leaf } from "lucide-react";

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
      content: "Hi! I'm EcoBot, your e-waste recycling assistant. I can help you with:\n\n• Recycling questions and guidelines\n• Pickup scheduling information\n• EcoPoints and rewards system\n• Environmental impact details\n• Device preparation tips\n\nWhat would you like to know about e-waste recycling?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const now = Date.now();
    if (now - lastMessageTime < 1000) {
      setMessages(prev => [...prev, { id: generateMessageId(), role: "assistant", content: "Please wait a moment before sending another message.", timestamp: new Date() }]);
      return;
    }

    if (trimmedInput.length > 1000) {
      setMessages(prev => [...prev, { id: generateMessageId(), role: "assistant", content: "Your message is too long. Please keep it under 1000 characters.", timestamp: new Date() }]);
      return;
    }

    const userMessage: Message = { id: generateMessageId(), role: "user", content: trimmedInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastMessageTime(now);

    const sendToAPI = async () => {
      try {
        const currentMessages = [...messages, userMessage];
        const conversationHistory = currentMessages.slice(-6).map(msg => ({ role: msg.role, content: msg.content }));
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.content, history: conversationHistory }),
        });
        if (!response.ok) throw new Error("Failed to get chatbot response");
        const data = await response.json();
        setMessages(prev => [...prev, { id: generateMessageId(), role: "assistant", content: data.message, timestamp: new Date() }]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setMessages(prev => [...prev, { id: generateMessageId(), role: "assistant", content: `Sorry, I am having trouble responding right now. Error: ${errorMessage}`, timestamp: new Date() }]);
      } finally {
        setIsLoading(false);
      }
    };

    sendToAPI();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="pulse-ring" />
        <Button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-2xl shadow-eco-lg bg-gradient-to-br from-eco-primary to-eco-green hover:from-eco-green hover:to-eco-primary border-0 transition-all duration-300 hover:scale-105 group"
          size="icon"
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[520px] sm:h-[600px] max-h-[85vh] shadow-eco-xl z-50 flex flex-col rounded-3xl overflow-hidden border border-white/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-eco-primary to-eco-green px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
            <Leaf className="w-4 h-4 text-white animate-leaf-sway" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">EcoBot Assistant</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              <span className="text-white/65 text-xs">Online</span>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/15 rounded-xl text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 chatbot-messages bg-gray-50 min-h-0">
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-eco-primary to-eco-green flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[82%] px-4 py-3 rounded-2xl shadow-sm break-words ${
                message.role === "user"
                  ? "bg-gradient-to-br from-eco-primary to-eco-green text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed chat-message-content">{message.content}</p>
                <span className={`text-xs mt-2 block ${message.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-eco-primary to-eco-green flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm">
                <div className="flex space-x-1 items-center h-4">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-2 h-2 bg-eco-green rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about e-waste recycling..."
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm transition-colors"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-eco-primary to-eco-green hover:from-eco-green hover:to-eco-primary border-0 shadow-sm transition-all duration-200 hover:shadow-eco"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}

