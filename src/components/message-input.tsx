"use client"

import React, { useState, useRef } from 'react';
import { Send, SmilePlus, Bot, Loader2, Paperclip } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { analyzeSentiment } from '@/ai/flows/analyze-sentiment';
import type { AnalyzeSentimentOutput } from '@/ai/flows/analyze-sentiment';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeSentimentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeSentiment({ message });
      setAnalysis(result);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze message sentiment. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
    setAnalysis(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
      // Here you would handle the file upload logic
      toast({
        title: "File Selected",
        description: `${file.name}`,
      });
    }
    event.target.value = ''; 
  };

  const sentimentBadgeVariant = (sentiment?: string): VariantProps<typeof badgeVariants>['variant'] => {
    switch (sentiment?.toLowerCase()) {
        case 'positive':
            return 'success';
        case 'negative':
            return 'destructive';
        case 'neutral':
            return 'secondary';
        default:
            return 'default';
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      {analysis && (
        <Alert className="mb-4">
          <Bot className="h-4 w-4" />
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTitle className="font-semibold">Tone Analysis</AlertTitle>
                <Badge variant={sentimentBadgeVariant(analysis.sentiment)}>{analysis.sentiment}</Badge>
              </div>
              <AlertDescription>{analysis.analysis}</AlertDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>Close</Button>
          </div>
        </Alert>
      )}
      <div className="relative">
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-40 min-h-[52px] resize-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button variant="ghost" size="icon" onClick={handleAttachmentClick}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SmilePlus className="h-5 w-5" />
            )}
            <span className="sr-only">Analyze Sentiment</span>
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
