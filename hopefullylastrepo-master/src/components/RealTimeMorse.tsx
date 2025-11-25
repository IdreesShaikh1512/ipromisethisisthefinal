import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BlinkSymbol } from '@/lib/morseCode';

interface RealTimeMorseProps {
  currentMorse: string;
  decodedLetter: string;
  lastBlinkDuration: number | null;
  symbolType: BlinkSymbol | null;
  gapWindow: 'symbol' | 'letter' | 'word';
  onGapWindowChange: (window: 'symbol' | 'letter' | 'word') => void;
  currentWord: string;
}

export const RealTimeMorse = ({
  currentMorse,
  decodedLetter,
  lastBlinkDuration,
  symbolType,
  gapWindow,
  onGapWindowChange,
  currentWord
}: RealTimeMorseProps) => {
  // Format morse code with spaces between symbols
  const formatMorse = (morse: string) => {
    if (!morse) return '— — — — —';
    return morse.split('').map(char => char === '.' ? '·' : '—').join(' ');
  };

  return (
    <Card className="p-6 bg-slate-900/90 backdrop-blur-xl border-2 border-purple-500/30 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-purple-300 mb-1">REAL-TIME MORSE</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-purple-400/80">Live decoding</p>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Morse Input Display */}
      <div className="mb-6 p-6 bg-purple-800/40 rounded-lg min-h-[120px] flex items-center justify-center border-2 border-purple-500/50">
        <div className="text-3xl font-mono font-bold text-purple-100">
          {formatMorse(currentMorse)}
        </div>
      </div>

      {/* Decoding Information */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between bg-purple-800/50 rounded p-3 border-2 border-purple-500/40">
          <span className="text-xs text-purple-300 uppercase font-mono">Decoded Letter</span>
          <span className="text-xl font-bold text-purple-100">{decodedLetter || '--'}</span>
        </div>
        <div className="flex items-center justify-between bg-purple-800/50 rounded p-3 border-2 border-purple-500/40">
          <span className="text-xs text-purple-300 uppercase font-mono">Last Blink Duration</span>
          <span className="text-sm font-mono text-purple-100">
            {lastBlinkDuration !== null ? `${lastBlinkDuration} ms` : '--'}
          </span>
        </div>
        <div className="flex items-center justify-between bg-purple-800/50 rounded p-3 border-2 border-purple-500/40">
          <span className="text-xs text-purple-300 uppercase font-mono">Symbol Type</span>
          <Badge 
            variant="outline" 
            className={symbolType === '.' ? 'border-cyan-400 text-cyan-300 bg-cyan-800/40' : symbolType === '-' ? 'border-pink-400 text-pink-300 bg-pink-800/40' : 'border-slate-600 text-slate-400 bg-slate-800/40'}
          >
            {symbolType === '.' ? 'DOT' : symbolType === '-' ? 'DASH' : '--'}
          </Badge>
        </div>
      </div>

      {/* Gap Window Controls */}
      <div className="mb-4">
        <p className="text-xs text-purple-400/70 uppercase mb-2 font-mono">Gap Window</p>
        <div className="flex gap-2">
          <Button
            variant={gapWindow === 'symbol' ? 'default' : 'outline'}
            size="sm"
            className={gapWindow === 'symbol' ? 'rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs uppercase' : 'rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs uppercase'}
            onClick={() => onGapWindowChange('symbol')}
          >
            Symbol
          </Button>
          <Button
            variant={gapWindow === 'letter' ? 'default' : 'outline'}
            size="sm"
            className={gapWindow === 'letter' ? 'rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs uppercase' : 'rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs uppercase'}
            onClick={() => onGapWindowChange('letter')}
          >
            Letter
          </Button>
          <Button
            variant={gapWindow === 'word' ? 'default' : 'outline'}
            size="sm"
            className={gapWindow === 'word' ? 'rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs uppercase' : 'rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs uppercase'}
            onClick={() => onGapWindowChange('word')}
          >
            Word
          </Button>
        </div>
      </div>

      {/* Current Word */}
      <div className="flex items-center justify-between pt-2 border-t-2 border-purple-500/40 bg-purple-800/50 rounded p-3">
        <span className="text-xs text-purple-300 uppercase font-mono">Current Word</span>
        <span className="text-lg font-bold text-purple-100 font-mono">{currentWord || '--'}</span>
      </div>
    </Card>
  );
};
