
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, SmilePlus, Bot, Loader2, Paperclip, Mic, StopCircle } from 'lucide-react';
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
  onSendFile: (file: File) => void;
  onSendVoiceMessage: (audioBase64: string) => void;
}

export default function MessageInput({ onSendMessage, onSendFile, onSendVoiceMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeSentimentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
            } 
        });
        const mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 128000 });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64String = reader.result as string;
            onSendVoiceMessage(base64String);
          };
          audioChunksRef.current = [];
          // Stop all media tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({
          variant: 'destructive',
          title: 'Microphone Error',
          description: 'Could not access the microphone. Please check your browser permissions.',
        });
      }
    }
  };


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
      onSendFile(file);
    }
    // Reset the input value to allow re-uploading the same file
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
          className="pr-48 min-h-[52px] resize-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
          <Button variant="ghost" size="icon" onClick={handleMicClick}>
            {isRecording ? (
                <StopCircle className="h-5 w-5 text-red-500 animate-pulse" />
            ) : (
                <Mic className="h-5 w-5" />
            )}
            <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
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
