import { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Sun, Calculator, PenTool, Type } from 'lucide-react';
import { CanvasDraw } from './components/CanvasDraw';
import { EquationInput } from './components/EquationInput';
import { GraphPlotter } from './components/GraphPlotter';
import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [inputMode, setInputMode] = useState<'canvas' | 'keyboard'>('canvas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [equations, setEquations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const processEquation = async (payload: { image?: string; text?: string }) => {
    setIsProcessing(true);
    setError(null);
    setRecognizedText(null);
    try {
      // Clean up the URL to prevent double slashes or double /api/api
      let baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      const response = await axios.post(`${baseUrl}/api/parse-equation`, payload);
      if (response.data && response.data.equations) {
        setEquations(response.data.equations);
        setRecognizedText(response.data.equations.join(', '));
      } else {
        setError('Could not extract a valid equation from the input.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to the parsing server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCanvasProcess = (base64Image: string) => {
    processEquation({ image: base64Image });
  };

  const handleKeyboardProcess = (text: string) => {
    processEquation({ text });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-alt)] text-[var(--color-text)] flex flex-col font-sans transition-colors duration-300">
      <WelcomeModal />
      {/* Header */}
      <header className="bg-[var(--color-bg)] border-b border-[var(--color-border)] p-4 shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-2xl">
            <Calculator size={28} />
            <h1>Eq2Graph</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Input */}
        <div className="flex flex-col h-[500px] lg:h-full min-h-[500px]">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('canvas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 font-medium transition-colors ${
                inputMode === 'canvas' 
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                  : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <PenTool size={18} />
              Draw
            </button>
            <button
              onClick={() => setInputMode('keyboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 font-medium transition-colors ${
                inputMode === 'keyboard' 
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                  : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <Type size={18} />
              Type
            </button>
          </div>

          <div className="flex-grow">
            {inputMode === 'canvas' ? (
              <CanvasDraw onProcess={handleCanvasProcess} isProcessing={isProcessing} />
            ) : (
              <EquationInput onProcess={handleKeyboardProcess} isProcessing={isProcessing} />
            )}
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="flex flex-col h-[500px] lg:h-full min-h-[500px] gap-4">
          <div className="flex flex-col gap-2 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-sm">
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Recognized Input</h2>
            {error ? (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            ) : recognizedText ? (
              <p className="text-lg font-mono font-medium text-[var(--color-primary)]">
                {recognizedText}
              </p>
            ) : (
              <p className="text-gray-400 text-sm italic">Waiting for input...</p>
            )}
          </div>

          <div className="flex-grow flex flex-col">
             <GraphPlotter equations={equations} />
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
