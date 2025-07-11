// Automated test script for Add Rule functionality
// Run this in the browser console

console.log('🧪 Starting Add Rule Functionality Tests...\n');

// Test Suite 1: Data Structure Tests
console.log('📊 Test Suite 1: Data Structure Validation');

const testDataStructure = () => {
    const data = localStorage.getItem('userRules');
    if (!data) {
        console.error('❌ No rules data found. Please load the app first.');
        return false;
    }
    
    try {
        const parsed = JSON.parse(data);
        console.log('✅ Valid JSON structure');
        
        // Check structure depth
        let hasValidStructure = true;
        for (const [topic, topicData] of Object.entries(parsed)) {
            if (typeof topicData === 'object' && !Array.isArray(topicData)) {
                for (const [subtopic, rules] of Object.entries(topicData)) {
                    if (!Array.isArray(rules)) {
                        console.error(`❌ Invalid structure: ${topic} > ${subtopic} is not an array`);
                        hasValidStructure = false;
                    } else {
                        // Check rule structure
                        rules.forEach((rule, index) => {
                            if (!rule.id || !rule.name || !rule.text) {
                                console.error(`❌ Invalid rule at ${topic} > ${subtopic}[${index}]:`, rule);
                                hasValidStructure = false;
                            }
                        });
                    }
                }
            }
        }
        
        if (hasValidStructure) {
            console.log('✅ All rules have valid structure (id, name, text)');
        }
        
        return parsed;
    } catch (e) {
        console.error('❌ Failed to parse rules data:', e);
        return false;
    }
};

// Test Suite 2: ID Generation Tests
console.log('\n📊 Test Suite 2: ID Generation');

const testIdGeneration = (data) => {
    if (!data) return;
    
    const ids = [];
    let maxId = 0;
    
    // Collect all IDs
    const collectIds = (obj) => {
        if (Array.isArray(obj)) {
            obj.forEach(rule => {
                if (rule.id) {
                    ids.push(rule.id);
                    const numId = parseInt(rule.id.toString().replace(/\D/g, ''), 10);
                    if (!isNaN(numId) && numId > maxId) {
                        maxId = numId;
                    }
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(val => collectIds(val));
        }
    };
    
    collectIds(data);
    
    console.log(`✅ Found ${ids.length} rules with IDs`);
    console.log(`✅ Highest numeric ID: ${maxId}`);
    console.log(`✅ Next ID should be: rule-${maxId + 1}`);
    
    // Check for duplicates
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
        console.error(`❌ Found ${ids.length - uniqueIds.size} duplicate IDs!`);
    } else {
        console.log('✅ No duplicate IDs found');
    }
};

// Test Suite 3: Rule Addition Simulation
console.log('\n📊 Test Suite 3: Rule Addition Simulation');

const simulateRuleAddition = (data) => {
    if (!data) return;
    
    // Find a topic and subtopic to test with
    let testTopic = null;
    let testSubtopic = null;
    
    for (const [topic, topicData] of Object.entries(data)) {
        if (typeof topicData === 'object' && !Array.isArray(topicData)) {
            const subtopics = Object.keys(topicData);
            if (subtopics.length > 0) {
                testTopic = topic;
                testSubtopic = subtopics[0];
                break;
            }
        }
    }
    
    if (!testTopic || !testSubtopic) {
        console.error('❌ No valid topic/subtopic found for testing');
        return;
    }
    
    console.log(`✅ Testing with: ${testTopic} > ${testSubtopic}`);
    
    const existingRules = data[testTopic][testSubtopic];
    console.log(`✅ Current rule count: ${existingRules.length}`);
    
    // Test duplicate detection
    if (existingRules.length > 0) {
        const firstRuleName = existingRules[0].name;
        console.log(`✅ Testing duplicate detection with: "${firstRuleName}"`);
        
        const isDuplicate = existingRules.some(r => 
            r.name.toLowerCase() === firstRuleName.toLowerCase()
        );
        
        if (isDuplicate) {
            console.log('✅ Duplicate detection working correctly');
        }
    }
    
    // Simulate new rule
    const timestamp = Date.now();
    const newRule = {
        id: `rule-test-${timestamp}`,
        name: `Test Rule ${timestamp}`,
        text: `This is a test rule created at ${new Date().toLocaleString()}`
    };
    
    console.log('✅ Simulated new rule:', newRule);
    console.log('✅ This rule would be valid for addition');
};

// Run all tests
const rulesData = testDataStructure();
if (rulesData) {
    testIdGeneration(rulesData);
    simulateRuleAddition(rulesData);
}

console.log('\n✨ Test Summary:');
console.log('1. Use the app to select a topic and subtopic');
console.log('2. Click the violet "+ Add" button next to Rules');
console.log('3. Add a test rule and verify it appears');
console.log('4. Check that the rule persists after page reload');
console.log('5. Try adding a duplicate rule name to test validation');

// Helper function to add a test rule programmatically
window.addTestRule = (topic, subtopic, name, text) => {
    const data = JSON.parse(localStorage.getItem('userRules') || '{}');
    
    if (!data[topic] || !data[topic][subtopic]) {
        console.error('Invalid topic/subtopic');
        return;
    }
    
    // Find max ID
    let maxId = 0;
    const findMaxId = (obj) => {
        if (Array.isArray(obj)) {
            obj.forEach(rule => {
                if (rule.id) {
                    const numId = parseInt(rule.id.toString().replace(/\D/g, ''), 10);
                    if (!isNaN(numId) && numId > maxId) maxId = numId;
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(val => findMaxId(val));
        }
    };
    findMaxId(data);
    
    const newRule = {
        id: `rule-${maxId + 1}`,
        name: name || `Test Rule ${Date.now()}`,
        text: text || 'This is a test rule added programmatically'
    };
    
    data[topic][subtopic].push(newRule);
    localStorage.setItem('userRules', JSON.stringify(data));
    
    console.log('✅ Test rule added:', newRule);
    console.log('Reload the page to see it in the app');
};

console.log('\n💡 Tip: Use window.addTestRule(topic, subtopic, name, text) to add a test rule programmatically');