# Subtopic Add/Delete Feature Test Guide

## Overview
This guide helps you test the newly added subtopic management features.

## Features Added

### 1. Add Subtopic
- **Location**: "+ Add" button next to "Subtopics" header
- **Visibility**: Only visible when a topic is selected
- **Function**: Opens a modal to add new subtopics

### 2. Delete Subtopic  
- **Location**: X button on each subtopic (appears on hover)
- **Function**: Opens confirmation dialog before deletion
- **Warning**: Shows rule count if subtopic contains rules

## Testing Steps

### Test 1: Adding a Subtopic
1. Start the app: `npm run dev`
2. Select any topic (e.g., "Business Associations")
3. Look for the orange "+ Add" button next to "Subtopics"
4. Click the button - a modal should appear
5. Try these scenarios:
   - **Empty name**: Leave blank and click Add (should show error)
   - **Duplicate name**: Enter existing subtopic name (should show error)
   - **Valid name**: Enter "Test Subtopic" and click Add
6. Verify the new subtopic appears and is selected

### Test 2: Deleting a Subtopic
1. Hover over any subtopic - an X button should appear
2. Click the X button - confirmation dialog should appear
3. Check the dialog shows:
   - Correct subtopic name
   - Number of rules (if any)
   - Warning message for non-empty subtopics
4. Click "Delete" to confirm
5. Verify the subtopic is removed
6. If it was selected, verify another subtopic is auto-selected

### Test 3: Edge Cases
1. **Delete last subtopic**: What happens when you delete the only subtopic?
2. **Add to empty topic**: Can you add subtopics to a topic with no existing ones?
3. **Special characters**: Try adding subtopics with quotes, slashes, etc.
4. **Long names**: Test with very long subtopic names

### Test 4: Persistence
1. Add a new subtopic
2. Refresh the page (F5)
3. Verify the subtopic is still there
4. Delete a subtopic
5. Refresh again
6. Verify it's still deleted

## Visual Indicators

### Add Button
- Color: Orange (matches subtopic theme)
- Icon: Plus sign
- Text: "Add"
- Hover effect: Darker orange

### Delete Button
- Color: Red on white background
- Icon: X (cross)
- Visibility: Only on hover
- Hover effect: Red background

## Data Structure
The app maintains this structure:
```json
{
  "Topic Name": {
    "Subtopic 1": [rules...],
    "Subtopic 2": [rules...],
    "New Subtopic": []
  }
}
```

## Console Testing
Open browser console (F12) and run:
```javascript
// Check current data structure
const data = JSON.parse(localStorage.getItem('userRules'));
console.log(data);

// See topics and their subtopics
Object.entries(data).forEach(([topic, subtopics]) => {
  console.log(`${topic}:`, Object.keys(subtopics));
});
```

## Common Issues
1. **Button not visible**: Make sure a topic is selected first
2. **Delete not working**: Check if you're hovering properly
3. **Changes not saving**: Check browser console for errors

## Success Criteria
- ✅ Can add new subtopics with validation
- ✅ Can delete subtopics with confirmation
- ✅ Data persists across page reloads
- ✅ UI updates immediately after changes
- ✅ Proper error handling and user feedback