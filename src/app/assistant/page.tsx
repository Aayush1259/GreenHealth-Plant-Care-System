"use client";

import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  ArrowLeft,
  Home,
  Send,
  Leaf,
  Bot,
  Info,
  Droplets,
  Search,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askGreenAiAssistant } from "@/ai/flows/green-ai-assistant";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const sampleQuestions = [
  "How often should I water my succulents?",
  "Why are the leaves on my plant turning yellow?",
  "What's the best fertilizer for tomato plants?",
  "What is the Gujarati name of Jasmine and Sunflower?",
];

const DEFAULT_FALLBACK =
  "I'm sorry, I couldn't retrieve specific advice right now. Please try rephrasing your plant question.";

async function fetchApiAdvice(question: string): Promise<string> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    return typeof data.advice === "string" && data.advice.trim()
      ? data.advice
      : DEFAULT_FALLBACK;
  } catch {
    return DEFAULT_FALLBACK;
  }
}

export default function GreenAIAssistantPage() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { type: "question" | "advice"; text: string; timestamp?: Date }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAskAssistant = async () => {
    if (!question.trim()) return;

    const q = question.trim();
    setQuestion("");
    setChatHistory((prev) => [
      ...prev,
      { type: "question", text: q, timestamp: new Date() },
    ]);
    setLoading(true);

    let adviceText: string;

    // 1️⃣ Try the server‑action first
    try {
      const resp = await askGreenAiAssistant({ question: q });
      adviceText =
        typeof resp.advice === "string" && resp.advice.trim()
          ? resp.advice
          : DEFAULT_FALLBACK;
    } catch (serverError) {
      console.warn("Server action failed:", serverError);
      // 2️⃣ Fallback to your API route
      adviceText = await fetchApiAdvice(q);
    }

    // 3️⃣ Finally push it into state
    setChatHistory((prev) => [
      ...prev,
      { type: "advice", text: adviceText, timestamp: new Date() },
    ]);

    toast({
      title: "Response Received",
      description: "Check out the personalized advice below.",
    });
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAssistant();
    }
  };

  const handleSampleQuestionClick = (q: string) => {
    setQuestion(q);
  };

  return (
    <div
      className={`app-container ${
        isLoaded ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500`}
    >
      {/* Header */}
      <header className="flex items-center justify-center relative border-b border-border/30 py-4 px-4">
        <div className="absolute left-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-semibold text-green-700">
            Green AI Assistant
          </h1>
        </div>
      </header>

      <section className="px-5 pt-4 pb-2 text-center">
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Ask any question about plants, gardening, or plant care and get
          personalized advice from our AI assistant.
        </p>
      </section>

      <div className="px-4 pb-20">
        <Card className="border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <CardContent className="p-0 bg-white">
            {/* Chat History */}
            <ScrollArea className="h-[calc(100vh-220px)] min-h-[450px]">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-start text-center pt-10 px-8">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                    <Bot className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Welcome to Green AI
                  </h3>
                  <p className="text-sm text-gray-600 mb-8 max-w-xs">
                    Your personal plant advisor. Ask any question about plant
                    care, identification, or gardening.
                  </p>
                  <div className="w-full max-w-md space-y-3">
                    {sampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        className="w-full text-left py-3 px-4 border border-green-100 hover:border-green-300 bg-green-50/30 rounded-lg text-gray-800 transition-all hover:shadow-sm hover:bg-green-50/60"
                        onClick={() => handleSampleQuestionClick(q)}
                      >
                        <div className="flex items-center">
                          <Search className="text-green-500 h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{q}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        item.type === "question" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          item.type === "question" ? "order-2" : "order-1"
                        }`}
                      >
                        {item.type === "advice" && (
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-green-50 text-green-600 text-xs">
                                AI
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">
                              Green AI
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp?.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-3 text-sm ${
                            item.type === "question"
                              ? "bg-green-600 text-white rounded-tr-none shadow-sm"
                              : "bg-gray-100 rounded-tl-none shadow-sm border border-gray-200/50"
                          }`}
                        >
                          {item.text}
                        </div>
                        {item.type === "question" && (
                          <div className="text-xs text-muted-foreground mt-1 text-right">
                            {item.timestamp?.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area - Make it more visually appealing */}
            <div className="flex border-t border-gray-100 p-4 gap-3 items-end bg-gray-50/50">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about plant care, gardening tips, and more..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-lg border-green-100 focus-visible:ring-green-500 shadow-sm"
              />
              <Button
                onClick={handleAskAssistant}
                disabled={loading || !question.trim()}
                className="bg-green-600 hover:bg-green-700 text-white h-12 w-12 rounded-full p-0 flex items-center justify-center shadow-sm transition-all"
                aria-label="Send message"
              >
                {loading ? <Icons.spinner className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-border/30 py-2 z-10">
        <nav className="flex justify-around max-w-md mx-auto">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-14 w-16"
            onClick={() => router.push("/")}
          >
            <Home className="h-5 w-5 text-gray-500" />
            <span className="text-xs text-gray-500 mt-1">Home</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-14 w-16"
          >
            <Bot className="h-5 w-5 text-green-600" />
            <span className="text-xs text-green-600 mt-1">Green AI</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-14 w-16"
            onClick={() => router.push("/profile")}
          >
            <Icons.user className="h-5 w-5 text-gray-500" />
            <span className="text-xs text-gray-500 mt-1">Profile</span>
          </Button>
        </nav>
      </footer>
    </div>
  );
}
