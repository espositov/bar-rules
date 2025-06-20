import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import * as XLSX from 'xlsx';

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
  SHOW_PROGRESS_PERCENTAGES: 'showProgressPercentages',
};

// Function to assign unique IDs to rules if they don't have one.
// This is crucial for consistent progress tracking.
const assignIdsToRulesRecursively = (data, prefix = 'json', idCounterState = { count: 1 }) => {
  if (Array.isArray(data)) {
    // If it's an array, map over its items. These items are expected to be rule objects.
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        if (!item.id && item.name && item.text) { // Check if it looks like a rule and lacks an ID
          item.id = `${prefix}-rule-${idCounterState.count++}`;
        }
        // Even if it's a rule, it might have nested properties that are objects (though unlikely for rules)
        // For rules, we generally don't expect further nested objects that need IDs.
      }
      return item; // Return item, potentially with new ID
    });
  } else if (typeof data === 'object' && data !== null) {
    // If it's an object, it could be a Topic (containing Subtopics or rules) or a Subtopic (containing rules)
    const newData = { ...data }; // Clone to avoid direct mutation issues if 'data' is state
    for (const key in newData) {
      if (Object.prototype.hasOwnProperty.call(newData, key)) {
        // Recursively call for properties that are objects or arrays
        newData[key] = assignIdsToRulesRecursively(newData[key], prefix, idCounterState);
      }
    }
    return newData;
  }
  return data; // Return primitive types as is
};

