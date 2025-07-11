# Add Rule Feature Documentation

## Overview
This feature allows users to add new rules to any selected topic/subtopic directly from the UI.

## Implementation Details

### 1. **Add Rule Button**
- **Location**: Next to "Rules" header in RulesGrid component
- **Color**: Violet/Purple (matches Rules section theme)
- **Icon**: Plus sign (+)
- **Visibility**: Only shows when a topic (and subtopic if applicable) is selected

### 2. **AddRuleModal Component**
- **Fields**:
  - Rule Name (required, must be unique within subtopic)
  - Rule Text (required, multi-line textarea)
- **Features**:
  - Shows current location (Topic > Subtopic)
  - Input validation with error messages
  - Auto-focus on name field when opened
  - Cancel and Add Rule buttons

### 3. **Data Flow**
1. User clicks "+ Add" button → Modal opens
2. User enters rule name and text
3. Validation checks for:
   - Empty fields
   - Duplicate rule names (case-insensitive)
4. On success:
   - New rule is added to the data structure
   - Rule gets a unique ID (auto-incremented)
   - Data is saved to localStorage
   - New rule is automatically selected
   - Modal closes
   - UI resets for practice

### 4. **Rule ID Generation**
- System finds the highest numeric ID across all rules
- New rules get `rule-{maxId + 1}` format
- Handles both numeric and string IDs gracefully

## Usage Instructions

### Adding a Rule
1. Select a topic from the dropdown/grid
2. Select a subtopic (if the topic has subtopics)
3. Click the violet "+ Add" button next to "Rules"
4. Enter a rule name (e.g., "Fiduciary Duty")
5. Enter the rule text (full definition/explanation)
6. Click "Add Rule"

### Validation Rules
- **Rule Name**: Cannot be empty, must be unique within the subtopic
- **Rule Text**: Cannot be empty
- **Duplicates**: Checked case-insensitively within the same subtopic

## Technical Implementation

### Component Changes
1. **AddRuleModal.jsx**: New modal component for rule input
2. **useRulesData.js**: Added `addRule` function
3. **RulesGrid.jsx**: Added Add button and `onAddRule` prop
4. **App.jsx**: Added modal state management

### Data Structure
```javascript
{
  "Topic Name": {
    "Subtopic Name": [
      {
        "id": "rule-123",
        "name": "Rule Name",
        "text": "Rule definition text"
      }
    ]
  }
}
```

## Testing

### Manual Testing Checklist
- [ ] Add button appears when topic/subtopic selected
- [ ] Modal opens on button click
- [ ] Can't submit with empty fields
- [ ] Can't add duplicate rule names
- [ ] New rule appears in grid immediately
- [ ] New rule is selected automatically
- [ ] Rule count updates in header
- [ ] Data persists on page reload

### Edge Cases to Test
1. **Long Content**: Very long rule names and text
2. **Special Characters**: Rules with quotes, symbols, unicode
3. **Rapid Addition**: Adding multiple rules quickly
4. **Empty Subtopic**: Adding first rule to empty subtopic

## Visual Design
- **Add Button**: Violet background (#8B5CF6), white text
- **Hover State**: Darker violet (#7C3AED)
- **Modal**: White background, standard form styling
- **Error Messages**: Red text (#DC2626)

## Future Enhancements
1. Add rich text editor for rule text
2. Add categories/tags to rules
3. Import rules from CSV/Excel
4. Bulk rule addition
5. Rule templates

## Troubleshooting

### Common Issues
1. **Button not visible**: Ensure topic and subtopic are selected
2. **Can't add rule**: Check browser console for errors
3. **Rule not saving**: Verify localStorage is not full
4. **Duplicate error**: Rule name already exists (check case)

### Debug Commands
```javascript
// Check current rules
const data = JSON.parse(localStorage.getItem('userRules'));
console.log(data);

// Find highest rule ID
let maxId = 0;
// ... (iterate through all rules to find max ID)

// Clear all rules (CAUTION!)
localStorage.removeItem('userRules');
```