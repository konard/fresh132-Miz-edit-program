/**
 * Experiment: Test current extraction functionality
 * This script tests what the current implementation extracts
 */

const fs = require('fs');
const path = require('path');

// Make modules available as globals (like in browser)
const LuaParser = require('../src/lua-parser.js');
global.LuaParser = LuaParser;
global.JSZip = require('jszip');

const MizParser = require('../src/miz-parser.js');

async function testExtraction() {
    console.log('=== Testing Current Extraction Functionality ===\n');

    const mizPath = path.join(__dirname, '..', 'samples', 'sample_mission.miz');

    if (!fs.existsSync(mizPath)) {
        console.error('Sample .miz file not found. Run: node samples/create-miz-archive.js');
        process.exit(1);
    }

    console.log('Loading .miz file:', mizPath);
    const mizBuffer = fs.readFileSync(mizPath);

    // Parse the .miz file
    const parsedData = await MizParser.parse(mizBuffer, (percent, msg) => {
        console.log(`[${percent}%] ${msg}`);
    });

    console.log('\n=== Parsed Data Info ===');
    console.log('Available locales:', parsedData.availableLocales);
    console.log('Has mission data:', !!parsedData.mission);
    console.log('Mission keys:', parsedData.mission ? Object.keys(parsedData.mission) : []);
    console.log('Has trigrules:', !!parsedData.mission?.trigrules);

    // Test AUTO mode extraction
    console.log('\n=== AUTO MODE EXTRACTION ===');
    const autoResult = MizParser.extractText(parsedData, { mode: 'auto' });

    console.log('Locale used:', autoResult.locale);
    console.log('Categories extracted:', Object.keys(autoResult.extracted));
    console.log('Stats:', autoResult.stats);
    console.log('\n=== VALIDATION ===');
    console.log('Is Complete:', autoResult.validation.isComplete);
    console.log('Errors:', autoResult.validation.errors);
    console.log('Warnings:', autoResult.validation.warnings);

    for (const [category, items] of Object.entries(autoResult.extracted)) {
        console.log(`\n--- ${category.toUpperCase()} (${items.length} items) ---`);
        items.forEach((item, index) => {
            console.log(`  ${index + 1}. [${item.context}] ${item.text}`);
        });
    }

    // Format as text
    console.log('\n=== TEXT OUTPUT FORMAT ===');
    const textOutput = MizParser.formatAsText(autoResult);
    console.log(textOutput);

    // Save outputs for analysis
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, 'current-extraction.txt'),
        textOutput
    );

    fs.writeFileSync(
        path.join(outputDir, 'current-extraction.json'),
        MizParser.formatAsJson(autoResult)
    );

    console.log('\n=== OUTPUT FILES CREATED ===');
    console.log('  - experiments/outputs/current-extraction.txt');
    console.log('  - experiments/outputs/current-extraction.json');
}

testExtraction().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
