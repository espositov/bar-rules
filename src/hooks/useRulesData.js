import { useState, useEffect, useCallback } from 'react';

// Helper function to assign unique IDs to rules if they don't have one
const assignIdsToRulesRecursively = (data, prefix = 'json', idCounterState = { count: 1 }) => {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        if (!item.id && item.name && item.text) {
          item.id = `${prefix}-rule-${idCounterState.count++}`;
        }
      }
      return item;
    });
  } else if (typeof data === 'object' && data !== null) {
    const newData = { ...data };
    for (const key in newData) {
      if (Object.prototype.hasOwnProperty.call(newData, key)) {
        newData[key] = assignIdsToRulesRecursively(newData[key], prefix, idCounterState);
      }
    }
    return newData;
  }
  return data;
};

const useRulesData = (LOCAL_STORAGE_KEYS) => {
  // Core state
  const [rulesByTopic, setRulesByTopic] = useState({});
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [currentRule, setCurrentRule] = useState(null);
  const [masteredRules, setMasteredRules] = useState(new Set());
  const [ruleConfidence, setRuleConfidence] = useState({});
  const [isUsingExcelData, setIsUsingExcelData] = useState(false);

  // Utility functions
  const getRuleId = useCallback((rule) => {
    if (!rule) return null;
    if (rule.id) return rule.id;
    
    console.warn('Rule missing ID, generating temporary ID:', rule.name, selectedTopic, selectedSubtopic);
    const topicPart = selectedTopic || 'unknown-topic';
    const subtopicPart = selectedSubtopic || 'unknown-subtopic';
    return `${topicPart}-${subtopicPart}-${rule.name}`;
  }, [selectedTopic, selectedSubtopic]);

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
    return Array.isArray(topicData) ? topicData : [];
  }, [rulesByTopic, hasSubtopics]);

  // Initialize first rule helper
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

  // Load rules from storage or default
  const loadAndSetRules = useCallback(() => {
    try {
      const savedRules = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_RULES);

      const loadDefaultRules = () => {
        fetch('./rules.json')
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then(fetchedData => {
            const dataWithIds = assignIdsToRulesRecursively(JSON.parse(JSON.stringify(fetchedData)), 'json');
            setRulesByTopic(dataWithIds);
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER_RULES, JSON.stringify(dataWithIds));
            initializeFirstRule(dataWithIds);
          })
          .catch(error => {
            console.error('Error loading initial rules from rules.json:', error);
            setRulesByTopic({});
          });
      };
      
      if (savedRules) {
        const data = JSON.parse(savedRules);
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
      loadAndSetRules();
    }
  }, [initializeFirstRule, isUsingExcelData, LOCAL_STORAGE_KEYS.USER_RULES]);

  // Progress tracking functions
  const markRuleAsMastered = useCallback((ruleId) => {
    if (!ruleId) return;
    setMasteredRules(prevMastered => {
      const newMastered = new Set(prevMastered);
      newMastered.add(ruleId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MASTERED_RULES, JSON.stringify([...newMastered]));
      return newMastered;
    });
  }, [LOCAL_STORAGE_KEYS.MASTERED_RULES]);

  const setRuleConfidenceLevel = useCallback((ruleId, confidence) => {
    if (!ruleId) return;
    setRuleConfidence(prevConfidence => {
      const newConfidence = { ...prevConfidence, [ruleId]: confidence };
      localStorage.setItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE, JSON.stringify(newConfidence));
      return newConfidence;
    });
    if (confidence === 'mastered') markRuleAsMastered(ruleId);
  }, [markRuleAsMastered, LOCAL_STORAGE_KEYS.RULE_CONFIDENCE]);

  // Navigation functions
  const selectTopic = useCallback((topic, resetUI) => {
    setSelectedTopic(topic);
    setSelectedSubtopic('');
    setCurrentRule(null);
    if (resetUI) resetUI();

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
  }, [rulesByTopic, hasSubtopics]);

  const selectSubtopic = useCallback((subtopic, resetUI) => {
    setSelectedSubtopic(subtopic);
    setCurrentRule(null);
    if (resetUI) resetUI();

    const rules = getRulesFromSelection(selectedTopic, subtopic);
    if (rules.length > 0) {
        setCurrentRule(rules[Math.floor(Math.random() * rules.length)]);
    }
  }, [selectedTopic, getRulesFromSelection]);

  const loadNewRule = useCallback((resetUI) => {
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
      if (resetUI) resetUI();
    }
  }, [selectedTopic, selectedSubtopic, getRulesFromSelection, currentRule, getRuleId]);

  // Load initial data
  useEffect(() => {
    const usingExcel = localStorage.getItem(LOCAL_STORAGE_KEYS.IS_USING_EXCEL_DATA) === 'true';
    setIsUsingExcelData(usingExcel);
    loadAndSetRules();

    try {
      const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEYS.MASTERED_RULES);
      if (savedProgress) setMasteredRules(new Set(JSON.parse(savedProgress)));
    } catch (e) { 
      console.error("Error parsing masteredRules", e); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.MASTERED_RULES); 
    }

    try {
      const savedConfidence = localStorage.getItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE);
      if (savedConfidence) setRuleConfidence(JSON.parse(savedConfidence));
    } catch (e) { 
      console.error("Error parsing ruleConfidence", e); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.RULE_CONFIDENCE); 
    }
  }, [loadAndSetRules, LOCAL_STORAGE_KEYS]);

  // Auto-select rule when there's only one available
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

  return {
    // State
    rules: {
      byTopic: rulesByTopic,
      setByTopic: setRulesByTopic,
      current: currentRule,
      setCurrent: setCurrentRule,
      selected: {
        topic: selectedTopic,
        subtopic: selectedSubtopic
      }
    },
    progress: {
      mastered: masteredRules,
      setMastered: setMasteredRules,
      confidence: ruleConfidence,
      setConfidence: setRuleConfidence
    },
    meta: {
      isUsingExcelData,
      setIsUsingExcelData
    },
    
    // Actions
    actions: {
      selectTopic,
      selectSubtopic,
      loadNewRule,
      markAsMastered: markRuleAsMastered,
      setConfidenceLevel: setRuleConfidenceLevel,
      loadRules: loadAndSetRules,
      initializeFirstRule
    },
    
    // Utilities
    utils: {
      getRuleId,
      hasSubtopics,
      getRulesFromSelection
    }
  };
};

export default useRulesData;