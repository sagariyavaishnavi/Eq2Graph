import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface EquationInputProps {
  onProcess: (text: string) => void;
  isProcessing: boolean;
}

export const EquationInput: React.FC<EquationInputProps> = ({ onProcess, isProcessing }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isProcessing) {
      onProcess(text.trim());
    }
  };

  return (
    <div className="w-full h-full flex flex-col border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)] shadow-sm">
      <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-alt)]">
        <h3 className="font-semibold text-sm">Keyboard Input</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Type an equation (e.g. y = x^2 + 2x) or a word problem (e.g. A chemical half-life).
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow p-4 gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your math here..."
          className="flex-grow w-full resize-none p-3 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-transparent"
        />
        
        <button
          type="submit"
          disabled={isProcessing || !text.trim()}
          className="w-full py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-md transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <Send size={18} />
              Run
            </>
          )}
        </button>
      </form>
    </div>
  );
};
