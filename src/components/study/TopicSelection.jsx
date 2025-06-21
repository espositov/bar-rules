import React from 'react';

function TopicSelection({ 
  displayMode,
  rulesByTopic, 
  selectedTopic, 
  masteredRules, 
  showProgressPercentages,
  onTopicSelect,
  getRuleId 
}) {
  
  const getTopicProgress = (topic) => {
    const topicRulesList = [];
    const topicData = rulesByTopic[topic];
    if (Array.isArray(topicData)) topicRulesList.push(...topicData);
    else if (typeof topicData === 'object') Object.values(topicData).forEach(subtopicRules => topicRulesList.push(...subtopicRules));
    
    const masteredCount = topicRulesList.filter(rule => masteredRules.has(getRuleId(rule))).length;
    return topicRulesList.length > 0 ? Math.round((masteredCount / topicRulesList.length) * 100) : 0;
  };

  if (displayMode === 'grid') {
    return (
      <section className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Select Topic</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(rulesByTopic).map((topic) => {
            const progress = getTopicProgress(topic);
            const topicRulesList = [];
            const topicData = rulesByTopic[topic];
            if (Array.isArray(topicData)) topicRulesList.push(...topicData);
            else if (typeof topicData === 'object') Object.values(topicData).forEach(subtopicRules => topicRulesList.push(...subtopicRules));
            
            return (
              <button 
                key={topic} 
                onClick={() => onTopicSelect(topic)}
                className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                  selectedTopic === topic 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 transform' 
                    : 'bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm leading-tight ${selectedTopic === topic ? 'text-white' : 'text-gray-800'}`}>
                      {topic}
                    </h3>
                    <p className={`text-xs mt-1 ${selectedTopic === topic ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {topicRulesList.length} rules
                    </p>
                  </div>
                  
                  {showProgressPercentages && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${selectedTopic === topic ? 'text-emerald-100' : 'text-gray-600'}`}>
                        {progress}%
                      </span>
                      {progress === 100 && (
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className={`mt-3 h-1 rounded-full overflow-hidden ${selectedTopic === topic ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-full transition-all duration-500 ${selectedTopic === topic ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Topic:</h2>
        </div>
        <div className="flex-1">
          <select 
            value={selectedTopic} 
            onChange={(e) => onTopicSelect(e.target.value)} 
            className="w-full p-3 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
          >
            <option value="">Choose a topic to study...</option>
            {Object.keys(rulesByTopic).map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export default TopicSelection;