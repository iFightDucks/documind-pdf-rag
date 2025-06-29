"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

interface ChatProps {
  documentId?: string;
  isDocumentReady?: boolean;
  messages?: Message[];
  updateMessages?: (messages: Message[]) => void;
}

export default function Chat({ 
  documentId, 
  isDocumentReady = false,
  messages = [],
  updateMessages 
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!isDocumentReady) {
      toast.error("Please upload and wait for a document to be processed first");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const newMessages = [...messages, userMessage];
    updateMessages?.(newMessages);
    
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          document_id: documentId,
          conversation_history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        sources: result.sources?.map((source: any) => source.page_number).filter(Boolean) || [],
      };

      const finalMessages = [...newMessages, assistantMessage];
      updateMessages?.(finalMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      
      const errorMessages = [...newMessages, errorMessage];
      updateMessages?.(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === 'user';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-nishta-mocha text-nishta-cream">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`p-3 ${
              isUser 
                ? 'bg-nishta-mocha text-nishta-cream border-nishta-mocha' 
                : 'bg-nishta-taupe text-nishta-charcoal border-nishta-taupe'
            }`}>
            <div className="text-sm font-space-mono">
              {isUser ? (
                <p>{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Sources:</p>
                <div className="flex flex-wrap gap-1">
                  {message.sources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      Page {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <span className="text-xs opacity-70">
                {message.timestamp}
              </span>
              
              {!isUser && (
                <div className="flex items-center space-x-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content)}
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </Card>
          </motion.div>
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-nishta-espresso text-nishta-cream">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-nishta-cream dark:bg-nishta-charcoal border-l border-nishta-taupe dark:border-nishta-mocha flex flex-col"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-4 border-b border-nishta-taupe dark:border-nishta-mocha flex-shrink-0 bg-nishta-sand dark:bg-nishta-espresso"
      >
        <div className="flex items-center justify-between">
      <div>
            <h2 className="text-lg font-serif text-nishta-charcoal dark:text-nishta-cream">AI Assistant</h2>
            <p className="text-sm font-space-mono text-nishta-espresso dark:text-nishta-taupe">
              {isDocumentReady 
                ? "Ask questions about your document" 
                : "Upload a document to start chatting"
              }
            </p>
          </div>
          <motion.div
            animate={{ 
              scale: isDocumentReady ? [1, 1.1, 1] : 1,
              opacity: isDocumentReady ? [1, 0.8, 1] : 1 
            }}
            transition={{ duration: 1.5, repeat: isDocumentReady ? Infinity : 0 }}
          >
            <Badge variant={isDocumentReady ? "default" : "secondary"} className={isDocumentReady ? "bg-nishta-mocha text-nishta-cream font-space-mono text-xs" : "bg-nishta-taupe text-nishta-espresso font-space-mono text-xs"}>
              {isDocumentReady ? "Ready" : "Waiting"}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Bot className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-muted-foreground"
            >
              {isDocumentReady 
                ? "Start a conversation by asking a question about your document"
                : "Upload a PDF document to begin chatting with AI"
              }
            </motion.p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-3"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-nishta-mocha text-nishta-cream">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Bot className="h-4 w-4" />
                </motion.div>
              </AvatarFallback>
            </Avatar>
            <Card className="p-3 bg-nishta-taupe text-nishta-charcoal border-nishta-taupe max-w-[70%]">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4 text-nishta-espresso" />
                </motion.div>
                <motion.span 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm font-space-mono text-nishta-espresso"
                >
                  AI is thinking...
                </motion.span>
              </div>
            </Card>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="p-4 border-t border-nishta-taupe dark:border-nishta-mocha flex-shrink-0 bg-nishta-sand dark:bg-nishta-espresso"
      >
        <div className="flex space-x-2">
        <Input
            ref={inputRef}
            placeholder={
              isDocumentReady 
                ? "Ask a question about your document..." 
                : documentId 
                ? "Document processing... You can still try asking questions"
                : "Upload a document first..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!documentId || isLoading}
            className="flex-1 bg-nishta-cream dark:bg-nishta-charcoal border-nishta-taupe dark:border-nishta-mocha text-nishta-charcoal dark:text-nishta-cream font-space-mono placeholder:text-nishta-espresso/70"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSendMessage}
              disabled={!documentId || !inputValue.trim() || isLoading}
              size="sm"
              className="bg-nishta-mocha hover:bg-nishta-espresso text-nishta-cream"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
        </Button>
          </motion.div>
      </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-xs text-muted-foreground/80 mt-2"
        >
          Press Enter to send, Shift+Enter for new line
        </motion.p>
      </motion.div>
    </motion.div>
  );
}