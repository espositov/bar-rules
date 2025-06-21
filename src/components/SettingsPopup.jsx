import React from 'react';

const SettingsPopup = ({
  showSettings,
  setShowSettings,
  topicDisplayMode,
  setTopicDisplayMode,
  availableRulesDisplayMode,
  setAvailableRulesDisplayMode,
  showProgressPercentages,
  setShowProgressPercentages,
  isUsingExcelData,
  downloadExcelTemplate,
  handleExcelUpload,
  uploadProgress
}) => {
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
              <div className={`p-2 rounded text-sm mb-2 ${isUsingExcelData ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                  {isUsingExcelData ? '✓ Using Your Custom Rules' : '⚠️ Using Sample Demo Rules - Upload Your Own'}
              </div>
              <div className="space-y-2">
                  <button onClick={downloadExcelTemplate} className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-300">Download Sample Template</button>
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

export default SettingsPopup;