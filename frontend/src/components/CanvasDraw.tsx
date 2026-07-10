import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Undo, Redo, Eraser, Pen, RotateCcw } from 'lucide-react';

interface CanvasDrawProps {
  onProcess: (base64Image: string) => void;
  isProcessing: boolean;
}

export const CanvasDraw: React.FC<CanvasDrawProps> = ({ onProcess, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff'); // Default to white for dark mode compatibility, but we will adapt
  const [isEraser, setIsEraser] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      // Save current content
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let currentImage: ImageData | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        currentImage = ctx?.getImageData(0, 0, canvas.width, canvas.height) || null;
      }
      
      canvas.width = container.clientWidth;
      canvas.height = Math.max(container.clientHeight, 300); // Minimum height

      // Restore content or initialize background
      if (ctx) {
        if (currentImage) {
          ctx.putImageData(currentImage, 0, 0);
        } else {
          ctx.fillStyle = 'transparent';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveState();
        }
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set default color based on theme
    const isDark = document.documentElement.classList.contains('dark');
    setColor(isDark ? '#ffffff' : '#000000');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setColor(isDark ? '#ffffff' : '#000000');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
    };
  }, [resizeCanvas]);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(imageData);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (canvas && ctx) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (canvas && ctx) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveState();
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (ctx) ctx.beginPath(); // Reset path so next line doesn't connect
      saveState();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    e.preventDefault(); // Prevent scrolling on touch

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = isEraser ? 20 : 3;
    ctx.lineCap = 'round';
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleProcess = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Create a temporary canvas to draw the content on a solid background 
      // (Gemini might not like transparent backgrounds for black ink)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      
      if (tempCtx) {
        const isDark = document.documentElement.classList.contains('dark');
        tempCtx.fillStyle = isDark ? '#111827' : '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        
        const base64 = tempCanvas.toDataURL('image/jpeg', 0.9);
        onProcess(base64);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)] shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-alt)] gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-2 rounded transition-colors ${!isEraser ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title="Pencil"
          >
            <Pen size={18} />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`p-2 rounded transition-colors ${isEraser ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
          <div className="relative flex items-center ml-2 border border-[var(--color-border)] rounded overflow-hidden">
             <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
              className="w-8 h-8 cursor-pointer p-0 border-0 outline-none"
              title="Color Picker"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500 transition-colors"
            title="Clear Canvas"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-grow w-full min-h-[300px] cursor-crosshair touch-none bg-transparent"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block"
        />
      </div>

      {/* Action Button */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-alt)]">
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-md transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Equation...
            </>
          ) : 'Run'}
        </button>
      </div>
    </div>
  );
};
