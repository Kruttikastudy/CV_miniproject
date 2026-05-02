import { useEffect, useRef } from 'react';

/**
 * Canvas overlay that draws bounding boxes on detected objects.
 * Must be positioned absolutely over the video feed.
 */
export default function DetectionOverlay({ detections, videoWidth, videoHeight }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = videoWidth || 640;
    canvas.height = videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections || detections.length === 0) return;

    detections.forEach((det, index) => {
      const [x, y, w, h] = det.bbox;
      const confidence = Math.round(det.confidence * 100);

      // Color based on detection type
      const isColor = det.label.includes('object');
      const color = isColor ? '#bf00ff' : '#00f5ff';
      const bgColor = isColor ? 'rgba(191, 0, 255, 0.15)' : 'rgba(0, 245, 255, 0.15)';

      // Draw filled box (subtle)
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);

      // Draw border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Draw corner accents
      const cornerLen = Math.min(20, w / 4, h / 4);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = color;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLen);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLen, y + h);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // Draw label background
      const label = `${det.label} ${confidence}%`;
      ctx.font = 'bold 14px "Inter", sans-serif';
      const textMetrics = ctx.measureText(label);
      const textW = textMetrics.width + 12;
      const textH = 24;
      const labelY = y > textH + 4 ? y - textH - 4 : y;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, labelY, textW, textH, 6);
      ctx.fill();

      // Draw label text
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 6, labelY + 17);
    });
  }, [detections, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="detection-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
      }}
    />
  );
}
