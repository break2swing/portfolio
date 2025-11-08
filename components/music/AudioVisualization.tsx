'use client';

import { useEffect, useRef } from 'react';

export type VisualizationType = 'bars' | 'wave' | 'circle' | 'dots' | 'line';

interface AudioVisualizationProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  visualizationType: VisualizationType;
}

export function AudioVisualization({
  audioElement,
  isPlaying,
  visualizationType,
}: AudioVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    if (!audioContextRef.current) {
      try {
        console.log('[AUDIO VISUALIZATION] Creating AudioContext...');
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current =
          audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        console.log('[AUDIO VISUALIZATION] AudioContext created successfully');
      } catch (error) {
        console.error('[AUDIO VISUALIZATION] Error creating AudioContext:', error);
        return;
      }
    }

    if (audioContextRef.current.state === 'suspended') {
      console.log('[AUDIO VISUALIZATION] Resuming suspended AudioContext...');
      audioContextRef.current.resume().then(() => {
        console.log('[AUDIO VISUALIZATION] AudioContext resumed');
      });
    }

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    // Drawing function for bars visualization
    const drawBars = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        const r = 255 - (barHeight / 128) * 255;
        const g = (barHeight / 128) * 255;
        const b = 255;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    // Drawing function for wave visualization
    const drawWave = () => {
      analyser.getByteTimeDomainData(timeDataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(100, 200, 255)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeDataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    // Drawing function for circle visualization
    const drawCircle = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 3;
        const angle = (i / bufferLength) * Math.PI * 2;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        const r = 255 - (barHeight / 85) * 255;
        const g = (barHeight / 85) * 255;
        const b = 255;

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    // Drawing function for dots visualization
    const drawDots = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dotSpacing = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const x = i * dotSpacing;
        const radius = (dataArray[i] / 255) * 8;
        const y = canvas.height / 2 + ((Math.random() - 0.5) * dataArray[i]) / 2;

        const r = 255 - (dataArray[i] / 255) * 255;
        const g = (dataArray[i] / 255) * 255;
        const b = 255;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Drawing function for line visualization
    const drawLine = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgb(150, 100, 255)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const x = i * sliceWidth;
        const y = canvas.height - (dataArray[i] / 255) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Fill area under line
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(150, 100, 255, 0.2)';
      ctx.fill();
    };

    const draw = () => {
      if (!isPlaying) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);

      // Select drawing function based on visualization type
      switch (visualizationType) {
        case 'bars':
          drawBars();
          break;
        case 'wave':
          drawWave();
          break;
        case 'circle':
          drawCircle();
          break;
        case 'dots':
          drawDots();
          break;
        case 'line':
          drawLine();
          break;
      }
    };

    if (isPlaying) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying, visualizationType]);

  return (
    <div className="w-full h-24 bg-secondary/20 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width={800}
        height={100}
      />
    </div>
  );
}
