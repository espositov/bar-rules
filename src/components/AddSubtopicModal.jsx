import React, { useState, useEffect, useRef } from 'react';

function AddSubtopicModal({ isOpen, onClose, onAdd, selectedTopic, existingSubtopics }) {
  const [subtopicName, setSubtopicName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSubtopicName('');
      setError('');
      // Focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = subtopicName.trim();
    
    if (!trimmedName) {
      setError('Subtopic name cannot be empty');
      return;
    }
    
    if (existingSubtopics.includes(trimmedName)) {
      setError('A subtopic with this name already exists');
      return;
    }
    
    onAdd(trimmedName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Add New Subtopic</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add a new subtopic to "{selectedTopic}"
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subtopic-name" className="block text-sm font-medium text-gray-700 mb-2">
              Subtopic Name
            </label>
            <input
              ref={inputRef}
              id="subtopic-name"
              type="text"
              value={subtopicName}
              onChange={(e) => {
                setSubtopicName(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter subtopic name..."
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
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
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200"
            >
              Add Subtopic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubtopicModal;