import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings, CheckCircle2 } from 'lucide-react';
import { BlinkDetector } from '@/lib/blinkDetection';
import { motion } from 'framer-motion';

interface CalibrationPanelProps {
  detector: BlinkDetector | null;
  isActive: boolean;
}

export const CalibrationPanel = ({ detector, isActive }: CalibrationPanelProps) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [calibrationResult, setCalibrationResult] = useState<{
    threshold: number;
    avgEAR: number;
  } | null>(null);

  useEffect(() => {
    if (!isCalibrating || !detector) return;

    const interval = setInterval(() => {
      const prog = detector.getCalibrationProgress();
      setProgress(prog);

      if (prog >= 100) {
        const result = detector.finishCalibration();
        if (result) {
          setCalibrationResult(result);
        }
        setIsCalibrating(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCalibrating, detector]);

  const startCalibration = () => {
    if (!detector || !isActive) {
      alert('Please start the camera first');
      return;
    }

    setIsCalibrating(true);
    setProgress(0);
    setCalibrationResult(null);
    detector.startCalibration();
  };

  return (
    <Card className="p-6 bg-card border-2 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Calibration</h2>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          Calibrate the system to detect your unique blink patterns accurately. 
          This takes about 5 seconds.
        </p>

        {!isCalibrating && !calibrationResult && (
          <Button
            onClick={startCalibration}
            disabled={!isActive}
            size="lg"
            className="w-full"
          >
            <Settings className="w-5 h-5 mr-2" />
            Start Calibration
          </Button>
        )}

        {isCalibrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="text-xl font-bold text-primary mb-2">Keep your eyes open and relaxed</p>
              <p className="text-sm text-muted-foreground">Looking naturally at the camera...</p>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              Calibrating... {Math.round(progress)}%
            </p>
          </motion.div>
        )}

        {calibrationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-medical-green">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-bold">Calibration Complete!</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Average EAR</div>
                <div className="text-2xl font-bold text-foreground">
                  {calibrationResult.avgEAR.toFixed(3)}
                </div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Threshold</div>
                <div className="text-2xl font-bold text-primary">
                  {calibrationResult.threshold.toFixed(3)}
                </div>
              </div>
            </div>

            <Button
              onClick={startCalibration}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Re-calibrate
            </Button>
          </motion.div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> Calibrate in good lighting with the camera at eye level for best results.
          </p>
        </div>
      </div>
    </Card>
  );
};
