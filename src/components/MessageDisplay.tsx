import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  isEmergency?: boolean;
}

interface MessageDisplayProps {
  messages: Message[];
  currentMorse: string;
  currentWord: string;
  onClear: () => void;
  onSpeak: (text: string) => void;
  characterCount: number;
  blinkCount: number;
}

export const MessageDisplay = ({ 
  messages, 
  currentMorse, 
  currentWord,
  onClear,
  onSpeak,
  characterCount,
  blinkCount
}: MessageDisplayProps) => {
  const [copied, setCopied] = useState(false);
  
  // Combine all messages into a single decoded message
  const decodedMessage = messages.map(m => m.text).join(' ');

  const handleCopy = async () => {
    if (decodedMessage) {
      await navigator.clipboard.writeText(decodedMessage);
      setCopied(true);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (decodedMessage) {
      onSpeak(decodedMessage);
    }
  };

  return (
    <Card className="p-6 bg-slate-900/90 backdrop-blur-xl border-2 border-pink-500/30 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-pink-300 mb-1">DECODED MESSAGE</h2>
          <p className="text-xs text-pink-400/80 font-mono">{characterCount} characters • {blinkCount} blinks</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={handleSpeak}
          variant="default"
          size="sm"
          disabled={!decodedMessage}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Speak
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          disabled={!decodedMessage}
          className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 transition-all"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button
          onClick={onClear}
          variant="outline"
          size="sm"
          disabled={!decodedMessage}
          className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 transition-all"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Message Display Area */}
      <div className="p-4 bg-pink-800/40 rounded-lg min-h-[150px] border-2 border-pink-500/50">
        <textarea
          readOnly
          value={decodedMessage || 'Waiting for blinks...'}
          className="w-full h-full bg-transparent border-none outline-none resize-none text-pink-100 text-base font-mono placeholder-pink-400/50"
          placeholder="Waiting for blinks..."
        />
      </div>
    </Card>
  );
};
