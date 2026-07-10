import React, { useEffect, useRef, useState } from 'react';
import functionPlot from 'function-plot';

interface GraphPlotterProps {
  equations: string[];
}

export const GraphPlotter: React.FC<GraphPlotterProps> = ({ equations }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous contents
    containerRef.current.innerHTML = '';
    setError(null);

    if (equations.length === 0) {
      return;
    }

    try {
      const data = equations.map((eq, i) => {
        // Simple heuristic to assign different colors
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        
        // Remove "y =" or "f(x) =" for function-plot
        let cleanEq = eq.replace(/^(?:y|f\(x\))\s*=\s*/, '');
        
        return {
          fn: cleanEq,
          color: colors[i % colors.length],
          graphType: 'polyline'
        };
      });

      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#f9fafb' : '#1f2937';
      const gridColor = isDark ? '#374151' : '#e5e7eb';

      functionPlot({
        target: containerRef.current,
        width: containerRef.current.clientWidth || 500,
        height: containerRef.current.clientHeight || 400,
        yAxis: { domain: [-10, 10] },
        xAxis: { domain: [-10, 10] },
        grid: true,
        data: data as any,
      });

      // Simple theme override for axes since function-plot uses hardcoded black in some places
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svg.style.color = textColor;
        const textElements = svg.querySelectorAll('text');
        textElements.forEach(el => el.style.fill = textColor);
        const domainElements = svg.querySelectorAll('.domain');
        domainElements.forEach(el => (el as any).style.stroke = gridColor);
        const tickElements = svg.querySelectorAll('.tick line');
        tickElements.forEach(el => (el as any).style.stroke = gridColor);
      }

    } catch (err) {
      console.error('Error plotting graph:', err);
      setError('Could not plot the equation. Make sure it is valid (e.g. y = x^2).');
    }
  }, [equations]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-sm relative overflow-hidden">
      {equations.length === 0 && !error && (
        <div className="text-gray-400 text-center p-6 z-10 pointer-events-none">
          <p>No equations to display.</p>
          <p className="text-sm">Write or type an equation to generate its graph.</p>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded border border-red-200 dark:border-red-800 z-10 text-sm">
          {error}
        </div>
      )}

      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[300px]"
      />
    </div>
  );
};
