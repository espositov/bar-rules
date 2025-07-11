// Test script for subtopic add/delete functionality
// Run this in the browser console to test the functions

console.log('Starting Subtopic Functionality Tests...\n');

// Test 1: Check if localStorage has rules data
console.log('Test 1: Checking localStorage for rules data');
const rulesData = localStorage.getItem('userRules');
if (rulesData) {
    console.log('✓ Rules data found in localStorage');
    try {
        const parsed = JSON.parse(rulesData);
        console.log(`✓ Found ${Object.keys(parsed).length} topics`);
        
        // Show first topic structure
        const firstTopic = Object.keys(parsed)[0];
        if (firstTopic) {
            console.log(`✓ First topic: "${firstTopic}"`);
            const topicData = parsed[firstTopic];
            if (typeof topicData === 'object' && !Array.isArray(topicData)) {
                const subtopics = Object.keys(topicData);
                console.log(`✓ Has ${subtopics.length} subtopics: ${subtopics.join(', ')}`);
            }
        }
    } catch (e) {
        console.error('✗ Error parsing rules data:', e);
    }
} else {
    console.log('✗ No rules data found - load the app first');
}

console.log('\n---\n');

// Test 2: Simulate adding a subtopic
console.log('Test 2: Testing subtopic structure');
const testData = {
    "Test Topic": {
        "Existing Subtopic": [
            { id: 1, name: "Rule 1", text: "Test rule 1" },
            { id: 2, name: "Rule 2", text: "Test rule 2" }
        ]
    }
};

// Add new subtopic
const newSubtopicName = "New Test Subtopic " + Date.now();
testData["Test Topic"][newSubtopicName] = [];
console.log('✓ Added new subtopic:', newSubtopicName);
console.log('✓ Topic now has subtopics:', Object.keys(testData["Test Topic"]));

// Test 3: Delete subtopic
console.log('\nTest 3: Testing subtopic deletion');
const subtopicToDelete = "Existing Subtopic";
const ruleCount = testData["Test Topic"][subtopicToDelete].length;
console.log(`✓ Subtopic "${subtopicToDelete}" has ${ruleCount} rules`);
delete testData["Test Topic"][subtopicToDelete];
console.log('✓ Deleted subtopic');
console.log('✓ Remaining subtopics:', Object.keys(testData["Test Topic"]));

console.log('\n---\nAll tests completed!');
console.log('\nTo test in the actual app:');
console.log('1. Run: npm run dev');
console.log('2. Select a topic');
console.log('3. Click the "+ Add" button next to Subtopics');
console.log('4. Add a new subtopic');
console.log('5. Hover over a subtopic and click X to delete');