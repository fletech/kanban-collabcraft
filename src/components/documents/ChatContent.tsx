import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatContentProps {
  messages: Array<{ role: string; content: string }>;
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

export const ChatContent = ({
  messages,
  onSendMessage,
  loading,
}: ChatContentProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full">
      <div className="flex-1 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm">Start a conversation about this document</p>
            <p className="text-xs text-gray-400">
              Ask questions or request specific information
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 items-start",
                msg.role === "assistant" ? "justify-start" : "justify-end"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
              )}
              <div
                className={cn(
                  "px-3 py-2 rounded-lg max-w-[80%] text-sm",
                  msg.role === "assistant"
                    ? "bg-white border shadow-sm"
                    : "bg-blue-500 text-white"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-lg border shadow-sm">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask something about the document..."
          disabled={loading}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || loading}
          size="icon"
          className="h-8 w-8"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
