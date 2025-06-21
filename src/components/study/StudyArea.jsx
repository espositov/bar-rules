import React from 'react';
import TypingPractice from './TypingPractice';

function StudyArea({ 
  currentRule,
  selectedTopic,
  selectedSubtopic,
  practiceMode,
  showComparison,
  comparisonResult,
  userText,
  showHints,
  selfRating,
  generateHints,
  onLoadNewRule,
  onNewSubtopic,
  onToggleHints,
  onUserTextChange,
  onKeyPress,
  onCheckAnswer,
  onPracticeKeyDown,
  onPracticeFocus,
  onSelfRating,
  getRuleId,
  hasSubtopics,
  rulesByTopic
}) {
  
  const renderedDiffResult = comparisonResult ? comparisonResult.diffs.map(([type, text], index) => {
    let className = '', label = '';
    if (type === -1) { className = 'bg-yellow-200 text-yellow-800'; label = 'Missing'; }
    else if (type === 1) { className = 'bg-red-200 text-red-800'; label = 'Extra/Incorrect'; }
    else { className = 'bg-green-200 text-green-800'; label = 'Correct'; }
    return <span key={index} className={`${className} px-1 rounded`} title={label}>{text}</span>;
  }) : null;

  if (!currentRule) return null;

  return (
    <section className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-4">
      {/* Header with Current Rule Info */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800">
            {practiceMode ? 'Practice Typing' : 'Memory Challenge'}
          </h3>
        </div>
        
        {/* Current Rule Info Card */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-200 max-w-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-violet-800 mb-1">{currentRule.name}</h4>
              {selectedTopic && (
                <p className="text-sm text-violet-600">
                  {selectedTopic}{selectedSubtopic && ` → ${selectedSubtopic}`}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              {!practiceMode && (
                <button 
                  onClick={onToggleHints} 
                  className={`p-2 rounded-lg transition-all duration-200 ${showHints ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:bg-amber-100'}`}
                  title={showHints ? "Hide Hint" : "Get Hint"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}
              
              <button 
                onClick={onLoadNewRule} 
                className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition-all duration-200"
                title="Load New Rule"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Hint Display */}
          {showHints && !practiceMode && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm text-amber-800 font-medium">
                  {generateHints(currentRule.text)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Study Interface */}
      <div className="space-y-6">
        {showComparison ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Answer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                <h4 className="font-semibold text-gray-700">Your Answer</h4>
              </div>
              <div className="p-4">
                <textarea
                  value={userText}
                  onChange={onUserTextChange}
                  onKeyDown={onKeyPress}
                  className="w-full h-40 border-0 resize-none focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Correct Answer with Diff */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                <h4 className="font-semibold text-gray-700">Comparison Result</h4>
              </div>
              <div className="p-4 h-40 overflow-y-auto text-base leading-relaxed">
                {renderedDiffResult}
              </div>
            </div>
          </div>
        ) : practiceMode ? (
          <TypingPractice 
            currentRule={currentRule}
            userText={userText}
            onKeyDown={onPracticeKeyDown}
            onFocus={onPracticeFocus}
          />
        ) : (
          <div className="space-y-6">
            {/* Input Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                <h4 className="font-semibold text-gray-700">Your Answer</h4>
              </div>
              <div className="p-4">
                <textarea
                  value={userText}
                  onChange={onUserTextChange}
                  onKeyDown={onKeyPress}
                  placeholder="Write out the complete rule from memory..."
                  className="w-full h-40 border-0 resize-none focus:outline-none text-base placeholder-gray-400"
                />
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Characters: {userText.length}</span>
                <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  <kbd className="text-xs font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="text-xs font-mono">Enter</kbd>
                  <span>to check</span>
                </span>
              </div>
              
              <button
                onClick={onCheckAnswer}
                disabled={!userText.trim()}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                Check Answer
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {showComparison && (
          <div className="space-y-4">
            {/* Legend */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-green-200 rounded"></div>
                  <span className="text-gray-700">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-yellow-200 rounded"></div>
                  <span className="text-gray-700">Missing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-red-200 rounded"></div>
                  <span className="text-gray-700">Extra/Incorrect</span>
                </div>
              </div>
            </div>
            
            {/* Self-Rating */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-4">How confident do you feel about this rule?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'mastered', label: '✓ Got it!', desc: 'Mastered', color: 'emerald' },
                  { key: 'needs-review', label: '~ Needs Review', desc: 'Partially learned', color: 'yellow' },
                  { key: 'didnt-know', label: "✗ Didn't Know", desc: 'Need to study more', color: 'red' }
                ].map(({ key, label, desc, color }) => (
                  <button
                    key={key}
                    onClick={() => onSelfRating(key)}
                    className={`p-4 rounded-xl font-medium transition-all duration-200 border-2 ${
                      selfRating === key
                        ? `bg-${color}-500 text-white border-${color}-600 shadow-lg`
                        : `bg-white text-${color}-700 border-${color}-300 hover:bg-${color}-50`
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{label}</div>
                      <div className="text-xs mt-1 opacity-75">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selfRating && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-700 mb-4">
                    {selfRating === 'mastered' && "Excellent! This rule will appear less frequently in your practice sessions."}
                    {selfRating === 'needs-review' && "This rule will be prioritized in future study sessions."}
                    {selfRating === 'didnt-know' && "This rule will appear more frequently until you master it."}
                  </p>
                  
                  {/* Choice Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={onLoadNewRule}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <span className="text-lg">📚</span>
                      Next Rule
                    </button>
                    
                    {hasSubtopics && hasSubtopics(selectedTopic) && Object.keys(rulesByTopic[selectedTopic] || {}).length > 1 && (
                      <button 
                        onClick={onNewSubtopic}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <span className="text-lg">🔄</span>
                        New Subtopic
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudyArea;