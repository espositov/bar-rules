import React from 'react';
import { downloadExcelTemplate } from '../../services/excelService';

function Header({ 
  uploadProgress, 
  onExcelUpload, 
  onBrowseClick, 
  onDownloadProgress, 
  onSettingsClick 
}) {
  return (
    <div className="flex items-center justify-between gap-6 mb-6">
      {/* Header */}
      <header className="bg-gray-50/60 rounded-2xl p-3 shadow-md border border-gray-200/40 flex-1">
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

      {/* Action Buttons Container */}
      <div className="bg-gray-50/60 rounded-2xl p-3 shadow-md border border-gray-200/40">
        <div className="grid grid-cols-3 gap-2">
        {/* Row 1 */}
        <div className="relative group">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={(e) => e.target.files && onExcelUpload(e.target.files[0])} 
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
          onClick={onBrowseClick} 
          className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          title="Browse All Rules"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Browse
        </button>
        
        <button 
          onClick={onDownloadProgress} 
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
          onClick={onSettingsClick} 
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
    </div>
  );
}

export default Header;