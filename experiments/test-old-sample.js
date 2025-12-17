/**
 * Test extraction with the old sample mission
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Make JSZip and LuaParser available globally for miz-parser.js
global.JSZip = JSZip;
global.LuaParser = require('../src/lua-parser.js');

const MizParser = require('../src/miz-parser.js');

async function testOldSample() {
    console.log('Testing with old sample mission...\n');

    const mizPath = path.join(__dirname, '..', 'samples', 'sample_mission.miz');

    if (!fs.existsSync(mizPath)) {
        console.error('Sample mission file not found:', mizPath);
        return;
    }

    const mizBuffer = fs.readFileSync(mizPath);

    // Parse the .miz file
    console.log('Step 1: Parsing .miz file...');
    const parsedData = await MizParser.parse(mizBuffer);

    console.log('\n✓ Parsed mission data');
    console.log('  Available locales:', parsedData.availableLocales);

    // Extract text using NEW dictionary-only approach
    console.log('\nStep 2: Extracting text (NEW dictionary-only approach)...');
    const extracted = MizParser.extractText(parsedData, {
        mode: 'auto',
        preferredLocale: 'DEFAULT',
        includeActionText: true // Include briefings as well
    });

    console.log('\n✓ Extraction complete');
    console.log('  Total strings:', extracted.stats.totalStrings);
    console.log('  By category:', extracted.stats.byCategory);

    console.log('\n=== RADIO MESSAGES ===');
    extracted.extracted.radio.forEach((item, i) => {
        console.log(`${i + 1}. [${item.context}] ${item.text}`);
    });

    if (extracted.extracted.triggers && extracted.extracted.triggers.length > 0) {
        console.log('\n=== TRIGGERS/BRIEFINGS ===');
        extracted.extracted.triggers.forEach((item, i) => {
            console.log(`${i + 1}. [${item.context}] ${item.text}`);
        });
    }

    if (extracted.extracted.menu && extracted.extracted.menu.length > 0) {
        console.log('\n=== MENU ITEMS ===');
        extracted.extracted.menu.forEach((item, i) => {
            console.log(`${i + 1}. [${item.context}] ${item.text}`);
        });
    }

    // Format as text
    console.log('\n\nStep 3: Formatting as text file...');
    const textOutput = MizParser.formatAsText(extracted);

    console.log('\n=== TEXT OUTPUT ===');
    console.log(textOutput);

    console.log('\n✓ Test complete!');
}

testOldSample().catch(console.error);
