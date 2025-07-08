import React, { useMemo } from 'react';

function TypingPractice({ 
  currentRule, 
  userText, 
  onKeyDown, 
  onFocus 
}) {
  const renderedTypingPractice = useMemo(() => {
    if (!currentRule || !currentRule.text) return null;
    const target = currentRule.text;
    const input = userText;
    const inputLen = input.length;

    // Split text into words and spaces
    const elements = [];
    let currentWord = '';
    let charIndex = 0;

    for (let i = 0; i < target.length; i++) {
      const char = target[i];
      
      if (char === ' ') {
        // If we have a word, add it to elements
        if (currentWord) {
          const wordStart = charIndex - currentWord.length;
          elements.push({
            type: 'word',
            text: currentWord,
            startIdx: wordStart,
            endIdx: charIndex - 1
          });
          currentWord = '';
        }
        // Add space as separate element
        elements.push({
          type: 'space',
          text: ' ',
          startIdx: charIndex,
          endIdx: charIndex
        });
        charIndex++;
      } else {
        currentWord += char;
        charIndex++;
      }
    }
    
    // Add final word if exists
    if (currentWord) {
      const wordStart = charIndex - currentWord.length;
      elements.push({
        type: 'word',
        text: currentWord,
        startIdx: wordStart,
        endIdx: charIndex - 1
      });
    }

    return (
      <div
        className="relative font-mono text-lg leading-relaxed p-6 bg-white border border-gray-300 rounded-xl min-h-[200px] cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          width: '100%',
          boxSizing: 'border-box'
        }}
        tabIndex={0} 
        onKeyDown={onKeyDown} 
        onClick={onFocus}
        role="textbox" 
        aria-multiline="true" 
        aria-label="Typing practice area"
      >
        {elements.map((element, elementIdx) => {
          if (element.type === 'space') {
            const idx = element.startIdx;
            const className = 
              idx < inputLen ? (input[idx] === ' ' ? 'text-black bg-green-100' : 'text-white bg-red-500') :
              idx === inputLen ? 'bg-blue-200 animate-pulse' : 'text-gray-400';
            return (
              <span key={`space-${elementIdx}`} className={className}>
                {idx >= inputLen ? '\u00A0' : ' '}
              </span>
            );
          } else {
            // Render word
            return (
              <span key={`word-${elementIdx}`} style={{ display: 'inline-block' }}>
                {element.text.split('').map((char, charIdx) => {
                  const idx = element.startIdx + charIdx;
                  const className = 
                    idx < inputLen ? (input[idx] === char ? 'text-black bg-green-100' : 'text-white bg-red-500') :
                    idx === inputLen ? 'bg-blue-200 animate-pulse' : 'text-gray-400';
                  return (
                    <span key={`char-${idx}`} className={className}>
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          }
        })}
        {inputLen > target.length && <span className="text-white bg-red-500">{input.substring(target.length)}</span>}
      </div>
    );
  }, [currentRule, userText, onKeyDown]);

  return (
    <div className="space-y-4">
      {renderedTypingPractice}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              Progress: {userText.length}/{currentRule?.text.length || 0}
            </span>
            {userText.length === currentRule?.text.length && userText === currentRule?.text && (
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Complete!
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Click the text area to start typing</p>
        </div>
      </div>
    </div>
  );
}

export default TypingPractice;