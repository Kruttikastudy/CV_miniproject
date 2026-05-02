import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage webcam access and frame capture.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });

  /**
   * Start the webcam stream.
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          const { videoWidth, videoHeight } = videoRef.current;
          setDimensions({ width: videoWidth, height: videoHeight });
          videoRef.current.play();
          setIsReady(true);
        };
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions.');
      setIsReady(false);
    }
  }, []);

  /**
   * Stop the webcam stream.
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  /**
   * Capture the current frame as a base64-encoded JPEG string.
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Maintain aspect ratio for AI processing (max 640px wide)
    const maxWidth = 640;
    const scale = maxWidth / video.videoWidth;
    canvas.width = maxWidth;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, [isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isReady,
    error,
    dimensions,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
