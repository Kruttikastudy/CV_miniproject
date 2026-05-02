import { useEffect, useRef, useCallback } from 'react';
import DetectionOverlay from './DetectionOverlay';

/**
 * Live camera feed component with detection overlay.
 * Periodically captures frames and sends them for processing.
 */
export default function CameraFeed({
  videoRef,
  canvasRef,
  isReady,
  error,
  dimensions,
  detections,
  isCapturing,
  onCaptureFrame,
}) {
  const captureIntervalRef = useRef(null);

  // Start/stop frame capture loop
  useEffect(() => {
    if (isCapturing && isReady) {
      captureIntervalRef.current = setInterval(() => {
        onCaptureFrame();
      }, 500); // every 500ms
    } else {
      clearInterval(captureIntervalRef.current);
    }

    return () => clearInterval(captureIntervalRef.current);
  }, [isCapturing, isReady, onCaptureFrame]);

  return (
    <div className="camera-container relative">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-xl"
        style={{ transform: 'scaleX(-1)' }} // Mirror for natural feel
      />

      {/* Detection overlay */}
      <DetectionOverlay
        detections={detections}
        videoWidth={dimensions.width}
        videoHeight={dimensions.height}
      />

      {/* Camera status indicators */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 rounded-xl">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Starting camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/90 rounded-xl">
          <div className="text-center p-6">
            <span className="text-4xl mb-3 block">📷</span>
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-slate-500 text-sm mt-2">
              Make sure to allow camera access in your browser
            </p>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isCapturing && isReady && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-white font-medium">LIVE</span>
        </div>
      )}

      {/* Detection count */}
      {detections.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span className="text-xs text-cyan-400 font-mono">
            {detections.length} object{detections.length !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}
    </div>
  );
}
