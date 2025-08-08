'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'success' | 'error';
  warnings?: string[];
  changes?: unknown[];
}

interface AIChatInterfaceProps {
  userId: string;
}

interface FeedbackResponse {
  success: boolean;
  planId?: string;
  toVersion?: number;
  updatedWeeks?: unknown[];
  warnings?: string[];
  error?: string;
  explanation?: string;
}

export default function AIChatInterface({ userId }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI training coach. I can help you modify your training plan, answer questions about your workouts, and provide personalized recommendations. What would you like to know?",
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processMessage = async (messageContent: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add a temporary assistant message
    const tempAssistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempAssistantMessage]);

    try {
      const response = await fetch('/api/planFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          planId: 'current-plan',
          userId,
        }),
      });

      const data: FeedbackResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process your request');
      }

      // Update the temporary message with the response
      const assistantMessage: Message = {
        id: tempAssistantMessage.id,
        content: generateResponseContent(data, userMessage.content),
        role: 'assistant',
        timestamp: new Date(),
        status: 'success',
        warnings: data.warnings,
        changes: data.updatedWeeks,
      };

      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantMessage.id ? assistantMessage : msg
      ));
    } catch (error) {
      // Update the temporary message with error
      const errorMessage: Message = {
        id: tempAssistantMessage.id,
        content: `I'm sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
        role: 'assistant',
        timestamp: new Date(),
        status: 'error',
      };

      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantMessage.id ? errorMessage : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponseContent = (data: FeedbackResponse, userMessage: string): string => {
    // If there's an explanation, return it directly
    if (data.explanation) {
      return data.explanation;
    }
    
    if (data.warnings && data.warnings.length > 0) {
      return `I've processed your request: "${userMessage}". 

✅ **Changes Applied:**
${data.updatedWeeks ? `- Updated ${data.updatedWeeks.length} week(s) in your training plan` : '- Your training plan has been modified'}

⚠️ **Warnings:**
${data.warnings.map((warning: string) => `- ${warning}`).join('\n')}

Your training plan has been updated successfully! You can view the changes in your dashboard.`;
    } else {
      return `I've successfully processed your request: "${userMessage}". 

✅ **Changes Applied:**
${data.updatedWeeks ? `- Updated ${data.updatedWeeks.length} week(s) in your training plan` : '- Your training plan has been modified'}

Your training plan has been updated successfully! You can view the changes in your dashboard.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const messageContent = inputValue.trim();
    setInputValue('');
    await processMessage(messageContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;
      
      const messageContent = inputValue.trim();
      setInputValue('');
      void processMessage(messageContent);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-white dark:bg-gray-900 md:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
            <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Training Coach</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything about your training plan</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-green-100 rounded-full dark:bg-green-900/30">
                <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {message.status === 'sending' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing your request...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {message.warnings && message.warnings.length > 0 && (
                    <div className="p-3 mt-3 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <h4 className="mb-1 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        ⚠️ Warnings:
                      </h4>
                      <ul className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                        {message.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-green-600 rounded-full">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about your training plan, request changes, or get advice..."
              className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 resize-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-green-400"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white transition-colors bg-green-600 rounded-2xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "Move my long run to Saturday",
            "Reduce Tuesday's workout intensity",
            "Add an extra rest day this week",
            "What should I do if I'm feeling tired?"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 text-xs text-gray-700 transition-colors bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
