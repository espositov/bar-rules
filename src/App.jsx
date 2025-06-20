import React, { useState, useEffect } from 'react';
import DiffMatchPatch from 'diff-match-patch';

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

  // --- NEW: Function to load rules from localStorage or fetch from file ---
  const loadAndSetRules = () => {
    try {
      const savedRules = localStorage.getItem('userRules');

      if (savedRules) {
        // If rules are found in localStorage, use them
        const data = JSON.parse(savedRules);
        setRulesByTopic(data);
        initializeFirstRule(data); // Helper to select the first rule
      } else {
        // Otherwise, fetch the default JSON file
        fetch('/rules.json')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            setRulesByTopic(data);
            // Save the fetched rules to localStorage for next time
            localStorage.setItem('userRules', JSON.stringify(data));
            initializeFirstRule(data); // Helper to select the first rule
          })
          .catch(error => {
            console.error('Error loading initial rules:', error);
          });
      }
    } catch (error) {
      console.error('Failed to load rules from localStorage:', error);
      // Clear potentially corrupted storage and refetch
      localStorage.removeItem('userRules');
      fetch('/rules.json').then(res => res.json()).then(data => setRulesByTopic(data));
    }
  };
  
  // Helper function to set the initial selected rule after data is loaded
  const initializeFirstRule = (data) => {
    const topics = Object.keys(data);
    if (topics.length > 0) {
      const firstTopic = topics[0];
      setSelectedTopic(firstTopic);

      const topicData = data[firstTopic];
      if (typeof topicData === 'object' && !Array.isArray(topicData)) {
        const subtopics = Object.keys(topicData);
        if (subtopics.length > 0) {
          const firstSubtopic = subtopics[0];
          setSelectedSubtopic(firstSubtopic);
          const rules = topicData[firstSubtopic];
          if (rules && rules.length > 0) {
            const randomRule = rules[Math.floor(Math.random() * rules.length)];
            setCurrentRule(randomRule);
          }
        }
      } else if (Array.isArray(topicData) && topicData.length > 0) {
        const randomRule = topicData[Math.floor(Math.random() * topicData.length)];
        setCurrentRule(randomRule);
      }
    }
  };

  // --- UPDATED: useEffect now calls the new loading function ---
  useEffect(() => {
    loadAndSetRules();
  }, []);

  // Helper function to get rules from topic/subtopic
  const getRulesFromSelection = (topic, subtopic = null) => {
    const topicData = rulesByTopic[topic];
    if (!topicData) return [];
    
    if (typeof topicData === 'object' && !Array.isArray(topicData)) {
      if (subtopic && topicData[subtopic]) {
        return topicData[subtopic];
      }
      const firstSubtopic = Object.keys(topicData)[0];
      return topicData[firstSubtopic] || [];
    }
    
    return topicData;
  };

  // Function to compare texts and generate diff
  const compareTexts = () => {
    if (!currentRule || !userText.trim()) return;

    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(currentRule.text, userText);
    dmp.diff_cleanupSemantic(diffs);

    const totalChars = Math.max(currentRule.text.length, userText.length);
    let matchingChars = 0;
    
    diffs.forEach(([type, text]) => {
      if (type === 0) { // Equal
        matchingChars += text.length;
      }
    });
    
    const similarityScore = Math.round((matchingChars / totalChars) * 100);

    setComparisonResult({
      diffs,
      similarityScore
    });
    setShowComparison(true);
  };

  // Function to render diff results with highlighting
  const renderDiff = () => {
    if (!comparisonResult) return null;
    const { diffs } = comparisonResult;
    
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Your text compared to model:</div>
        <div className="text-base leading-relaxed">
          {diffs.map(([type, text], index) => {
            let className = '';
            let label = '';
            
            if (type === -1) {
              className = 'bg-yellow-200 text-yellow-800';
              label = 'Missing';
            } else if (type === 1) {
              className = 'bg-red-200 text-red-800';
              label = 'Extra/Incorrect';
            } else {
              className = 'bg-green-200 text-green-800';
              label = 'Correct';
            }
            
            return (
              <span key={index} className={`${className} px-1 rounded`} title={label}>
                {text}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to select a topic
  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    const topicData = rulesByTopic[topic];
    
    setSelectedSubtopic('');
    
    if (typeof topicData === 'object' && !Array.isArray(topicData)) {
      const subtopics = Object.keys(topicData);
      if (subtopics.length > 0) {
        const firstSubtopic = subtopics[0];
        setSelectedSubtopic(firstSubtopic);
        const rules = topicData[firstSubtopic];
        if (rules && rules.length > 0) {
          const randomRule = rules[Math.floor(Math.random() * rules.length)];
          setCurrentRule(randomRule);
        }
      }
    } else if (Array.isArray(topicData) && topicData.length > 0) {
      const randomRule = topicData[Math.floor(Math.random() * topicData.length)];
      setCurrentRule(randomRule);
    }
    
    setUserText('');
    setShowComparison(false);
    setComparisonResult(null);
  };

  // Function to select a subtopic
  const selectSubtopic = (subtopic) => {
    setSelectedSubtopic(subtopic);
    const topicData = rulesByTopic[selectedTopic];
    if (topicData && topicData[subtopic]) {
      const rules = topicData[subtopic];
      if (rules.length > 0) {
        const randomRule = rules[Math.floor(Math.random() * rules.length)];
        setCurrentRule(randomRule);
        setUserText('');
        setShowComparison(false);
        setComparisonResult(null);
      }
    }
  };

  // Function to load new random rule from selected topic/subtopic
  const loadNewRule = () => {
    const rules = getRulesFromSelection(selectedTopic, selectedSubtopic);
    if (rules.length > 0) {
      const randomRule = rules[Math.floor(Math.random() * rules.length)];
      setCurrentRule(randomRule);
      setUserText('');
      setShowComparison(false);
      setComparisonResult(null);
    }
  };

  const hasSubtopics = (topic) => {
    if (!topic) return false;
    const topicData = rulesByTopic[topic];
    return topicData && typeof topicData === 'object' && !Array.isArray(topicData);
  };

  const togglePracticeMode = () => {
    setPracticeMode(!practiceMode);
    setUserText('');
    setShowComparison(false);
    setComparisonResult(null);
  };

  const handlePracticeKeyDown = (e) => {
    if (!currentRule || !practiceMode) return;
    
    if (e.key !== 'Backspace' && e.key.length > 1) {
        e.preventDefault();
        return;
    }
    
    if (e.key === 'Backspace') {
      setUserText(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setUserText(prev => prev + e.key);
    }
  };

  const renderTypingPractice = () => {
    if (!currentRule) return null;
    
    const targetText = currentRule.text;
    const userInput = userText;
    const currentIndex = userInput.length;
    
    return (
      <div
        className="relative font-mono text-lg leading-relaxed p-4 bg-white border border-gray-300 rounded-md min-h-[160px] cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500"
        tabIndex={0}
        onKeyDown={handlePracticeKeyDown}
        onClick={(e) => e.currentTarget.focus()}
      >
        {targetText.split('').map((char, index) => {
          let className = '';
          
          if (index < userInput.length) {
            className = userInput[index] === char ? 'text-black bg-green-100' : 'text-white bg-red-500';
          } else if (index === currentIndex) {
            return (
              <span key={index} className="bg-blue-200 animate-pulse">
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          } else {
            className = 'text-gray-400';
          }
          
          return (
            <span key={index} className={className}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      compareTexts();
    }
  };

  const downloadRulesAsJSON = () => {
    const dataStr = JSON.stringify(rulesByTopic, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'rules_updated.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearLocalStorageAndReload = () => {
    if (confirm('This will clear all saved changes and reload rules from the JSON file. Continue?')) {
      localStorage.removeItem('userRules');
      window.location.reload();
    }
  };

  // Browse popup component
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

    const handleTopicChange = (selectedTopic) => {
      if (selectedTopic === '__ADD_NEW__') {
        setIsAddingNewTopic(true);
        setNewTopic('');
      } else {
        setIsAddingNewTopic(false);
        setNewTopic(selectedTopic);
        setCustomTopicName('');
      }
    };

    // --- UPDATED: handleAddRule now saves to localStorage ---
    const handleAddRule = () => {
      const finalTopic = isAddingNewTopic ? customTopicName : newTopic;
      if (!finalTopic || !newName || !newText) {
        alert('Please fill in Topic, Question, and Text fields');
        return;
      }

      const updatedRules = { ...rulesByTopic };
      const ruleObject = { name: newName, text: newText };

      if (newSubtopic && newSubtopic !== '-') {
        if (!updatedRules[finalTopic]) {
          updatedRules[finalTopic] = {};
        }
        if (!updatedRules[finalTopic][newSubtopic]) {
          updatedRules[finalTopic][newSubtopic] = [];
        }
        updatedRules[finalTopic][newSubtopic].push(ruleObject);
      } else {
        if (!updatedRules[finalTopic]) {
          updatedRules[finalTopic] = [];
        }
        if (Array.isArray(updatedRules[finalTopic])) {
          updatedRules[finalTopic].push(ruleObject);
        } else {
          alert('This topic already has subtopics. Please specify a subtopic.');
          return;
        }
      }

      // 1. Update the React state
      setRulesByTopic(updatedRules);
      
      // 2. Persist the changes to localStorage
      try {
        localStorage.setItem('userRules', JSON.stringify(updatedRules));
      } catch (error) {
        console.error("Failed to save rules to localStorage:", error);
        alert("Error: Could not save the new rule.");
      }

      setNewTopic('');
      setNewSubtopic('');
      setNewName('');
      setNewText('');
      setIsAddingNewTopic(false);
      setCustomTopicName('');
      setShowAddRow(false);
      alert('Rule added! It has been saved to your browser.');
    };

    const handleDeleteRule = (topic, subtopic, ruleIndex) => {
      if (!confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
        return;
      }

      const updatedRules = { ...rulesByTopic };
      
      if (subtopic && subtopic !== '-') {
        // Remove from subtopic array
        updatedRules[topic][subtopic].splice(ruleIndex, 1);
        
        // If subtopic is now empty, remove it
        if (updatedRules[topic][subtopic].length === 0) {
          delete updatedRules[topic][subtopic];
          
          // If topic has no more subtopics, remove the topic entirely
          if (Object.keys(updatedRules[topic]).length === 0) {
            delete updatedRules[topic];
          }
        }
      } else {
        // Remove from topic array
        updatedRules[topic].splice(ruleIndex, 1);
        
        // If topic is now empty, remove it
        if (updatedRules[topic].length === 0) {
          delete updatedRules[topic];
        }
      }

      // Update state and localStorage
      setRulesByTopic(updatedRules);
      try {
        localStorage.setItem('userRules', JSON.stringify(updatedRules));
      } catch (error) {
        console.error("Failed to save rules to localStorage:", error);
      }
      
      alert('Rule deleted successfully.');
    };

    const tableData = [];
    Object.entries(rulesByTopic).forEach(([topic, topicData]) => {
      if (typeof topicData === 'object' && !Array.isArray(topicData)) {
        Object.entries(topicData).forEach(([subtopic, rules]) => {
          rules.forEach((rule, ruleIndex) => {
            tableData.push({ topic, subtopic, rule, ruleIndex });
          });
        });
      } else if (Array.isArray(topicData)) {
        topicData.forEach((rule, ruleIndex) => {
          tableData.push({ topic, subtopic: '-', rule, ruleIndex });
        });
      }
    });

    // Filter table data based on search query
    const filteredTableData = searchQuery
      ? tableData.filter(row => {
          const searchLower = searchQuery.toLowerCase();
          return (
            row.topic.toLowerCase().includes(searchLower) ||
            row.subtopic.toLowerCase().includes(searchLower) ||
            row.rule.name.toLowerCase().includes(searchLower) ||
            row.rule.text.toLowerCase().includes(searchLower)
          );
        })
      : tableData;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">Browse All Rules</h2>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rules, topics, or text..."
                  className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => setShowAddRow(!showAddRow)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm"
              >
                {showAddRow ? 'Cancel' : 'Add New Rule'}
              </button>
              <button
                onClick={downloadRulesAsJSON}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
              >
                Download as JSON
              </button>
              <button
                onClick={clearLocalStorageAndReload}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors shadow-sm"
              >
                Reset to JSON File
              </button>
              <button
                onClick={() => setShowBrowsePopup(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-3 font-semibold text-gray-800 w-1/4 break-words">Topic</th>
                  <th className="text-left p-3 font-semibold text-gray-800 w-1/5 break-words">Subtopic</th>
                  <th className="text-left p-3 font-semibold text-gray-800 w-2/5 break-words">Rule</th>
                  <th className="text-left p-3 font-semibold text-gray-800 w-1/6 break-words">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showAddRow && (
                  <tr className="border-b-2 border-green-300 bg-green-50">
                    <td className="p-3 w-1/4 break-words">
                      <div className="space-y-2">
                        <select
                          value={isAddingNewTopic ? '__ADD_NEW__' : newTopic}
                          onChange={(e) => handleTopicChange(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Topic*</option>
                          {Object.keys(rulesByTopic).map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                          <option value="__ADD_NEW__">Add new...</option>
                        </select>
                        {isAddingNewTopic && (
                          <input
                            type="text"
                            value={customTopicName}
                            onChange={(e) => setCustomTopicName(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter new topic name*"
                            autoFocus
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 w-1/5 break-words">
                      <input
                        type="text"
                        value={newSubtopic}
                        onChange={(e) => setNewSubtopic(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Subtopic (optional)"
                      />
                    </td>
                    <td className="p-3 w-2/5 break-words">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Rule Name*"
                        />
                        <textarea
                          value={newText}
                          onChange={(e) => setNewText(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded h-20 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Rule text*"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddRule}
                            disabled={!(isAddingNewTopic ? customTopicName : newTopic) || !newName || !newText}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowAddRow(false);
                              setNewTopic('');
                              setNewSubtopic('');
                              setNewName('');
                              setNewText('');
                              setIsAddingNewTopic(false);
                              setCustomTopicName('');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 w-1/6 break-words"></td>
                  </tr>
                )}
                {filteredTableData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-500">
                      {searchQuery ? `No rules found matching "${searchQuery}"` : 'No rules available'}
                    </td>
                  </tr>
                ) : (
                  filteredTableData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 group"
                    >
                      <td className="p-3 text-gray-700 w-1/4 break-words">{row.topic}</td>
                      <td className="p-3 text-gray-700 w-1/5 break-words">{row.subtopic}</td>
                      <td 
                        className="p-3 text-gray-700 cursor-pointer hover:text-blue-600 w-2/5 break-words"
                        onClick={() => {
                          setSelectedTopic(row.topic);
                          setSelectedSubtopic(row.subtopic === '-' ? '' : row.subtopic);
                          setCurrentRule(row.rule);
                          setUserText('');
                          setShowComparison(false);
                          setComparisonResult(null);
                          setShowBrowsePopup(false);
                        }}
                      >
                        <div className="font-medium text-sm text-blue-600 mb-1 break-words">{row.rule.name}</div>
                        <div className="text-xs text-gray-600 break-words overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}}>{row.rule.text}</div>
                      </td>
                      <td className="p-3 w-1/6">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedTopic(row.topic);
                              setSelectedSubtopic(row.subtopic === '-' ? '' : row.subtopic);
                              setCurrentRule(row.rule);
                              setUserText('');
                              setShowComparison(false);
                              setComparisonResult(null);
                              setShowBrowsePopup(false);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Select this rule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRule(row.topic, row.subtopic, row.ruleIndex);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete this rule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="h-8"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bar Rules Study Tool</h1>
          <p className="text-gray-600">Practice and master your legal knowledge</p>
        </header>
        
        <div className="space-y-4">
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-800">Select Topic</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(rulesByTopic).map((topic) => (
                <button
                  key={topic}
                  onClick={() => selectTopic(topic)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                    selectedTopic === topic
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          
          {hasSubtopics(selectedTopic) && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-gray-800">Select Subtopic</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.keys(rulesByTopic[selectedTopic] || {}).map((subtopic) => (
                  <button
                    key={subtopic}
                    onClick={() => selectSubtopic(subtopic)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                      selectedSubtopic === subtopic
                        ? 'bg-green-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                    }`}
                  >
                    {subtopic}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-gray-800">Current Rule</h2>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-purple-800">
                    {currentRule ? currentRule.name : 'Loading...'}
                  </div>
                </div>
                
                {/* Rule number selector */}
                {getRulesFromSelection(selectedTopic, selectedSubtopic).length > 1 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Available Rules:</label>
                    <div className="flex flex-wrap gap-2">
                      {getRulesFromSelection(selectedTopic, selectedSubtopic).map((rule, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentRule(rule);
                            setUserText('');
                            setShowComparison(false);
                            setComparisonResult(null);
                          }}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-200 ${
                            currentRule && currentRule.name === rule.name
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={practiceMode}
                    onChange={togglePracticeMode}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Practice Mode</span>
                </label>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadNewRule}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                New Rule
              </button>
              <button
                onClick={() => setShowBrowsePopup(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
              >
                Browse All Rules
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h3 className="text-xl font-semibold text-gray-800">
                {practiceMode ? 'Practice Typing' : 'Memory Challenge'}
              </h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                {practiceMode 
                  ? 'Follow along with the text below. Correct characters will appear in green, mistakes in red.'
                  : 'Write out the complete rule from memory, then check your accuracy.'}
              </p>
            </div>
            
            {practiceMode ? (
              <div className="space-y-4">
                {renderTypingPractice()}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">
                        Progress: {userText.length}/{currentRule?.text.length || 0}
                      </span>
                      {userText.length === currentRule?.text.length && userText === currentRule?.text && (
                        <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Complete!
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Click the text above to focus</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Write the complete rule text here..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base leading-relaxed"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Characters: {userText.length}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Ctrl+Enter to check</span>
                  </div>
                  <button
                    onClick={compareTexts}
                    disabled={!userText.trim()}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                  >
                    Check Answer
                  </button>
                </div>
              </div>
            )}
          </div>

          {showComparison && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-xl font-semibold text-gray-800">Your Results</h3>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{comparisonResult?.similarityScore || 0}%</div>
                    <div className="text-sm opacity-90">Accuracy</div>
                  </div>
                </div>
              </div>
              
              {comparisonResult && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    {renderDiff()}
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Legend:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-medium">Green</span>
                        <span className="text-gray-600">Correct text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-medium">Yellow</span>
                        <span className="text-gray-600">Missing text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-200 text-red-800 px-2 py-1 rounded font-medium">Red</span>
                        <span className="text-gray-600">Extra/Incorrect</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BrowsePopup />
    </div>
  );
}

export default App;