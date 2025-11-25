import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CameraFeed } from '@/components/CameraFeed';
import { MessageDisplay } from '@/components/MessageDisplay';
import { RealTimeMorse } from '@/components/RealTimeMorse';
import { QuickPhrases } from '@/components/QuickPhrases';
import { MorseChart } from '@/components/MorseChart';
import { BlinkDetector, BlinkEvent } from '@/lib/blinkDetection';
import { MorseDecoder, type BlinkSymbol } from '@/lib/morseCode';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  isEmergency?: boolean;
}

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMorse, setCurrentMorse] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [decodedLetter, setDecodedLetter] = useState('');
  const [lastBlink, setLastBlink] = useState<{
    duration: number;
    symbol: BlinkSymbol;
    timestamp: number;
  } | null>(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionTimer, setSessionTimer] = useState('00:00');
  const [gapWindow, setGapWindow] = useState<'symbol' | 'letter' | 'word'>('symbol');
  const [timingConfig, setTimingConfig] = useState({
    dotDurationMs: 240,
    dashDurationMs: 520
  });
  const [showMorseReference, setShowMorseReference] = useState(false);
  const detectorRef = useRef<BlinkDetector | null>(null);
  const decoderRef = useRef<MorseDecoder | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const blinkCountRef = useRef(0);

  // Initialize detector once
  useEffect(() => {
    if (!detectorRef.current) {
      detectorRef.current = new BlinkDetector();
    }

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      detectorRef.current?.destroy();
      decoderRef.current?.destroy();
    };
  }, []);

  // Initialize morse decoder
  useEffect(() => {
    if (decoderRef.current) {
      decoderRef.current.destroy();
    }

    decoderRef.current = new MorseDecoder(
      {
        dotDurationMs: timingConfig.dotDurationMs,
        dashDurationMs: timingConfig.dashDurationMs,
        letterGapMs: 800,
        wordGapMs: 2000
      },
      {
        onLetter: (letter) => {
          setDecodedLetter(letter);
          setCurrentMorse('');
          setCurrentWord(decoderRef.current?.getCurrentWord() || '');
          setTimeout(() => setDecodedLetter(''), 2000);
        },
        onWord: (word) => {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: word,
            timestamp: Date.now(),
            isEmergency: false
          };
          setMessages(prev => [...prev, newMessage]);
          setCurrentWord('');
          setCurrentMorse('');
          setDecodedLetter('');
          speakText(word);
        },
        onEmergency: (code) => {
          const emergencyMessage: Message = {
            id: Date.now().toString(),
            text: `EMERGENCY: ${code}`,
            timestamp: Date.now(),
            isEmergency: true
          };
          setMessages(prev => [...prev, emergencyMessage]);
          setCurrentWord('');
          setCurrentMorse('');
          setDecodedLetter('');
          speakText(`Emergency! ${code.replace(/_/g, ' ')}`, true);
          toast.error(`🚨 EMERGENCY: ${code}`, { duration: 10000 });
        }
      }
    );
  }, []);

  useEffect(() => {
    decoderRef.current?.updateConfig({
      dotDurationMs: timingConfig.dotDurationMs,
      dashDurationMs: timingConfig.dashDurationMs
    });
  }, [timingConfig]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        setSessionTimer(`${minutes}:${seconds}`);
      }, 1000);
    } else if (!isActive) {
      setSessionTimer('00:00');
      setSessionStartTime(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, sessionStartTime]);

  // Start session when camera becomes active
  useEffect(() => {
    if (isActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
      setBlinkCount(0);
      blinkCountRef.current = 0;
    }
  }, [isActive, sessionStartTime]);

  const handleBlinkDetected = (event: BlinkEvent) => {
    console.log('Blink detected:', event);
    blinkCountRef.current += 1;
    setBlinkCount(blinkCountRef.current);
    
    const symbol = decoderRef.current?.processBlink(event.durationMs);
    if (symbol) {
      setLastBlink({
        duration: event.durationMs,
        symbol,
        timestamp: event.timestamp
      });
    }
    
    const currentMorseVal = decoderRef.current?.getCurrentMorse() || '';
    const currentWordVal = decoderRef.current?.getCurrentWord() || '';
    setCurrentMorse(currentMorseVal);
    setCurrentWord(currentWordVal);
  };

  const speakText = (text: string, urgent = false) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = urgent ? 1.2 : 1.0;
    utterance.pitch = urgent ? 1.2 : 1.0;
    utterance.volume = 1.0;
    synthRef.current.speak(utterance);
  };

  const clearMessages = () => {
    setMessages([]);
    decoderRef.current?.reset();
    setCurrentMorse('');
    setCurrentWord('');
    setDecodedLetter('');
    setLastBlink(null);
    toast.info('Messages cleared');
  };

  const formatLastBlink = () => {
    if (!lastBlink) return '--';
    const secondsAgo = Math.floor((Date.now() - lastBlink.timestamp) / 1000);
    if (secondsAgo < 1) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  };

  const totalCharacters = messages.reduce((sum, msg) => sum + msg.text.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Header */}
      <header className="border-b-2 border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mt-1">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-cyan-400 uppercase tracking-widest mb-1">HANDS-FREE MORSE COMMUNICATION</p>
                <h1 className="text-2xl font-bold gradient-text mb-2">MorseVision AI</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-cyan-400 text-cyan-400 bg-cyan-400/10 px-2 py-0.5 text-xs">
                    API ONLINE
                  </Badge>
                  <Badge variant="outline" className={`px-2 py-0.5 text-xs ${isActive ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-slate-500 text-slate-400 bg-slate-800/50"}`}>
                    CAMERA {isActive ? 'ACTIVE' : 'IDLE'}
                  </Badge>
                  <Badge variant="outline" className={`px-2 py-0.5 text-xs ${isActive ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-red-500 text-red-400 bg-red-500/20"}`}>
                    SESSION {isActive ? 'ACTIVE' : 'STOPPED'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-cyan-400 uppercase tracking-wider">SESSION TIMER</div>
                <div className="text-lg font-mono font-semibold text-cyan-300">{sessionTimer}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-400 uppercase tracking-wider">LAST BLINK</div>
                <div className="text-lg font-semibold text-cyan-300">{formatLastBlink()}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMorseReference(!showMorseReference)}
                className="border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 transition-all"
              >
                Morse Reference
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 2x2 Grid */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-2 gap-6">
          {/* Top Row */}
          {/* Live Camera - Top Left */}
          <div className="col-span-1">
            <CameraFeed
              detector={detectorRef.current}
              onBlinkDetected={handleBlinkDetected}
              isActive={isActive}
              onActiveChange={setIsActive}
              showDiagnostics={showDiagnostics}
              blinkCount={blinkCount}
            />
          </div>

          {/* Top Right Column - Stack Real-time Morse and Quick Phrases */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Real-time Morse */}
            <RealTimeMorse
              currentMorse={currentMorse}
              decodedLetter={decodedLetter}
              lastBlinkDuration={lastBlink?.duration ?? null}
              symbolType={lastBlink?.symbol ?? null}
              gapWindow={gapWindow}
              onGapWindowChange={setGapWindow}
              currentWord={currentWord}
            />

            {/* Quick Phrases - Moved up */}
            <QuickPhrases />
          </div>

          {/* Bottom Row */}
          {/* Decoded Message - Bottom Left */}
          <div className="col-span-1">
            <MessageDisplay
              messages={messages}
              currentMorse={currentMorse}
              currentWord={currentWord}
              onClear={clearMessages}
              onSpeak={speakText}
              characterCount={totalCharacters}
              blinkCount={blinkCount}
            />
          </div>
        </div>

        {/* Morse Reference Modal/Expanded View */}
        {showMorseReference && (
          <div className="mt-6">
            <MorseChart />
          </div>
        )}

        {/* Morse Codes on Homepage */}
        <div className="mt-6">
          <MorseChart />
        </div>
      </main>
    </div>
  );
};

export default Index;
