import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Gauge, Zap } from 'lucide-react';
import type { BlinkSymbol } from '@/lib/morseCode';

interface BlinkTuningPanelProps {
  lastBlink: {
    duration: number;
    symbol: BlinkSymbol;
    timestamp: number;
  } | null;
  config: {
    dotDurationMs: number;
    dashDurationMs: number;
  };
  onConfigChange: (update: { dotDurationMs?: number; dashDurationMs?: number }) => void;
}

const presets = [
  { label: 'Fast Blink', dot: 180, dash: 360 },
  { label: 'Balanced', dot: 240, dash: 520 },
  { label: 'Slow Blink', dot: 320, dash: 720 }
];

export const BlinkTuningPanel = ({ lastBlink, config, onConfigChange }: BlinkTuningPanelProps) => {
  const handleDotChange = (value: number[]) => {
    onConfigChange({ dotDurationMs: value[0] });
  };

  const handleDashChange = (value: number[]) => {
    onConfigChange({ dashDurationMs: value[0] });
  };

  const symbolLabel = lastBlink ? (lastBlink.symbol === '.' ? 'DOT ·' : 'DASH –') : 'Waiting...';
  const symbolColor = lastBlink
    ? lastBlink.symbol === '.'
      ? 'text-primary bg-primary/10 border-primary/40'
      : 'text-emergency bg-emergency/10 border-emergency/40'
    : 'text-muted-foreground bg-muted border-border';

  return (
    <Card className="p-6 bg-card border-2 border-border space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Blink Tuning</h2>
      </div>

      <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Last Blink</p>
            <p className="text-3xl font-bold text-foreground">
              {lastBlink ? `${Math.round(lastBlink.duration)}ms` : '—'}
            </p>
          </div>
          <Badge className={`text-base px-3 py-1 border ${symbolColor}`}>
            {symbolLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust thresholds until quick blinks show as DOT and held blinks show as DASH.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Zap className="w-4 h-4" />
              Dot Threshold
            </div>
            <span className="font-mono text-lg text-foreground">{config.dotDurationMs}ms</span>
          </div>
          <Slider
            min={120}
            max={500}
            step={10}
            value={[config.dotDurationMs]}
            onValueChange={handleDotChange}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Gauge className="w-4 h-4" />
              Dash Threshold
            </div>
            <span className="font-mono text-lg text-foreground">{config.dashDurationMs}ms</span>
          </div>
          <Slider
            min={300}
            max={900}
            step={10}
            value={[config.dashDurationMs]}
            onValueChange={handleDashChange}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => onConfigChange({ dotDurationMs: preset.dot, dashDurationMs: preset.dash })}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

