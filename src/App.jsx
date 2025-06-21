import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import BrowsePopup from './components/BrowsePopup';
import SettingsPopup from './components/SettingsPopup';
import Header from './components/layout/Header';
import TopicSelection from './components/study/TopicSelection';
import RulesGrid from './components/study/RulesGrid';
import StudyArea from './components/study/StudyArea';
import useRulesData from './hooks/useRulesData';
import { parseExcelFile, downloadExcelTemplate, downloadUpdatedProgress } from './services/excelService';

// Helper function for theme styles (can be expanded)
const getThemeStyles = () => {
  return {
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200',
  };
};

// Define localStorage keys as constants
const LOCAL_STORAGE_KEYS = {
  USER_RULES: 'userRules',
  IS_USING_EXCEL_DATA: 'isUsingExcelData',
  MASTERED_RULES: 'masteredRules',
  RULE_CONFIDENCE: 'ruleConfidence',
  TOPIC_DISPLAY_MODE: 'topicDisplayMode',
  AVAILABLE_RULES_DISPLAY_MODE: 'availableRulesDisplayMode',
  SUBTOPIC_DISPLAY_MODE: 'subtopicDisplayMode',
  SHOW_PROGRESS_PERCENTAGES: 'showProgressPercentages',
};


function App() {
  // Use custom hook for rules data management
  const {
    rules,
    progress,
    meta,
    actions,
    utils
  } = useRulesData(LOCAL_STORAGE_KEYS);

  // Extract commonly used values
  const { byTopic: rulesByTopic, setByTopic: setRulesByTopic, current: currentRule, setCurrent: setCurrentRule } = rules;
  const { topic: selectedTopic, subtopic: selectedSubtopic } = rules.selected;
  const { mastered: masteredRules, setMastered: setMasteredRules, confidence: ruleConfidence, setConfidence: setRuleConfidence } = progress;
  const { isUsingExcelData, setIsUsingExcelData } = meta;
  const { getRuleId, hasSubtopics, getRulesFromSelection } = utils;
  const { selectTopic, selectSubtopic, loadNewRule, markAsMastered: markRuleAsMastered, setConfidenceLevel: setRuleConfidenceLevel, initializeFirstRule } = actions;

  // UI State - grouped for better organization
  const [uiState, setUiState] = useState({
    userText: '',
    showComparison: false,
    comparisonResult: null,
    practiceMode: false,
    showBrowsePopup: false,
    showSettings: false,
    showHints: false,
    selfRating: null,
    uploadProgress: ''
  });

  // Display preferences - grouped separately as they persist to localStorage
  const [displayPrefs, setDisplayPrefs] = useState({
    topicDisplayMode: localStorage.getItem(LOCAL_STORAGE_KEYS.TOPIC_DISPLAY_MODE) || 'dropdown',
    availableRulesDisplayMode: localStorage.getItem(LOCAL_STORAGE_KEYS.AVAILABLE_RULES_DISPLAY_MODE) || 'buttons',
    subtopicDisplayMode: localStorage.getItem(LOCAL_STORAGE_KEYS.SUBTOPIC_DISPLAY_MODE) || 'buttons',
    showProgressPercentages: localStorage.getItem(LOCAL_STORAGE_KEYS.SHOW_PROGRESS_PERCENTAGES) === 'true'
  });

  // Helper functions to update UI state
  const updateUiState = (updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  };

  const updateDisplayPrefs = (updates) => {
    setDisplayPrefs(prev => ({ ...prev, ...updates }));
  };

  // Persist display preferences to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOPIC_DISPLAY_MODE, displayPrefs.topicDisplayMode);
  }, [displayPrefs.topicDisplayMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AVAILABLE_RULES_DISPLAY_MODE, displayPrefs.availableRulesDisplayMode);
  }, [displayPrefs.availableRulesDisplayMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SUBTOPIC_DISPLAY_MODE, displayPrefs.subtopicDisplayMode);
  }, [displayPrefs.subtopicDisplayMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SHOW_PROGRESS_PERCENTAGES, String(displayPrefs.showProgressPercentages));
  }, [displayPrefs.showProgressPercentages]);


  const generateHints = useCallback((text) => {
    if (!text) return '...';
    const words = text.split(' ');
    return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  }, []);

  const compareTexts = useCallback(() => {
    if (!currentRule || !currentRule.text || !uiState.userText.trim()) return;
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(currentRule.text, uiState.userText);
    dmp.diff_cleanupSemantic(diffs);
    let matchingChars = 0;
    diffs.forEach(([type, text]) => type === 0 && (matchingChars += text.length));
    const totalChars = Math.max(currentRule.text.length, uiState.userText.length);
    const similarityScore = totalChars > 0 ? Math.round((matchingChars / totalChars) * 100) : 0;
    updateUiState({ 
      comparisonResult: { diffs, similarityScore },
      showComparison: true 
    });
  }, [currentRule, uiState.userText]);


  const resetUIForNewRuleSelection = useCallback(() => {
    updateUiState({
      userText: '',
      showComparison: false,
      comparisonResult: null,
      selfRating: null,
      showHints: false
    });
  }, []);

  const handlePracticeKeyDown = useCallback((e) => {
    if (!currentRule || !uiState.practiceMode || !currentRule.text) return;
    if (e.metaKey || e.ctrlKey) return; // Allow OS-level shortcuts

    const allowedSingleKeys = /^[a-zA-Z0-9 `~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]$/;

    if (e.key === 'Backspace') {
      updateUiState({ userText: uiState.userText.slice(0, -1) });
    } else if (e.key.length === 1 && allowedSingleKeys.test(e.key)) {
      if (uiState.userText.length < currentRule.text.length) {
        updateUiState({ userText: uiState.userText + e.key });
      }
    } else if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Delete', 'Tab', 'Shift', 'CapsLock', 'Alt'].includes(e.key)) {
      e.preventDefault();
    }
  }, [currentRule, uiState.practiceMode, uiState.userText]);


  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      compareTexts();
    }
  }, [compareTexts]);



  const handleExcelUpload = useCallback(async (file) => {
    if (!file) return;
    try {
      updateUiState({ uploadProgress: 'Reading file...' });
      const parsedRules = await parseExcelFile(file);
      
      updateUiState({ uploadProgress: 'Processing data...' });
      setRulesByTopic(parsedRules);
      setIsUsingExcelData(true);
      
      const newConfidence = {}, newMastered = new Set();
      Object.values(parsedRules).forEach(topicOrSubtopics => {
        const process = (rulesArr) => rulesArr.forEach(r => {
          const m = r.mastery || 1;
          if (m === 3) { newConfidence[r.id] = 'mastered'; newMastered.add(r.id); }
          else if (m === 2) newConfidence[r.id] = 'needs-review';
          else newConfidence[r.id] = 'didnt-know';
        });
        Array.isArray(topicOrSubtopics) ? process(topicOrSubtopics) : Object.values(topicOrSubtopics).forEach(process);
      });
      
      setRuleConfidence(newConfidence);
      setMasteredRules(newMastered);
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_RULES, JSON.stringify(parsedRules));
      localStorage.setItem(LOCAL_STORAGE_KEYS.IS_USING_EXCEL_DATA, 'true');
      localStorage.setItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE, JSON.stringify(newConfidence));
      localStorage.setItem(LOCAL_STORAGE_KEYS.MASTERED_RULES, JSON.stringify([...newMastered]));
      
      initializeFirstRule(parsedRules);
      resetUIForNewRuleSelection();
      
      updateUiState({ uploadProgress: 'Data loaded successfully!' });
      setTimeout(() => updateUiState({ uploadProgress: '' }), 2000);
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      updateUiState({ uploadProgress: `Error: ${error.message?.substring(0, 100) || 'Failed to load file'}` });
      setTimeout(() => updateUiState({ uploadProgress: '' }), 5000);
    }
  }, [initializeFirstRule, resetUIForNewRuleSelection]);

  // Wrap the imported function to pass the required parameters
  const handleDownloadProgress = useCallback(() => {
    downloadUpdatedProgress(rulesByTopic, ruleConfidence, getRuleId);
  }, [rulesByTopic, ruleConfidence, getRuleId]);

  // Handle selecting a random subtopic and rule
  const handleNewSubtopic = useCallback(() => {
    if (!selectedTopic || !hasSubtopics(selectedTopic)) return;
    
    const subtopics = Object.keys(rulesByTopic[selectedTopic] || {});
    if (subtopics.length <= 1) return;
    
    // Get a random subtopic different from the current one
    const otherSubtopics = subtopics.filter(st => st !== selectedSubtopic);
    if (otherSubtopics.length === 0) return;
    
    const randomSubtopic = otherSubtopics[Math.floor(Math.random() * otherSubtopics.length)];
    selectSubtopic(randomSubtopic, resetUIForNewRuleSelection);
    
    // Load a random rule from the new subtopic
    setTimeout(() => {
      loadNewRule(resetUIForNewRuleSelection);
    }, 100);
  }, [selectedTopic, selectedSubtopic, rulesByTopic, hasSubtopics, selectSubtopic, loadNewRule, resetUIForNewRuleSelection]);

  // Main App JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/40 p-6">
        <Header 
          uploadProgress={uiState.uploadProgress}
          onExcelUpload={handleExcelUpload}
          onBrowseClick={() => updateUiState({ showBrowsePopup: true })}
          onDownloadProgress={handleDownloadProgress}
          onSettingsClick={() => updateUiState({ showSettings: true })}
          isUsingExcelData={isUsingExcelData}
        />
        
        {/* Sample Data Warning Banner */}
        {!isUsingExcelData && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 mb-1">You're viewing sample rules</h3>
                <p className="text-sm text-amber-700">Upload your own Excel file with custom rule statements to create a personalized study experience.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <TopicSelection 
            displayMode={displayPrefs.topicDisplayMode}
            rulesByTopic={rulesByTopic}
            selectedTopic={selectedTopic}
            masteredRules={masteredRules}
            showProgressPercentages={displayPrefs.showProgressPercentages}
            onTopicSelect={(topic) => selectTopic(topic, resetUIForNewRuleSelection)}
            getRuleId={getRuleId}
          />
          
          <RulesGrid 
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            rulesByTopic={rulesByTopic}
            currentRule={currentRule}
            masteredRules={masteredRules}
            ruleConfidence={ruleConfidence}
            displayMode={displayPrefs.availableRulesDisplayMode}
            subtopicDisplayMode={displayPrefs.subtopicDisplayMode}
            showProgressPercentages={displayPrefs.showProgressPercentages}
            practiceMode={uiState.practiceMode}
            hasSubtopics={hasSubtopics}
            getRulesFromSelection={getRulesFromSelection}
            getRuleId={getRuleId}
            onSubtopicSelect={(subtopic) => selectSubtopic(subtopic, resetUIForNewRuleSelection)}
            onRuleSelect={(rule) => { setCurrentRule(rule); resetUIForNewRuleSelection(); }}
            onPracticeModeToggle={() => updateUiState({ practiceMode: !uiState.practiceMode })}
          />

          {currentRule && (
            <StudyArea 
              currentRule={currentRule}
              selectedTopic={selectedTopic}
              selectedSubtopic={selectedSubtopic}
              practiceMode={uiState.practiceMode}
              showComparison={uiState.showComparison}
              comparisonResult={uiState.comparisonResult}
              userText={uiState.userText}
            showHints={uiState.showHints}
              selfRating={uiState.selfRating}
              generateHints={generateHints}
              onLoadNewRule={() => loadNewRule(resetUIForNewRuleSelection)}
              onNewSubtopic={handleNewSubtopic}
              onToggleHints={() => updateUiState({ showHints: !uiState.showHints })}
              onUserTextChange={(e) => updateUiState({ userText: e.target.value })}
              onKeyPress={handleKeyPress}
              onCheckAnswer={compareTexts}
              onPracticeKeyDown={handlePracticeKeyDown}
              onPracticeFocus={(e) => e.currentTarget.focus()}
              onSelfRating={(rating) => { 
                updateUiState({ selfRating: rating }); 
                setRuleConfidenceLevel(getRuleId(currentRule), rating); 
              }}
              getRuleId={getRuleId}
              hasSubtopics={hasSubtopics}
              rulesByTopic={rulesByTopic}
            />
          )}
        </div>
        </div>
      </div>
      
      <BrowsePopup 
        showBrowsePopup={uiState.showBrowsePopup}
        setShowBrowsePopup={(value) => updateUiState({ showBrowsePopup: value })}
        rulesByTopic={rulesByTopic}
        setRulesByTopic={setRulesByTopic}
        hasSubtopics={hasSubtopics}
        getRuleId={getRuleId}
        setSelectedTopic={(topic) => selectTopic(topic, resetUIForNewRuleSelection)}
        setSelectedSubtopic={(subtopic) => selectSubtopic(subtopic, resetUIForNewRuleSelection)}
        setCurrentRule={setCurrentRule}
        resetUIForNewRuleSelection={resetUIForNewRuleSelection}
        LOCAL_STORAGE_KEYS={LOCAL_STORAGE_KEYS}
      />
      
      <SettingsPopup 
        showSettings={uiState.showSettings}
        setShowSettings={(value) => updateUiState({ showSettings: value })}
        topicDisplayMode={displayPrefs.topicDisplayMode}
        setTopicDisplayMode={(value) => updateDisplayPrefs({ topicDisplayMode: value })}
        availableRulesDisplayMode={displayPrefs.availableRulesDisplayMode}
        setAvailableRulesDisplayMode={(value) => updateDisplayPrefs({ availableRulesDisplayMode: value })}
        subtopicDisplayMode={displayPrefs.subtopicDisplayMode}
        setSubtopicDisplayMode={(value) => updateDisplayPrefs({ subtopicDisplayMode: value })}
        showProgressPercentages={displayPrefs.showProgressPercentages}
        setShowProgressPercentages={(value) => updateDisplayPrefs({ showProgressPercentages: value })}
        isUsingExcelData={isUsingExcelData}
        downloadExcelTemplate={downloadExcelTemplate}
        handleExcelUpload={handleExcelUpload}
        uploadProgress={uiState.uploadProgress}
      />
    </div>
  );
}

export default App;