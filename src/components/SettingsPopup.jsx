import React from 'react';

const SettingsPopup = ({
  showSettings,
  setShowSettings,
  topicDisplayMode,
  setTopicDisplayMode,
  availableRulesDisplayMode,
  setAvailableRulesDisplayMode,
  subtopicDisplayMode,
  setSubtopicDisplayMode,
  showProgressPercentages,
  setShowProgressPercentages,
  isUsingExcelData,
  downloadExcelTemplate,
  handleExcelUpload,
  uploadProgress
}) => {
  if (!showSettings) return null;
  
  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Settings</h2>
            <button 
              onClick={() => setShowSettings(false)} 
              className="h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6 pr-2">
            {/* Topic Display Mode */}
            <div>
              <label className="text-sm sm:text-base font-semibold block mb-2">Topic Display</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="topicDisplay" value="grid" checked={topicDisplayMode === 'grid'} onChange={(e) => setTopicDisplayMode(e.target.value)} className="scale-110" /> Grid View</label>
                <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="topicDisplay" value="dropdown" checked={topicDisplayMode === 'dropdown'} onChange={(e) => setTopicDisplayMode(e.target.value)} className="scale-110" /> Dropdown View</label>
              </div>
            </div>
            {/* Available Rules Display Mode */}
            <div>
              <label className="text-sm sm:text-base font-semibold block mb-2">Rules List Display</label>
               <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="rulesDisplay" value="buttons" checked={availableRulesDisplayMode === 'buttons'} onChange={(e) => setAvailableRulesDisplayMode(e.target.value)} className="scale-110" /> Button Grid</label>
                  <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="rulesDisplay" value="scrollable" checked={availableRulesDisplayMode === 'scrollable'} onChange={(e) => setAvailableRulesDisplayMode(e.target.value)} className="scale-110" /> Scrollable List</label>
              </div>
            </div>
            {/* Subtopic Display Mode */}
            <div>
              <label className="text-sm sm:text-base font-semibold block mb-2">Subtopic Display</label>
               <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="subtopicDisplay" value="buttons" checked={subtopicDisplayMode === 'buttons'} onChange={(e) => setSubtopicDisplayMode(e.target.value)} className="scale-110" /> Button Grid</label>
                  <label className="flex items-center gap-3 text-sm sm:text-base"><input type="radio" name="subtopicDisplay" value="scrollable" checked={subtopicDisplayMode === 'scrollable'} onChange={(e) => setSubtopicDisplayMode(e.target.value)} className="scale-110" /> Scrollable List</label>
              </div>
            </div>
            {/* Progress Display */}
            <div>
              <label className="text-sm sm:text-base font-semibold block mb-2">Progress Display</label>
              <label className="flex items-center gap-3 text-sm sm:text-base"><input type="checkbox" checked={showProgressPercentages} onChange={(e) => setShowProgressPercentages(e.target.checked)} className="scale-110" /> Show progress percentages</label>
            </div>
            {/* Data Source */}
            <div className="border-t pt-4">
              <label className="text-sm sm:text-base font-semibold block mb-2">Data Source</label>
              <div className={`p-3 rounded text-xs sm:text-sm mb-3 ${isUsingExcelData ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                  {isUsingExcelData ? '✓ Using Your Custom Rules' : '⚠️ Using Sample Demo Rules - Upload Your Own'}
              </div>
              <div className="space-y-3">
                  <button onClick={downloadExcelTemplate} className="w-full px-4 py-3 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 border border-green-300 transition-colors">Download Sample Template</button>
                  <div className="relative">
                      <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files && handleExcelUpload(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="settings-excel-upload"/>
                      <label htmlFor="settings-excel-upload" className="block w-full text-center px-4 py-3 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border border-blue-300 cursor-pointer transition-colors">Upload Excel File</label>
                  </div>
                  {uploadProgress && <div className="text-xs text-center p-2 bg-yellow-50 border rounded text-yellow-800">{uploadProgress}</div>}
              </div>
            </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 flex justify-end flex-shrink-0 border-t pt-4">
            <button onClick={() => setShowSettings(false)} className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Done</button>
          </div>
        </div>
      </div>
    );
};

export default SettingsPopup;