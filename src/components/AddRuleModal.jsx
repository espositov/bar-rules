import React, { useState, useEffect, useRef } from 'react';

function AddRuleModal({ isOpen, onClose, onAdd, selectedTopic, selectedSubtopic, existingRules }) {
  const [ruleName, setRuleName] = useState('');
  const [ruleText, setRuleText] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRuleName('');
      setRuleText('');
      setError('');
      // Focus the name input when modal opens
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = ruleName.trim();
    const trimmedText = ruleText.trim();
    
    if (!trimmedName) {
      setError('Rule name cannot be empty');
      return;
    }
    
    if (!trimmedText) {
      setError('Rule text cannot be empty');
      return;
    }
    
    // Check for duplicate rule names in the current subtopic/topic
    const existingRuleNames = existingRules.map(r => r.name.toLowerCase());
    if (existingRuleNames.includes(trimmedName.toLowerCase())) {
      setError('A rule with this name already exists');
      return;
    }
    
    onAdd(trimmedName, trimmedText);
    onClose();
  };

  if (!isOpen) return null;

  const location = selectedSubtopic 
    ? `${selectedTopic} > ${selectedSubtopic}`
    : selectedTopic;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Add New Rule</h2>
        <p className="text-sm text-gray-600 mb-4">
          Adding rule to: <span className="font-medium">{location}</span>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name
            </label>
            <input
              ref={nameInputRef}
              id="rule-name"
              type="text"
              value={ruleName}
              onChange={(e) => {
                setRuleName(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 ${
                error && !ruleText ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter a concise rule name..."
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="rule-text" className="block text-sm font-medium text-gray-700 mb-2">
              Rule Text
            </label>
            <textarea
              id="rule-text"
              value={ruleText}
              onChange={(e) => {
                setRuleText(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 min-h-[120px] ${
                error && ruleText ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the full rule text..."
              rows="5"
            />
          </div>
          
          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-all duration-200"
            >
              Add Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRuleModal;