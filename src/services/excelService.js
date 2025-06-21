import * as XLSX from 'xlsx';

// Enhanced Excel parsing with better column handling and debug logging
export const parseExcelData = (jsonData) => {
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
};

// Parse Excel file and return parsed data
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) throw new Error(`Sheet "${worksheetName}" not found.`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        const parsedRules = parseExcelData(jsonData);
        
        resolve(parsedRules);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('File could not be read.'));
    };
    reader.readAsArrayBuffer(file);
  });
};

// Download Excel template
export const downloadExcelTemplate = () => {
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
};

// Download updated progress as Excel
export const downloadUpdatedProgress = (rulesByTopic, ruleConfidence, getRuleId) => {
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
};