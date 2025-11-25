import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BlinkDetector, BlinkEvent } from '@/lib/blinkDetection';

interface CameraFeedProps {
  detector: BlinkDetector | null;
  onBlinkDetected: (event: BlinkEvent) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
  showDiagnostics: boolean;
  blinkCount?: number;
}

export const CameraFeed = ({ detector, onBlinkDetected, isActive, onActiveChange, showDiagnostics, blinkCount = 0 }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fps, setFps] = useState(0);
  const [earValues, setEarValues] = useState({ left: 0, right: 0, avg: 0 });
  const [isInitializing, setIsInitializing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [status, setStatus] = useState('Searching');
  const animationFrameRef = useRef<number>();
  const fpsFramesRef = useRef(0);
  const fpsLastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!detector) return;
    detector.setBlinkCallback(onBlinkDetected);
  }, [onBlinkDetected, detector]);

  const startCamera = async () => {
    if (!detector) {
      alert('Detector not ready yet. Please wait a moment and try again.');
      return;
    }

    setIsInitializing(true);
    try {
      // Initialize detector first
      await detector.initialize();

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      onActiveChange(true);
      setStatus('Tracking');
    } catch (error) {
      console.error('Error starting camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    onActiveChange(false);
    setStatus('Searching');
  };

  const startDetectionLoop = () => {
    if (!detector) return;
    const detectFrame = (timestamp: number) => {
      if (!videoRef.current) {
        return;
      }

      fpsFramesRef.current++;
      const now = Date.now();
      if (now - fpsLastUpdateRef.current >= 1000) {
        setFps(fpsFramesRef.current);
        fpsFramesRef.current = 0;
        fpsLastUpdateRef.current = now;
      }

      const result = detector.detectBlink(videoRef.current, timestamp);
      if (result) {
        setEarValues({ left: result.leftEAR, right: result.rightEAR, avg: result.avgEAR });
        setStatus('Tracking');
      } else {
        setStatus('Searching');
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  useEffect(() => {
    if (!detector) return;
    if (isActive && videoRef.current) {
      startDetectionLoop();
    } else if (!isActive && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, detector]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const threshold = detector?.getEARThreshold() || 0.200;

  return (
    <Card className="p-6 bg-slate-900/90 backdrop-blur-xl border-2 border-cyan-500/30 relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-cyan-300 mb-1">LIVE CAMERA</h2>
          <p className="text-xs text-cyan-400/80">Hands-free tracking</p>
          <p className="text-xs text-cyan-400/60 mt-1 font-mono">Threshold {threshold.toFixed(3)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={isActive ? stopCamera : startCamera}
            disabled={isInitializing || !detector}
            size="sm"
            className={!isActive ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all" : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white transition-all"}
          >
            {isInitializing ? (
              'Starting...'
            ) : isActive ? (
              'Stop Camera'
            ) : (
              'Start Camera'
            )}
          </Button>
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4 border-2 border-cyan-500/20">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <div className="text-center">
              <p className="text-cyan-400 text-lg font-mono">Camera idle</p>
              <div className="mt-2 w-16 h-1 bg-cyan-500/30 mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {showDiagnostics && isActive && (
          <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm space-y-1">
            <div>FPS: <span className="text-green-400">{fps}</span></div>
            <div>Left EAR: <span className="text-blue-400">{earValues.left.toFixed(3)}</span></div>
            <div>Right EAR: <span className="text-blue-400">{earValues.right.toFixed(3)}</span></div>
            <div>Avg EAR: <span className="text-cyan-400">{earValues.avg.toFixed(3)}</span></div>
            <div>Threshold: <span className="text-red-400">{threshold.toFixed(3)}</span></div>
          </div>
        )}
      </div>

      {/* Overlay checkbox */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={showOverlay}
          onChange={(e) => setShowOverlay(e.target.checked)}
          className="w-4 h-4 accent-cyan-400"
        />
        <span className="text-sm text-cyan-300 font-mono">✔ OVERLAY</span>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-cyan-800/60 rounded-lg p-3 border-2 border-cyan-500/60">
          <div className="text-xs text-cyan-300 mb-1 font-mono uppercase">EAR</div>
          <div className="text-lg font-mono font-semibold text-cyan-100">{earValues.avg.toFixed(3)}</div>
        </div>
        <div className="bg-blue-800/60 rounded-lg p-3 border-2 border-blue-500/60">
          <div className="text-xs text-blue-300 mb-1 font-mono uppercase">FPS</div>
          <div className="text-lg font-mono font-semibold text-blue-100">{fps}</div>
        </div>
        <div className="bg-purple-800/60 rounded-lg p-3 border-2 border-purple-500/60">
          <div className="text-xs text-purple-300 mb-1 font-mono uppercase">STATUS</div>
          <div className={`text-lg font-semibold font-mono ${status === 'Tracking' ? 'text-green-300' : 'text-purple-100'}`}>{status}</div>
        </div>
        <div className="bg-pink-800/60 rounded-lg p-3 border-2 border-pink-500/60">
          <div className="text-xs text-pink-300 mb-1 font-mono uppercase">BLINKS</div>
          <div className="text-lg font-mono font-semibold text-pink-100">{blinkCount}</div>
        </div>
      </div>
    </Card>
  );
};
