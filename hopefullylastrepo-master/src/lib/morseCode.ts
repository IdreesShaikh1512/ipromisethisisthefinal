// Morse Code Definitions
export const MORSE_CODE_MAP: Record<string, string> = {
  'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
  'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
  'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
  'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
  'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
  'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
  ' ': '/'
};

// Reverse map for decoding
export const MORSE_TO_CHAR = Object.entries(MORSE_CODE_MAP).reduce(
  (acc, [char, morse]) => ({ ...acc, [morse]: char }),
  {} as Record<string, string>
);

// Emergency codes triggered after a long "hold" blink followed by two signals
export const EMERGENCY_COMBOS: Record<string, string> = {
  '..': 'CALL_NURSE',
  '.-': 'GET_WATER',
  '-.': 'GET_HELP',
  '--': 'I_AM_IN_PAIN'
};

const EMERGENCY_TRIGGER_DURATION_MS = 900;
const EMERGENCY_SEQUENCE_LENGTH = 2;
const EMERGENCY_TIMEOUT_MS = 4000;

export interface MorseDecoderConfig {
  dotDurationMs: number;        // Max duration for a dot
  dashDurationMs: number;       // Min duration for a dash
  letterGapMs: number;          // Gap between dots/dashes of same letter
  wordGapMs: number;            // Gap between letters
}

export type BlinkSymbol = '.' | '-';

export class MorseDecoder {
  private config: MorseDecoderConfig;
  private currentMorse: string = '';
  private currentWord: string = '';
  private lastBlinkEndTime: number = 0;
  private onLetterCallback?: (letter: string) => void;
  private onWordCallback?: (word: string) => void;
  private onEmergencyCallback?: (code: string) => void;
  private gapCheckInterval?: number;
  private emergencyActive = false;
  private emergencySequence = '';
  private emergencyTimer?: number;

  constructor(
    config: MorseDecoderConfig,
    callbacks?: {
      onLetter?: (letter: string) => void;
      onWord?: (word: string) => void;
      onEmergency?: (code: string) => void;
    }
  ) {
    this.config = config;
    this.onLetterCallback = callbacks?.onLetter;
    this.onWordCallback = callbacks?.onWord;
    this.onEmergencyCallback = callbacks?.onEmergency;
    
    // Start gap checking
    this.startGapChecking();
  }

  private startGapChecking() {
    this.gapCheckInterval = window.setInterval(() => {
      this.checkForGaps();
    }, 50);
  }

  private checkForGaps() {
    if (!this.lastBlinkEndTime) return;
    
    const now = Date.now();
    const timeSinceLastBlink = now - this.lastBlinkEndTime;

    if (this.emergencyActive && timeSinceLastBlink > EMERGENCY_TIMEOUT_MS) {
      console.warn('Emergency input timed out. Resetting.');
      this.resetEmergencyMode();
      return;
    }

    // Check for letter gap
    if (timeSinceLastBlink > this.config.letterGapMs && this.currentMorse) {
      this.decodeLetter();
    }

    // Check for word gap
    if (timeSinceLastBlink > this.config.wordGapMs && this.currentWord) {
      this.finalizeWord();
    }
  }

  public processBlink(durationMs: number): BlinkSymbol {
    const now = Date.now();

    if (!this.emergencyActive && durationMs >= EMERGENCY_TRIGGER_DURATION_MS) {
      this.startEmergencyMode();
      this.lastBlinkEndTime = now;
      console.log('🚨 Emergency trigger detected. Awaiting code...');
      return this.classifyBlink(durationMs);
    }

    const symbol = this.classifyBlink(durationMs);

    if (this.emergencyActive) {
      this.emergencySequence += symbol;
      this.lastBlinkEndTime = now;
      this.tryResolveEmergency();
      console.log(`Emergency input: ${this.emergencySequence}`);
      return symbol;
    }

    this.currentMorse += symbol;
    this.lastBlinkEndTime = now;
    
    console.log(`Blink: ${durationMs}ms → ${symbol} | Current: ${this.currentMorse}`);
    return symbol;
  }

