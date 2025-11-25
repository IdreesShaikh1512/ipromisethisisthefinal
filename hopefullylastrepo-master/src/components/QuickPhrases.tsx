import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEmergencyCodesData } from '@/lib/morseCode';
import { Phone, Droplet, AlertCircle, Heart, Clock } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'CALL_NURSE': <Phone className="w-5 h-5 text-slate-300" />,
  'GET_WATER': <Droplet className="w-5 h-5 text-slate-300" />,
  'GET_HELP': <AlertCircle className="w-5 h-5 text-slate-300" />,
  'I_AM_IN_PAIN': <Heart className="w-5 h-5 text-slate-300" />
};

export const QuickPhrases = () => {
  const emergencyCodes = getEmergencyCodesData();

  return (
    <Card className="p-6 bg-slate-900/90 backdrop-blur-xl border-2 border-amber-500/30 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 mb-1">QUICK PHRASES</h2>
          <p className="text-xs text-amber-400/80 font-mono">Emergency macros</p>
        </div>
        <Badge variant="outline" className="border-amber-400 text-amber-400 bg-amber-400/10 px-2 py-1 text-xs">
          HOLD + PATTERN
        </Badge>
      </div>

      <div className="space-y-3">
        {emergencyCodes.map(({ combo, code, description }) => (
          <div 
            key={code} 
            className="flex items-center gap-3 p-3 bg-amber-900/60 rounded-lg border-2 border-amber-500/50 hover:border-amber-400/70 transition-all"
          >
            <div className="text-amber-200 flex-shrink-0">
              {iconMap[code] || <Clock className="w-5 h-5 text-amber-200" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-amber-100 font-semibold mb-1 font-mono">{code.replace(/_/g, ' ')}</div>
              <div className="text-xs text-amber-300/90">{description}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-400/60 text-amber-200 bg-amber-900/40 hover:bg-amber-800/60 text-xs whitespace-nowrap font-mono transition-all"
            >
              Hold + {combo}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
