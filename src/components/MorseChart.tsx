import { Card } from "@/components/ui/card";
import { getMorseChartData, getEmergencyCodesData } from "@/lib/morseCode";

export const MorseChart = () => {
  const { letters, numbers } = getMorseChartData();
  const emergencyCodes = getEmergencyCodesData();

  return (
    <Card className="p-6 bg-slate-900/90 backdrop-blur-xl border-2 border-indigo-500/30 relative">
      <h2 className="text-xl font-bold mb-4 text-indigo-300">Morse Reference</h2>
      
      <div className="space-y-6 max-h-[600px] overflow-y-auto">
        {/* Letters */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-cyan-400 font-mono uppercase">Alphabets (A-Z)</h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {letters.map(({ char, morse }) => (
              <div key={char} className="flex flex-col items-center p-2 bg-cyan-800/50 rounded border-2 border-cyan-500/50 hover:border-cyan-400/70 transition-all">
                <span className="text-lg font-bold text-cyan-100">{char}</span>
                <span className="text-xs font-mono text-cyan-300 mt-1">{morse}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-cyan-400 font-mono uppercase">Digits (0-9)</h3>
          <div className="grid grid-cols-5 gap-2">
            {numbers.map(({ char, morse }) => (
              <div key={char} className="flex flex-col items-center p-2 bg-cyan-800/50 rounded border-2 border-cyan-500/50 hover:border-cyan-400/70 transition-all">
                <span className="text-lg font-bold text-cyan-100">{char}</span>
                <span className="text-xs font-mono text-cyan-300 mt-1">{morse}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Codes */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-pink-400 font-mono uppercase">Emergency Codes</h3>
          <div className="space-y-2">
            {emergencyCodes.map(({ combo, code, description }) => (
              <div key={code} className="flex items-center justify-between p-3 bg-pink-800/50 border-2 border-pink-500/50 rounded hover:border-pink-400/70 transition-all">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-pink-100 font-mono">{code.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-pink-300/90">{description}</div>
                </div>
                <div className="font-mono text-sm font-bold text-pink-200 ml-2">
                  {combo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
