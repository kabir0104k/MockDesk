import { useRef, useEffect } from 'react';
import { AttemptRecord } from '@/types/test';

interface Props {
  history: AttemptRecord[];
}

export default function PerformanceChart({ history }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 30, left: 40 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Get CSS variable
    const style = getComputedStyle(canvas);
    const isDark = document.documentElement.classList.contains('dark');

    const lineColor = isDark ? 'hsl(190, 90%, 55%)' : 'hsl(190, 90%, 42%)';
    const gridColor = isDark ? 'hsl(222, 20%, 20%)' : 'hsl(220, 15%, 88%)';
    const textColor = isDark ? 'hsl(215, 15%, 55%)' : 'hsl(220, 10%, 45%)';

    ctx.clearRect(0, 0, w, h);

    const data = history.slice(0, 10).reverse();
    const maxVal = 100;

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(maxVal - (maxVal / 4) * i)}%`, pad.left - 8, y + 4);
    }

    // Line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    const points: { x: number; y: number }[] = [];
    data.forEach((d, i) => {
      const x = pad.left + (plotW / (data.length - 1)) * i;
      const y = pad.top + plotH - (d.accuracy / maxVal) * plotH;
      points.push({ x, y });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, p.x, h - 8);
    });

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, isDark ? 'hsla(190, 90%, 55%, 0.2)' : 'hsla(190, 90%, 42%, 0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, pad.top + plotH);
    ctx.lineTo(points[0].x, pad.top + plotH);
    ctx.closePath();
    ctx.fill();
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        Complete at least 2 attempts to see trends.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48"
      style={{ width: '100%', height: '192px' }}
    />
  );
}
