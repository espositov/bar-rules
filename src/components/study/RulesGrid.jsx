import React from 'react';

function RulesGrid({ 
  selectedTopic,
  selectedSubtopic,
  rulesByTopic,
  currentRule,
  masteredRules,
  ruleConfidence,
  displayMode,
  showProgressPercentages,
  practiceMode,
  hasSubtopics,
  getRulesFromSelection,
  getRuleId,
  onSubtopicSelect,
  onRuleSelect,
  onPracticeModeToggle
}) {
  
  const getSubtopicProgress = (subtopic) => {
    const subtopicRules = rulesByTopic[selectedTopic][subtopic] || [];
    const masteredCount = subtopicRules.filter(r => masteredRules.has(getRuleId(r))).length;
    return subtopicRules.length > 0 ? Math.round((masteredCount/subtopicRules.length)*100) : 0;
  };

  return (
    <section className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Subtopics (2x2 grid) */}
        {hasSubtopics(selectedTopic) && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h2 className="text-base font-bold text-orange-800">Subtopics</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(rulesByTopic[selectedTopic] || {}).map((subtopic) => {
                const progress = getSubtopicProgress(subtopic);
                const subtopicRules = rulesByTopic[selectedTopic][subtopic] || [];
                
                return (
                  <button 
                    key={subtopic} 
                    onClick={() => onSubtopicSelect(subtopic)}
                    className={`group relative overflow-hidden rounded-lg p-2 text-left transition-all duration-200 ${
                      selectedSubtopic === subtopic 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                        : 'bg-white hover:bg-orange-50 border border-orange-300 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex flex-col">
                      <h3 className={`font-semibold text-xs leading-tight truncate ${selectedSubtopic === subtopic ? 'text-white' : 'text-gray-800'}`}>
                        {subtopic}
                      </h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-xs ${selectedSubtopic === subtopic ? 'text-orange-100' : 'text-gray-500'}`}>
                          {subtopicRules.length}
                        </p>
                        
                        {showProgressPercentages && (
                          <span className={`text-xs font-medium ${selectedSubtopic === subtopic ? 'text-orange-100' : 'text-gray-600'}`}>
                            {progress}%
                          </span>
                        )}
                      </div>
                      
                      {/* Compact Progress bar */}
                      <div className={`mt-1 h-0.5 rounded-full overflow-hidden ${selectedSubtopic === subtopic ? 'bg-orange-400' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all duration-300 ${selectedSubtopic === subtopic ? 'bg-white' : 'bg-orange-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Right: Rules (3x3 grid) */}
        <div className={!hasSubtopics(selectedTopic) ? 'lg:col-span-2' : ''}>
          <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-4 border border-violet-200">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <h2 className="text-base font-bold text-violet-800">Rules</h2>
                <span className="text-xs text-violet-600">
                  ({getRulesFromSelection(selectedTopic, selectedSubtopic).length})
                </span>
              </div>
              
              <label className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-violet-300 cursor-pointer hover:bg-violet-50 transition-all duration-200">
                <input 
                  type="checkbox" 
                  checked={practiceMode} 
                  onChange={onPracticeModeToggle} 
                  className="w-3 h-3 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-xs font-medium text-violet-700">Practice</span>
              </label>
            </div>
          
          {selectedTopic && (!hasSubtopics(selectedTopic) || selectedSubtopic) && getRulesFromSelection(selectedTopic, selectedSubtopic).length > 0 ? (
            <div>
              {displayMode === 'buttons' ? (
                <div className="grid grid-cols-3 gap-2">
                  {getRulesFromSelection(selectedTopic, selectedSubtopic).map((rule) => {
                     const ruleId = getRuleId(rule);
                     const isMastered = masteredRules.has(ruleId);
                     const conf = ruleConfidence[ruleId];
                     const isSelected = currentRule && getRuleId(currentRule) === ruleId;
                     
                     return(
                        <button 
                          key={ruleId} 
                          onClick={() => onRuleSelect(rule)}
                          className={`group relative overflow-hidden rounded-lg p-3 text-left transition-all duration-200 min-h-[60px] ${
                            isSelected
                              ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md' 
                              : 'bg-white hover:bg-violet-50 border border-violet-300 hover:border-violet-400'
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start">
                              <h3 className={`font-medium text-xs leading-tight pr-2 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                {rule.name}
                              </h3>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isMastered && (
                                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {conf && !isMastered && (
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    conf === 'needs-review' ? 'bg-yellow-500' : 
                                    conf === 'didnt-know' ? 'bg-red-500' : 'bg-gray-300'
                                  }`} />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                     );
                  })}
                </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {getRulesFromSelection(selectedTopic, selectedSubtopic).map((rule) => {
                      const ruleId = getRuleId(rule);
                      const isSelected = currentRule && getRuleId(currentRule) === ruleId;
                      
                      return (
                          <div 
                            key={ruleId} 
                            onClick={() => onRuleSelect(rule)}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                                : 'bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200'
                            }`}
                          >
                            <h4 className="font-semibold text-sm truncate">{rule.name}</h4>
                            <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                              {rule.text.substring(0,80)}...
                            </p>
                          </div>
                      );
                  })}
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Select a topic to start studying</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default RulesGrid;