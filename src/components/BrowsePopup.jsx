import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';

const BrowsePopup = ({ 
  showBrowsePopup, 
  setShowBrowsePopup, 
  rulesByTopic, 
  setRulesByTopic,
  hasSubtopics,
  getRuleId,
  setSelectedTopic,
  setSelectedSubtopic,
  setCurrentRule,
  resetUIForNewRuleSelection,
  LOCAL_STORAGE_KEYS 
}) => {
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
  }, [isAddingNewTopic, customTopicName, newTopic, newSubtopic, newName, newText, rulesByTopic, LOCAL_STORAGE_KEYS.USER_RULES]);

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
  }, [rulesByTopic, LOCAL_STORAGE_KEYS.USER_RULES]);

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

export default BrowsePopup;