function App() {
  const [rulesByTopic, setRulesByTopic] = useState({});
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [currentRule, setCurrentRule] = useState(null);
  const [userText, setUserText] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showBrowsePopup, setShowBrowsePopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [topicDisplayMode, setTopicDisplayMode] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.TOPIC_DISPLAY_MODE) || 'dropdown'
  );
  const [availableRulesDisplayMode, setAvailableRulesDisplayMode] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.AVAILABLE_RULES_DISPLAY_MODE) || 'buttons'
  );
  const [showProgressPercentages, setShowProgressPercentages] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.SHOW_PROGRESS_PERCENTAGES) === 'true'
  );

  const [masteredRules, setMasteredRules] = useState(new Set());
  const [ruleConfidence, setRuleConfidence] = useState({});
  const [showHints, setShowHints] = useState(false);
  const [selfRating, setSelfRating] = useState(null);
  const [isUsingExcelData, setIsUsingExcelData] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOPIC_DISPLAY_MODE, topicDisplayMode);
  }, [topicDisplayMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AVAILABLE_RULES_DISPLAY_MODE, availableRulesDisplayMode);
  }, [availableRulesDisplayMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SHOW_PROGRESS_PERCENTAGES, String(showProgressPercentages));
  }, [showProgressPercentages]);

  const getRuleId = useCallback((rule) => {
    if (!rule) return null;
    // Prefer rule.id if it exists (set by Excel import, UI add, or JSON pre-processing)
    if (rule.id) return rule.id;

    // Fallback for rules that somehow missed ID assignment (e.g. old JSON format without IDs and no preprocessing)
    // This fallback is less stable as names/topics can change.
    console.warn('Rule missing ID, generating temporary ID:', rule.name, selectedTopic, selectedSubtopic);
    const topicPart = selectedTopic || 'unknown-topic';
    const subtopicPart = selectedSubtopic || 'unknown-subtopic';
    return `${topicPart}-${subtopicPart}-${rule.name}`;
  }, [selectedTopic, selectedSubtopic]);

  // Helper function to set the initial selected rule after data is loaded
  const initializeFirstRule = useCallback((data) => {
    const topics = Object.keys(data);
    if (topics.length > 0) {
      const firstTopic = topics[0];
      setSelectedTopic(firstTopic);
      setCurrentRule(null);
      setSelectedSubtopic('');

      const topicData = data[firstTopic];
      if (topicData && typeof topicData === 'object' && !Array.isArray(topicData)) {
        const subtopics = Object.keys(topicData);
        if (subtopics.length > 0) {
          const firstSubtopic = subtopics[0];
          setSelectedSubtopic(firstSubtopic);
          const rules = topicData[firstSubtopic];
          if (rules && rules.length > 0) {
            setCurrentRule(rules[Math.floor(Math.random() * rules.length)]);
          }
        }
      } else if (Array.isArray(topicData) && topicData.length > 0) {
        setCurrentRule(topicData[Math.floor(Math.random() * topicData.length)]);
      }
    } else {
      setSelectedTopic('');
      setSelectedSubtopic('');
      setCurrentRule(null);
    }
  }, []);

  // Enhanced loading function with better error handling and Business Associations check
  const loadAndSetRules = useCallback(() => {
    try {
      const savedRules = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_RULES);

      const loadDefaultRules = () => {
        fetch('/rules.json')
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then(fetchedData => {
            // Assign IDs if missing from JSON
            const dataWithIds = assignIdsToRulesRecursively(JSON.parse(JSON.stringify(fetchedData)), 'json'); // Deep copy before modifying
            setRulesByTopic(dataWithIds);
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER_RULES, JSON.stringify(dataWithIds));
            initializeFirstRule(dataWithIds);
          })
          .catch(error => {
            console.error('Error loading initial rules from rules.json:', error);
            setRulesByTopic({}); // Fallback to empty if rules.json also fails
          });
      };
      
      if (savedRules) {
        const data = JSON.parse(savedRules);
        // This specific check might need to be more generic, e.g., versioning rules structure
        if (!data['Business Associations'] && !isUsingExcelData) { 
          localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_RULES);
          loadDefaultRules();
          return;
        }
        setRulesByTopic(data);
        initializeFirstRule(data);
      } else {
        loadDefaultRules();
      }
    } catch (error) {
      console.error('Failed to load rules from localStorage:', error);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_RULES);
      loadAndSetRules(); // Try to load default rules again
    }
  }, [initializeFirstRule, isUsingExcelData]);

  useEffect(() => {
    const usingExcel = localStorage.getItem(LOCAL_STORAGE_KEYS.IS_USING_EXCEL_DATA) === 'true';
    setIsUsingExcelData(usingExcel);
    loadAndSetRules();

    try {
      const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEYS.MASTERED_RULES);
      if (savedProgress) setMasteredRules(new Set(JSON.parse(savedProgress)));
    } catch (e) { console.error("Error parsing masteredRules", e); localStorage.removeItem(LOCAL_STORAGE_KEYS.MASTERED_RULES); }

    try {
      const savedConfidence = localStorage.getItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE);
      if (savedConfidence) setRuleConfidence(JSON.parse(savedConfidence));
    } catch (e) { console.error("Error parsing ruleConfidence", e); localStorage.removeItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE); }
  }, [loadAndSetRules]);

  const hasSubtopics = useCallback((topic) => {
    if (!topic || !rulesByTopic[topic]) return false;
    const topicData = rulesByTopic[topic];
    return typeof topicData === 'object' && !Array.isArray(topicData);
  }, [rulesByTopic]);

  const getRulesFromSelection = useCallback((topic, subtopic = null) => {
    if (!topic || !rulesByTopic[topic]) return [];
    const topicData = rulesByTopic[topic];

    if (hasSubtopics(topic)) {
        if (subtopic && topicData[subtopic]) {
            return Array.isArray(topicData[subtopic]) ? topicData[subtopic] : [];
        }
        return []; 
    }
    // Topic is an array of rules (no subtopics)
    return Array.isArray(topicData) ? topicData : [];
  }, [rulesByTopic, hasSubtopics]);

  // Auto-select rule when there's only one available and none currently selected
  useEffect(() => {
    if (!currentRule && selectedTopic && Object.keys(rulesByTopic).length > 0) {
        const currentTopicData = rulesByTopic[selectedTopic];
        if (!currentTopicData) return;

        let rulesToConsider = [];
        if (hasSubtopics(selectedTopic)) {
            if (selectedSubtopic && currentTopicData[selectedSubtopic]) {
                rulesToConsider = currentTopicData[selectedSubtopic];
            } else if (!selectedSubtopic && Object.keys(currentTopicData).length > 0) {
                const firstSubtopicKey = Object.keys(currentTopicData)[0];
                rulesToConsider = currentTopicData[firstSubtopicKey] || [];
            }
        } else {
            rulesToConsider = Array.isArray(currentTopicData) ? currentTopicData : [];
        }

        if (rulesToConsider.length === 1) {
            setCurrentRule(rulesToConsider[0]);
        }
    }
  }, [selectedTopic, selectedSubtopic, currentRule, rulesByTopic, hasSubtopics]);

  const markRuleAsMastered = useCallback((ruleId) => {
    if (!ruleId) return;
    setMasteredRules(prevMastered => {
      const newMastered = new Set(prevMastered);
      newMastered.add(ruleId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MASTERED_RULES, JSON.stringify([...newMastered]));
      return newMastered;
    });
  }, []);

  const setRuleConfidenceLevel = useCallback((ruleId, confidence) => {
    if (!ruleId) return;
    setRuleConfidence(prevConfidence => {
      const newConfidence = { ...prevConfidence, [ruleId]: confidence };
      localStorage.setItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE, JSON.stringify(newConfidence));
      return newConfidence;
    });
    if (confidence === 'mastered') markRuleAsMastered(ruleId);
  }, [markRuleAsMastered]);

  const generateHints = useCallback((text) => {
    if (!text) return '...';
    const words = text.split(' ');
    return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  }, []);

  const compareTexts = useCallback(() => {
    if (!currentRule || !currentRule.text || !userText.trim()) return;
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(currentRule.text, userText);
    dmp.diff_cleanupSemantic(diffs);
    let matchingChars = 0;
    diffs.forEach(([type, text]) => type === 0 && (matchingChars += text.length));
    const totalChars = Math.max(currentRule.text.length, userText.length);
    const similarityScore = totalChars > 0 ? Math.round((matchingChars / totalChars) * 100) : 0;
    setComparisonResult({ diffs, similarityScore });
    setShowComparison(true);
  }, [currentRule, userText]);

  const renderedDiffResult = useMemo(() => {
    if (!comparisonResult) return null;
    return comparisonResult.diffs.map(([type, text], index) => {
      let className = '', label = '';
      if (type === DiffMatchPatch.DIFF_DELETE) { className = 'bg-yellow-200 text-yellow-800'; label = 'Missing'; }
      else if (type === DiffMatchPatch.DIFF_INSERT) { className = 'bg-red-200 text-red-800'; label = 'Extra/Incorrect'; }
      else { className = 'bg-green-200 text-green-800'; label = 'Correct'; }
      return <span key={index} className={`${className} px-1 rounded`} title={label}>{text}</span>;
    });
  }, [comparisonResult]);

  const resetUIForNewRuleSelection = useCallback(() => {
    setUserText('');
    setShowComparison(false);
    setComparisonResult(null);
    setSelfRating(null);
    setShowHints(false);
  }, []);

  const selectTopic = useCallback((topic) => {
    setSelectedTopic(topic);
    setSelectedSubtopic('');
    setCurrentRule(null);
    resetUIForNewRuleSelection();

    const topicData = rulesByTopic[topic];
    if (!topicData) return;

    if (hasSubtopics(topic)) {
      const subtopics = Object.keys(topicData);
      if (subtopics.length > 0) {
        const firstSubtopic = subtopics[0];
        setSelectedSubtopic(firstSubtopic);
        const rules = topicData[firstSubtopic];
        if (rules && rules.length > 0) setCurrentRule(rules[Math.floor(Math.random() * rules.length)]);
      }
    } else if (Array.isArray(topicData) && topicData.length > 0) {
      setCurrentRule(topicData[Math.floor(Math.random() * topicData.length)]);
    }
  }, [rulesByTopic, resetUIForNewRuleSelection, hasSubtopics]);

  const selectSubtopic = useCallback((subtopic) => {
    setSelectedSubtopic(subtopic);
    setCurrentRule(null);
    resetUIForNewRuleSelection();

    const rules = getRulesFromSelection(selectedTopic, subtopic);
    if (rules.length > 0) {
        setCurrentRule(rules[Math.floor(Math.random() * rules.length)]);
    }
  }, [selectedTopic, getRulesFromSelection, resetUIForNewRuleSelection]);

  const loadNewRule = useCallback(() => {
    const rules = getRulesFromSelection(selectedTopic, selectedSubtopic);
    if (rules.length > 0) {
      let randomRule;
      if (rules.length === 1 || !currentRule) {
        randomRule = rules[Math.floor(Math.random() * rules.length)];
      } else {
        const currentRuleId = getRuleId(currentRule);
        const filteredRules = rules.filter(r => getRuleId(r) !== currentRuleId);
        const pool = filteredRules.length > 0 ? filteredRules : rules;
        randomRule = pool[Math.floor(Math.random() * pool.length)];
      }
      setCurrentRule(randomRule);
      resetUIForNewRuleSelection();
    }
  }, [selectedTopic, selectedSubtopic, getRulesFromSelection, currentRule, getRuleId, resetUIForNewRuleSelection]);

  const handlePracticeKeyDown = useCallback((e) => {
    if (!currentRule || !practiceMode || !currentRule.text) return;
    if (e.metaKey || e.ctrlKey) return; // Allow OS-level shortcuts

    const allowedSingleKeys = /^[a-zA-Z0-9 `~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]$/;

    if (e.key === 'Backspace') {
      setUserText(prev => prev.slice(0, -1));
    } else if (e.key.length === 1 && allowedSingleKeys.test(e.key)) {
      if (userText.length < currentRule.text.length) setUserText(prev => prev + e.key);
    } else if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Delete', 'Tab', 'Shift', 'CapsLock', 'Alt'].includes(e.key)) {
      e.preventDefault();
    }
  }, [currentRule, practiceMode, userText]);

  const renderedTypingPractice = useMemo(() => {
    if (!currentRule || !currentRule.text) return null;
    const target = currentRule.text;
    const input = userText;
    const inputLen = input.length;

    return (
      <div
        className="relative font-mono text-lg leading-relaxed p-6 bg-white border border-gray-300 rounded-xl min-h-[160px] cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm whitespace-pre-wrap break-words"
        tabIndex={0} onKeyDown={handlePracticeKeyDown} onClick={(e) => e.currentTarget.focus()}
        role="textbox" aria-multiline="true" aria-label="Typing practice area"
      >
        {target.split('').map((char, idx) => (
          <span key={idx} className={
            idx < inputLen ? (input[idx] === char ? 'text-black bg-green-100' : 'text-white bg-red-500') :
            idx === inputLen ? 'bg-blue-200 animate-pulse' : 'text-gray-400'
          }>
            {char === ' ' && idx >= inputLen ? '\u00A0' : char}
          </span>
        ))}
        {inputLen > target.length && <span className="text-white bg-red-500">{input.substring(target.length)}</span>}
      </div>
    );
  }, [currentRule, userText, handlePracticeKeyDown]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      compareTexts();
    }
  }, [compareTexts]);

  // Enhanced Excel parsing with better column handling and debug logging
  const parseExcelData = useCallback((jsonData) => {
    const newRulesByTopic = {};
    let ruleIdCounter = 1000;

    console.log('Raw Excel data:', jsonData);

    jsonData.forEach((row, index) => {
        // Handle different column name variations - more flexible approach
        const normalizedRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
        const topic = String(normalizedRow.topic || normalizedRow.a || '').trim();
        const subtopic = String(normalizedRow['sub topic'] || normalizedRow.subtopic || normalizedRow['sub-topic'] || normalizedRow.b || '').trim();
        const ruleName = String(normalizedRow.rule || normalizedRow['rule name'] || normalizedRow.name || normalizedRow.c || '').trim();
        const definition = String(normalizedRow.definition || normalizedRow.text || normalizedRow.description || normalizedRow.d || '').trim();
        
        let mastery = 1;
        const masteryValue = normalizedRow['mastery (1-3)'] || normalizedRow.mastery || normalizedRow.e;
        if (masteryValue !== undefined && String(masteryValue).trim() !== '') {
            const parsedMastery = parseInt(String(masteryValue).trim(), 10);
            if (!isNaN(parsedMastery) && parsedMastery >= 1 && parsedMastery <= 3) mastery = parsedMastery;
        }

        console.log(`Row ${index + 1}:`, { topic, subtopic, ruleName, definition, mastery });

        if (!topic || !ruleName || !definition || ruleName.toUpperCase() === 'RATING GUIDE:') return;

        const ruleObject = { id: `excel-rule-${ruleIdCounter++}`, name: ruleName, text: definition, mastery };

        if (!newRulesByTopic[topic]) {
            newRulesByTopic[topic] = subtopic ? {} : [];
        }

        if (subtopic) {
            if (Array.isArray(newRulesByTopic[topic])) { // Conflict: migrate existing direct rules
                const existingRules = newRulesByTopic[topic];
                newRulesByTopic[topic] = { 'General': existingRules };
            }
            if (!newRulesByTopic[topic][subtopic]) newRulesByTopic[topic][subtopic] = [];
            newRulesByTopic[topic][subtopic].push(ruleObject);
        } else {
            if (!Array.isArray(newRulesByTopic[topic])) { // Topic is object, add to "General"
                if (!newRulesByTopic[topic]['General']) newRulesByTopic[topic]['General'] = [];
                newRulesByTopic[topic]['General'].push(ruleObject);
            } else { // Topic is array, add directly
                newRulesByTopic[topic].push(ruleObject);
            }
        }
    });

    console.log('Parsed rules structure:', newRulesByTopic);
    return newRulesByTopic;
  }, []);

  const parseExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      setUploadProgress('Reading file...');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          if (!worksheet) throw new Error(`Sheet "${worksheetName}" not found.`);
          
          setUploadProgress('Parsing data...');
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          const parsedRules = parseExcelData(jsonData);
          
          setUploadProgress('Data loaded successfully!');
          setTimeout(() => setUploadProgress(''), 2000);
          resolve(parsedRules);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setUploadProgress(`Error: ${error.message.substring(0, 100)}`);
          setTimeout(() => setUploadProgress(''), 5000);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setUploadProgress('Error reading file.');
        setTimeout(() => setUploadProgress(''), 3000);
        reject(new Error('File could not be read.'));
      };
      reader.readAsArrayBuffer(file);
    });
  }, [parseExcelData]);

  const handleExcelUpload = useCallback(async (file) => {
    if (!file) return;
    try {
      const parsedRules = await parseExcelFile(file);
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
    } catch (error) { /* Error handled by parseExcelFile */ }
  }, [parseExcelFile, initializeFirstRule, resetUIForNewRuleSelection]);

  const downloadExcelTemplate = useCallback(() => {
    const templateData = [
      { 'Topic': 'Sample Topic A', 'Sub Topic': 'Sub A1', 'Rule': 'Rule A1.1', 'Definition': 'Def A1.1', 'Mastery (1-3)': 1 },
      { 'Topic': 'Sample Topic A', 'Sub Topic': 'Sub A1', 'Rule': 'Rule A1.2', 'Definition': 'Def A1.2', 'Mastery (1-3)': 2 },
      { 'Topic': 'Sample Topic B', 'Sub Topic': '', 'Rule': 'Rule B1 (No Sub)', 'Definition': 'Def B1', 'Mastery (1-3)': 3 },
      { 'Topic': '', 'Sub Topic': '', 'Rule': 'RATING GUIDE:', 'Definition': '1=No/Didn\'t Know, 2=Maybe/Needs Review, 3=Yes/Mastered', 'Mastery (1-3)': '' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [ {wch:20}, {wch:20}, {wch:30}, {wch:70}, {wch:15} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rules Template');
    XLSX.writeFile(wb, 'BarPrep_Rules_Template.xlsx');
  }, []);

  const downloadUpdatedProgress = useCallback(() => {
    const exportData = [];
    Object.entries(rulesByTopic).forEach(([topicName, topicData]) => {
      const addRules = (rules, subName = '') => rules.forEach(r => {
        const rid = getRuleId(r);
        const conf = ruleConfidence[rid];
        let m = r.mastery || 1;
        if (conf) m = conf === 'mastered' ? 3 : conf === 'needs-review' ? 2 : 1;
        exportData.push({ 'Topic': topicName, 'Sub Topic': subName, 'Rule': r.name, 'Definition': r.text, 'Mastery (1-3)': m });
      });
      Array.isArray(topicData) ? addRules(topicData) : Object.entries(topicData).forEach(([sn,sr]) => addRules(sr,sn));
    });
    exportData.push({ 'Topic': '', 'Sub Topic': '', 'Rule': 'RATING GUIDE:', 'Definition': '1=No/Didn\'t Know, 2=Maybe/Needs Review, 3=Yes/Mastered', 'Mastery (1-3)': '' });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [ {wch:20}, {wch:20}, {wch:30}, {wch:70}, {wch:15} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Updated Progress');
    XLSX.writeFile(wb, `BarPrep_Progress_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [rulesByTopic, ruleConfidence, getRuleId]);

  // BrowsePopup Component
  const BrowsePopup = () => {
    if (!showBrowsePopup) return null;
    
    const [showAddRow, setShowAddRow] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [newSubtopic, setNewSubtopic] = useState('');
    const [newName, setNewName] = useState('');
    const [newText, setNewText] = useState('');
    const [isAddingNewTopic, setIsAddingNewTopic] = useState(false);
    const [customTopicName, setCustomTopicName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [filterByTopic, setFilterByTopic] = useState('all');

    const toggleCardExpansion = useCallback((cardId) => {
      setExpandedCards(prev => {
        const newSet = new Set(prev);
        newSet.has(cardId) ? newSet.delete(cardId) : newSet.add(cardId);
        return newSet;
      });
    }, []);

    const formatLegalText = useCallback((text) => {
      if (!text) return text;
      let formatted = text.replace(/\((\d+)\)/g, '<span class="font-semibold text-blue-700">($1)</span>')
                          .replace(/(\d+)\./g, '<span class="font-semibold text-blue-700">$1.</span>');
      const terms = ['plaintiff', 'defendant', 'jurisdiction', 'liable', 'contract', 'tort', 'breach', 'damages', 'court'];
      terms.forEach(term => {
        formatted = formatted.replace(new RegExp(`\\b(${term})\\b`, 'gi'), '<span class="font-medium text-indigo-700">$1</span>');
      });
      return formatted;
    }, []);

    const getTopicColor = useCallback((topic) => {
      const colors = {
        'Agency': 'bg-red-100 text-red-800 border-red-200',
        'Business Associations': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Civil Procedure': 'bg-blue-100 text-blue-800 border-blue-200',
        'Constitutional Law': 'bg-purple-100 text-purple-800 border-purple-200',
        'Contracts': 'bg-green-100 text-green-800 border-green-200',
        'Criminal Law': 'bg-gray-100 text-gray-800 border-gray-200',
        'Evidence': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Professional Responsibility': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Property': 'bg-pink-100 text-pink-800 border-pink-200',
        'Torts': 'bg-orange-100 text-orange-800 border-orange-200'
      };
      return colors[topic] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const copyToClipboard = useCallback(async (text, ruleName) => {
      try {
        await navigator.clipboard.writeText(text);
        alert(`Copied "${ruleName}" to clipboard!`);
      } catch (err) {
        alert(`Failed to copy. Manual copy: ${text}`);
      }
    }, []);

    const handleTopicChange = useCallback((selectedTopic) => {
      if (selectedTopic === '__ADD_NEW__') {
        setIsAddingNewTopic(true); setNewTopic('');
      } else {
        setIsAddingNewTopic(false); setNewTopic(selectedTopic); setCustomTopicName('');
      }
    }, []);

    const handleAddRule = useCallback(() => {
      const finalTopic = isAddingNewTopic ? customTopicName.trim() : newTopic;
      const finalSubtopic = newSubtopic.trim();
      const finalName = newName.trim();
      const finalText = newText.trim();

      if (!finalTopic || !finalName || !finalText) {
        alert('Please fill in Topic, Rule Name, and Rule Text fields.'); return;
      }

      const updatedRules = JSON.parse(JSON.stringify(rulesByTopic)); // Deep clone
      const ruleObject = {
        id: `ui-rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: finalName, text: finalText, mastery: 1 
      };

      if (!updatedRules[finalTopic]) { // New topic
        updatedRules[finalTopic] = finalSubtopic ? {} : [];
      }

      if (finalSubtopic) {
        if (Array.isArray(updatedRules[finalTopic])) { // Topic was direct, now needs subtopics
          alert(`Topic "${finalTopic}" currently holds rules directly. Cannot add a subtopic this way. Consider creating a new topic or restructuring existing data.`);
          return;
        }
        if (!updatedRules[finalTopic][finalSubtopic]) updatedRules[finalTopic][finalSubtopic] = [];
        updatedRules[finalTopic][finalSubtopic].push(ruleObject);
      } else { // No subtopic
        if (!Array.isArray(updatedRules[finalTopic])) { // Topic has subtopics, cannot add direct rule
           alert(`Topic "${finalTopic}" is organized by subtopics. Please specify a subtopic or add to a "General" subtopic.`);
           return;
        }
        updatedRules[finalTopic].push(ruleObject);
      }

      setRulesByTopic(updatedRules);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_RULES, JSON.stringify(updatedRules));
      
      // Reset form
      setShowAddRow(false); setNewTopic(''); setNewSubtopic(''); setNewName(''); setNewText('');
      setIsAddingNewTopic(false); setCustomTopicName('');
    }, [isAddingNewTopic, customTopicName, newTopic, newSubtopic, newName, newText, rulesByTopic]);

    const handleDeleteRule = useCallback((topic, subtopic, ruleIdToDelete) => {
      if (!confirm('Are you sure you want to delete this rule? This action cannot be undone.')) return;

      const updatedRules = JSON.parse(JSON.stringify(rulesByTopic)); // Deep clone
      let foundAndDeleted = false;

      if (subtopic && subtopic !== '-') { // Rule is in a subtopic
          if (updatedRules[topic] && updatedRules[topic][subtopic]) {
              updatedRules[topic][subtopic] = updatedRules[topic][subtopic].filter(rule => rule.id !== ruleIdToDelete);
              if (updatedRules[topic][subtopic].length === 0) delete updatedRules[topic][subtopic];
              if (Object.keys(updatedRules[topic]).length === 0) delete updatedRules[topic];
              foundAndDeleted = true;
          }
      } else { // Rule is directly under a topic
          if (updatedRules[topic] && Array.isArray(updatedRules[topic])) {
              updatedRules[topic] = updatedRules[topic].filter(rule => rule.id !== ruleIdToDelete);
              if (updatedRules[topic].length === 0) delete updatedRules[topic];
              foundAndDeleted = true;
          }
      }

      if (foundAndDeleted) {
          setRulesByTopic(updatedRules);
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER_RULES, JSON.stringify(updatedRules));
          alert('Rule deleted successfully.');
      } else {
          alert('Rule not found for deletion. It might have been already removed.');
      }
    }, [rulesByTopic]);

    const tableData = useMemo(() => {
      const data = [];
      Object.entries(rulesByTopic).forEach(([topic, topicData]) => {
        if (hasSubtopics(topic)) {
          Object.entries(topicData).forEach(([subtopic, rules]) => {
            rules.forEach(rule => data.push({ topic, subtopic, rule }));
          });
        } else if (Array.isArray(topicData)) {
          topicData.forEach(rule => data.push({ topic, subtopic: '-', rule }));
        }
      });
      return data;
    }, [rulesByTopic, hasSubtopics]);

    const filteredAndSortedData = useMemo(() => {
      const topicFiltered = filterByTopic === 'all' ? tableData : tableData.filter(r => r.topic === filterByTopic);
      const searchFiltered = searchQuery 
        ? topicFiltered.filter(r => 
            [r.topic, r.subtopic, r.rule.name, r.rule.text].some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
          ) 
        : topicFiltered;
      return [...searchFiltered].sort((a,b) => 
        a.topic.localeCompare(b.topic) || a.subtopic.localeCompare(b.subtopic) || a.rule.name.localeCompare(b.rule.name)
      );
    }, [tableData, filterByTopic, searchQuery]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h2 className="text-3xl font-black text-gray-900">Browse All Rules</h2>
                </div>
                <button
                  onClick={() => setShowBrowsePopup(false)}
                  className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg text-2xl"
                >×</button>
                <div className="flex items-center gap-3">
                  <select value={filterByTopic} onChange={(e) => setFilterByTopic(e.target.value)} className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg">
                    <option value="all">All Topics ({Object.keys(rulesByTopic).length})</option>
                    {Object.keys(rulesByTopic).map(topic => (
                      <option key={topic} value={topic}>{topic} ({
                        Array.isArray(rulesByTopic[topic]) ? rulesByTopic[topic].length : 
                        Object.values(rulesByTopic[topic]).reduce((s, arr) => s + arr.length, 0)
                      })</option>
                    ))}
                  </select>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full sm:w-80 pl-10 pr-4 py-2 border rounded-lg"/>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                <button onClick={() => setShowAddRow(!showAddRow)} className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {showAddRow ? 'Cancel Add' : 'Add New Rule'}
                </button>
                <div className="text-sm text-gray-600">Showing {filteredAndSortedData.length} of {tableData.length} rules</div>
              </div>
            </div>
  
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {showAddRow && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-4 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">Add New Rule</h3>
                  <div>
                    <label className="text-sm font-medium">Topic *</label>
                    <select value={isAddingNewTopic ? '__ADD_NEW__' : newTopic} onChange={(e) => handleTopicChange(e.target.value)} className="w-full p-3 border rounded-lg">
                      <option value="">Select Topic</option>
                      {Object.keys(rulesByTopic).map((t) => <option key={t} value={t}>{t}</option>)}
                      <option value="__ADD_NEW__">Add new topic...</option>
                    </select>
                    {isAddingNewTopic && <input type="text" value={customTopicName} onChange={(e) => setCustomTopicName(e.target.value)} placeholder="Enter new topic name" className="w-full p-3 border rounded-lg mt-2" autoFocus />}
                  </div>
                  <div><label className="text-sm font-medium">Subtopic</label><input type="text" value={newSubtopic} onChange={(e) => setNewSubtopic(e.target.value)} placeholder="Subtopic (optional)" className="w-full p-3 border rounded-lg"/></div>
                  <div><label className="text-sm font-medium">Rule Name *</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter rule name" className="w-full p-3 border rounded-lg"/></div>
                  <div><label className="text-sm font-medium">Rule Text *</label><textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Enter rule text" className="w-full p-3 border rounded-lg h-32"/></div>
                  <div className="flex gap-3">
                    <button onClick={handleAddRule} disabled={!(isAddingNewTopic ? customTopicName : newTopic) || !newName || !newText} className="h-10 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">Save Rule</button>
                    <button onClick={() => setShowAddRow(false)} className="h-10 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                  </div>
                </div>
              )}
  
              {/* Rules List */}
              <div className="space-y-4">
                {filteredAndSortedData.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">No rules found.</div>
                ) : (
                  filteredAndSortedData.map((row) => {
                    const cardId = getRuleId(row.rule);
                    const isExpanded = expandedCards.has(cardId);
                    return (
                      <div key={cardId} className="bg-white border border-gray-200 rounded-lg group">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTopicColor(row.topic)}`}>{row.topic}</span>
                              {row.subtopic !== '-' && <span className="text-xs text-gray-500">→ {row.subtopic}</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => copyToClipboard(row.rule.text, row.rule.name)} title="Copy" className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg">📋</button>
                              <button onClick={() => { setSelectedTopic(row.topic); setSelectedSubtopic(row.subtopic === '-' ? '' : row.subtopic); setCurrentRule(row.rule); resetUIForNewRuleSelection(); setShowBrowsePopup(false);}} className="h-8 px-3 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Study</button>
                              <button onClick={() => handleDeleteRule(row.topic, row.subtopic, row.rule.id)} title="Delete" className="h-8 w-8 flex items-center justify-center text-red-600 hover:bg-red-100 rounded-lg">🗑️</button>
                            </div>
                          </div>
                          <div className="cursor-pointer" onClick={() => toggleCardExpansion(cardId)}>
                            <div className="flex items-start gap-3">
                              <h3 className="font-semibold text-gray-900 hover:text-blue-600 flex-shrink-0">{row.rule.name}</h3>
                              {!isExpanded && <div className="text-gray-600 text-sm line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: formatLegalText(row.rule.text.substring(0,150) + (row.rule.text.length > 150 ? '...' : '')) }} />}
                              <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">{isExpanded ? '🔼' : '🔽'}</button>
                            </div>
                            {isExpanded && <div className="mt-3 pt-3 border-t" dangerouslySetInnerHTML={{ __html: formatLegalText(row.rule.text) }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      );
  };
  
  const SettingsPopup = () => {
    if (!showSettings) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-gray-900">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="h-8 w-8 text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-6">
              {/* Topic Display Mode */}
              <div>
                <label className="text-base font-semibold block mb-2">Topic Display</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2"><input type="radio" name="topicDisplay" value="grid" checked={topicDisplayMode === 'grid'} onChange={(e) => setTopicDisplayMode(e.target.value)} /> Grid View</label>
                  <label className="flex items-center gap-2"><input type="radio" name="topicDisplay" value="dropdown" checked={topicDisplayMode === 'dropdown'} onChange={(e) => setTopicDisplayMode(e.target.value)} /> Dropdown View</label>
                </div>
              </div>
              {/* Available Rules Display Mode */}
              <div>
                <label className="text-base font-semibold block mb-2">Rules List Display</label>
                 <div className="space-y-1">
                    <label className="flex items-center gap-2"><input type="radio" name="rulesDisplay" value="buttons" checked={availableRulesDisplayMode === 'buttons'} onChange={(e) => setAvailableRulesDisplayMode(e.target.value)} /> Button Grid</label>
                    <label className="flex items-center gap-2"><input type="radio" name="rulesDisplay" value="scrollable" checked={availableRulesDisplayMode === 'scrollable'} onChange={(e) => setAvailableRulesDisplayMode(e.target.value)} /> Scrollable List</label>
                </div>
              </div>
              {/* Progress Display */}
              <div>
                <label className="text-base font-semibold block mb-2">Progress Display</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={showProgressPercentages} onChange={(e) => setShowProgressPercentages(e.target.checked)} /> Show progress percentages</label>
              </div>
              {/* Data Source */}
              <div className="border-t pt-4">
                <label className="text-base font-semibold block mb-2">Data Source</label>
                <div className="p-2 rounded bg-blue-50 border border-blue-200 text-sm text-blue-700 mb-2">
                    {isUsingExcelData ? '✓ Using Custom Excel Data' : '📄 Using Default JSON Data'}
                </div>
                <div className="space-y-2">
                    <button onClick={downloadExcelTemplate} className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-300">Download Excel Template</button>
                    <div className="relative">
                        <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files && handleExcelUpload(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="settings-excel-upload"/>
                        <label htmlFor="settings-excel-upload" className="block w-full text-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-300 cursor-pointer">Upload Excel File</label>
                    </div>
                    {uploadProgress && <div className="text-xs text-center p-1 bg-yellow-50 border rounded text-yellow-800">{uploadProgress}</div>}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Done</button>
            </div>
          </div>
        </div>
      );
  };

  // Main App JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header and Action Buttons */}
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
              <h1 className="text-3xl font-black text-gray-800">
                Bar Rule Study
              </h1>
            </div>
            
            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-800 font-medium">{uploadProgress}</span>
              </div>
            )}
          </header>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Row 1 */}
            <div className="relative group">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={(e) => e.target.files && handleExcelUpload(e.target.files[0])} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                id="toolbar-excel-upload"
              />
              <label 
                htmlFor="toolbar-excel-upload" 
                className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                title="Upload Excel File"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </label>
            </div>
            
            <button 
              onClick={() => setShowBrowsePopup(true)} 
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Browse All Rules"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Browse
            </button>
            
            <button 
              onClick={downloadUpdatedProgress} 
              className="row-span-2 flex flex-col items-center justify-center px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Download Progress"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-center">Export Progress</span>
            </button>
            
            {/* Row 2 */}
            <button 
              onClick={downloadExcelTemplate} 
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Download Template"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Template
            </button>
            
            <button 
              onClick={() => setShowSettings(true)} 
              className="flex items-center justify-center p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.50 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.50a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Topic Selection */}
          <section className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-4">
            {topicDisplayMode === 'grid' ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Select Topic</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(rulesByTopic).map((topic) => {
                    const topicRulesList = [];
                    const topicData = rulesByTopic[topic];
                    if (Array.isArray(topicData)) topicRulesList.push(...topicData);
                    else if (typeof topicData === 'object') Object.values(topicData).forEach(subtopicRules => topicRulesList.push(...subtopicRules));
                    
                    const masteredCount = topicRulesList.filter(rule => masteredRules.has(getRuleId(rule))).length;
                    const progress = topicRulesList.length > 0 ? Math.round((masteredCount / topicRulesList.length) * 100) : 0;
                    
                    return (
                      <button 
                        key={topic} 
                        onClick={() => selectTopic(topic)}
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
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Topic:</h2>
                </div>
                <div className="flex-1">
                  <select 
                    value={selectedTopic} 
                    onChange={(e) => selectTopic(e.target.value)} 
                    className="w-full p-3 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="">Choose a topic to study...</option>
                    {Object.keys(rulesByTopic).map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>
          
          {/* Compact Side-by-Side Layout */}
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
                      const subtopicRules = rulesByTopic[selectedTopic][subtopic] || [];
                      const masteredCount = subtopicRules.filter(r => masteredRules.has(getRuleId(r))).length;
                      const progress = subtopicRules.length > 0 ? Math.round((masteredCount/subtopicRules.length)*100) : 0;
                      
                      return (
                        <button 
                          key={subtopic} 
                          onClick={() => selectSubtopic(subtopic)}
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
                        onChange={() => setPracticeMode(!practiceMode)} 
                        className="w-3 h-3 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-xs font-medium text-violet-700">Practice</span>
                    </label>
                  </div>
                
                {selectedTopic && (!hasSubtopics(selectedTopic) || selectedSubtopic) && getRulesFromSelection(selectedTopic, selectedSubtopic).length > 0 ? (
                  <div>
                    {availableRulesDisplayMode === 'buttons' ? (
                      <div className="grid grid-cols-3 gap-2">
                        {getRulesFromSelection(selectedTopic, selectedSubtopic).map((rule) => {
                           const ruleId = getRuleId(rule);
                           const isMastered = masteredRules.has(ruleId);
                           const conf = ruleConfidence[ruleId];
                           const isSelected = currentRule && getRuleId(currentRule) === ruleId;
                           
                           return(
                              <button 
                                key={ruleId} 
                                onClick={() => { setCurrentRule(rule); resetUIForNewRuleSelection(); }}
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
                                  onClick={() => { setCurrentRule(rule); resetUIForNewRuleSelection();}}
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

          {/* Study Area */}
          {currentRule && (
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
                          onClick={() => setShowHints(!showHints)} 
                          className={`p-2 rounded-lg transition-all duration-200 ${showHints ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:bg-amber-100'}`}
                          title={showHints ? "Hide Hint" : "Get Hint"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </button>
                      )}
                      
                      <button 
                        onClick={loadNewRule} 
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
                          onChange={(e) => setUserText(e.target.value)}
                          onKeyDown={handleKeyPress}
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
                          onChange={(e) => setUserText(e.target.value)}
                          onKeyDown={handleKeyPress}
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
                        onClick={compareTexts}
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
                            onClick={() => { setSelfRating(key); setRuleConfidenceLevel(getRuleId(currentRule), key); }}
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
                          <p className="text-sm text-indigo-700">
                            {selfRating === 'mastered' && "Excellent! This rule will appear less frequently in your practice sessions."}
                            {selfRating === 'needs-review' && "This rule will be prioritized in future study sessions."}
                            {selfRating === 'didnt-know' && "This rule will appear more frequently until you master it."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      
      <BrowsePopup />
      <SettingsPopup />
    </div>
  );
}

export default App;