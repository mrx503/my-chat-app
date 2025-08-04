
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ReportClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, customReason?: string) => void;
}

const reportReasons = [
  "Spam or misleading",
  "Nudity or sexual content",
  "Hate speech or symbols",
  "Violence or dangerous organizations",
  "Stolen or copyrighted content",
  "Other",
];

export default function ReportClipModal({ isOpen, onClose, onSubmit }: ReportClipModalProps) {
  const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    onSubmit(selectedReason, selectedReason === 'Other' ? customReason : undefined);
    // The parent component will handle closing the modal after submission is complete.
    // Reset state in case modal is reopened for another report
    setTimeout(() => {
        setIsSubmitting(false);
        setSelectedReason(reportReasons[0]);
        setCustomReason("");
    }, 1000)
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report Clip</DialogTitle>
          <DialogDescription>
            Help us understand the problem. What is wrong with this clip?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reportReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason}>{reason}</Label>
              </div>
            ))}
          </RadioGroup>
          
          {selectedReason === 'Other' && (
            <Textarea
              placeholder="Please provide more details..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          )}
        </div>
        
        <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || (selectedReason === "Other" && !customReason.trim())}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