  private classifyBlink(durationMs: number): BlinkSymbol {
    if (durationMs <= this.config.dotDurationMs) {
      return '.';
    }

    if (durationMs >= this.config.dashDurationMs) {
      return '-';
    }

    const midpoint = (this.config.dotDurationMs + this.config.dashDurationMs) / 2;
    return durationMs <= midpoint ? '.' : '-';
  }

  private startEmergencyMode() {
    this.emergencyActive = true;
    this.emergencySequence = '';
    this.clearEmergencyTimer();
    this.emergencyTimer = window.setTimeout(() => {
      console.warn('Emergency input expired.');
      this.resetEmergencyMode();
    }, EMERGENCY_TIMEOUT_MS);
  }

  private tryResolveEmergency() {
    if (this.emergencySequence.length < EMERGENCY_SEQUENCE_LENGTH) {
      this.scheduleEmergencyTimer();
      return;
    }

    const emergencyCode = EMERGENCY_COMBOS[this.emergencySequence];
    if (emergencyCode) {
      console.log(`🚨 Emergency Code Detected: ${emergencyCode}`);
      this.onEmergencyCallback?.(emergencyCode);
    } else {
      console.warn(`Unknown emergency sequence: ${this.emergencySequence}`);
    }

    this.resetEmergencyMode();
    this.currentMorse = '';
    this.currentWord = '';
  }

  private scheduleEmergencyTimer() {
    this.clearEmergencyTimer();
    this.emergencyTimer = window.setTimeout(() => {
      console.warn('Emergency input cancelled (timeout).');
      this.resetEmergencyMode();
    }, EMERGENCY_TIMEOUT_MS);
  }

  private resetEmergencyMode() {
    this.emergencyActive = false;
    this.emergencySequence = '';
    this.clearEmergencyTimer();
  }

  private clearEmergencyTimer() {
    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer);
      this.emergencyTimer = undefined;
    }
  }

  private decodeLetter() {
    if (!this.currentMorse) return;

    // Normal morse decoding
    const char = MORSE_TO_CHAR[this.currentMorse];
    if (char) {
      console.log(`Decoded: ${this.currentMorse} → ${char}`);
      this.currentWord += char;
      this.onLetterCallback?.(char);
    } else {
      console.warn(`Unknown morse sequence: ${this.currentMorse}`);
    }
    
    this.currentMorse = '';
  }

  private finalizeWord() {
    if (!this.currentWord) return;
    
    console.log(`Word complete: ${this.currentWord}`);
    this.onWordCallback?.(this.currentWord);
    this.currentWord = '';
  }

  public reset() {
    this.currentMorse = '';
    this.currentWord = '';
    this.lastBlinkEndTime = 0;
    this.resetEmergencyMode();
  }

  public destroy() {
    if (this.gapCheckInterval) {
      clearInterval(this.gapCheckInterval);
    }
    this.clearEmergencyTimer();
  }

  public updateConfig(config: Partial<MorseDecoderConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getCurrentMorse(): string {
    return this.currentMorse;
  }

  public getCurrentWord(): string {
    return this.currentWord;
  }
}

export function getMorseChartData() {
  return {
    letters: Object.entries(MORSE_CODE_MAP)
      .filter(([char]) => char.match(/[A-Z]/))
      .map(([char, morse]) => ({ char, morse })),
    numbers: Object.entries(MORSE_CODE_MAP)
      .filter(([char]) => char.match(/[0-9]/))
      .map(([char, morse]) => ({ char, morse })),
    punctuation: Object.entries(MORSE_CODE_MAP)
      .filter(([char]) => !char.match(/[A-Z0-9 ]/))
      .map(([char, morse]) => ({ char, morse }))
  };
}

export function getEmergencyCodesData() {
  return Object.entries(EMERGENCY_COMBOS).map(([combo, code]) => ({
    combo,
    code,
    description: getEmergencyDescription(code)
  }));
}

function getEmergencyDescription(code: string): string {
  const descriptions: Record<string, string> = {
    'CALL_NURSE': 'Request immediate nurse assistance',
    'GET_WATER': 'Request water or hydration',
    'GET_HELP': 'General help request',
    'I_AM_IN_PAIN': 'Alert staff to pain or discomfort'
  };
  return descriptions[code] || code;
}
