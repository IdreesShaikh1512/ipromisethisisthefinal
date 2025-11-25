import { Card } from "@/components/ui/card";
import { getEmergencyCodesData } from "@/lib/morseCode";
import { AlertCircle, Droplet, Phone, Heart } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  'CALL_NURSE': <Phone className="w-6 h-6" />,
  'GET_WATER': <Droplet className="w-6 h-6" />,
  'GET_HELP': <AlertCircle className="w-6 h-6" />,
  'I_AM_IN_PAIN': <Heart className="w-6 h-6" />
};

export const EmergencyCodesChart = () => {
  const emergencyCodes = getEmergencyCodesData();
  const formatCombo = (combo: string) =>
    combo.replace(/\./g, '·').replace(/-/g, '–');

  return (
    <Card className="p-6 bg-card border-2 border-emergency">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-emergency" />
        <h2 className="text-2xl font-bold text-foreground">Emergency Codes</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Hold your eyes closed for ~1 second to arm emergency mode, then blink the short pattern below.
      </p>

      <div className="space-y-3">
        {emergencyCodes.map(({ combo, code, description }) => (
          <div 
            key={code} 
            className="flex items-center gap-4 p-4 bg-emergency/10 border-2 border-emergency/30 rounded-lg hover:bg-emergency/20 transition-colors"
          >
            <div className="text-emergency flex-shrink-0">
              {iconMap[code]}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-foreground">{code.replace(/_/g, ' ')}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
            <div className="font-mono text-xl font-bold text-emergency flex-shrink-0">
              Hold + {formatCombo(combo)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-emergency/5 rounded-lg border border-emergency/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-emergency">Important:</span> Emergency codes are automatically detected and announced immediately.
        </p>
      </div>
    </Card>
  );
};
