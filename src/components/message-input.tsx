
"use client"

import React, { useState, useRef } from 'react';
import { Send, Bot, Paperclip, Mic, StopCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import FilePreviewModal from './file-preview-modal';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (base64: string, file: File, caption: string) => void;
  onSendVoiceMessage: (audioBase64: string) => void;
  isAutoReplyActive: boolean;
  onToggleAutoReply: () => void;
}

const MAX_FILE_SIZE_BYTES = 1048576; // 1MB Firestore limit

export default function MessageInput({ onSendMessage, onSendFile, onSendVoiceMessage, isAutoReplyActive, onToggleAutoReply }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

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
                autoGainControl: false,
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


  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
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
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `The file must be less than 1MB.`,
        });
        event.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewSrc(e.target?.result as string);
        setPreviewFile(file);
      };
      reader.readAsDataURL(file);
    }
     if(event.target) event.target.value = '';
  };

  const handleSendFileWithCaption = (caption: string) => {
    if (previewFile && previewSrc) {
        onSendFile(previewSrc, previewFile, caption);
    }
    handleClosePreview();
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewSrc(null);
  };
  
  return (
    <>
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={handleClosePreview}
        file={previewFile}
        fileSrc={previewSrc}
        onSend={handleSendFileWithCaption}
      />
      <div className="p-4 border-t bg-background">
        <div className="relative">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-48 min-h-[52px] resize-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            
            <Button variant="ghost" size="icon" onClick={handleAttachmentClick}>
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={onToggleAutoReply} className={cn(isAutoReplyActive && "text-primary bg-primary/10")}>
                <Bot className="h-5 w-5" />
              <span className="sr-only">Toggle AI Auto-Reply</span>
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
    </>
  );
}
