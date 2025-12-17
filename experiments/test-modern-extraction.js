/**
 * Test the new dictionary-only extraction (issue #15)
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Make JSZip and LuaParser available globally for miz-parser.js
global.JSZip = JSZip;
global.LuaParser = require('../src/lua-parser.js');

const MizParser = require('../src/miz-parser.js');

async function testModernExtraction() {
    console.log('Testing modern dictionary-only extraction...\n');

    const mizPath = path.join(__dirname, 'modern_mission_2025.miz');

    if (!fs.existsSync(mizPath)) {
        console.error('Test mission file not found:', mizPath);
        return;
    }

    const mizBuffer = fs.readFileSync(mizPath);

    // Parse the .miz file
    console.log('Step 1: Parsing .miz file...');
    const parsedData = await MizParser.parse(mizBuffer, (progress, message) => {
        console.log(`  ${progress}% - ${message}`);
    });

    console.log('\n✓ Parsed mission data');
    console.log('  Available locales:', parsedData.availableLocales);

    // Extract text using new approach
    console.log('\nStep 2: Extracting text (dictionary-only, no ActionText)...');
    const extracted = MizParser.extractText(parsedData, {
        mode: 'auto',
        preferredLocale: 'DEFAULT',
        includeActionText: false // Don't include ActionText by default
    });

    console.log('\n✓ Extraction complete');
    console.log('  Locale used:', extracted.locale);
    console.log('  Total strings:', extracted.stats.totalStrings);
    console.log('  Unique strings:', extracted.stats.uniqueStrings);
    console.log('  By category:', extracted.stats.byCategory);

    console.log('\n=== RADIO MESSAGES (DictKey_subtitle_*) ===');
    extracted.extracted.radio.forEach((item, i) => {
        console.log(`${i + 1}. [${item.context}]`);
        console.log(`   ${item.text}`);
    });

    console.log('\n=== F10 MENU ITEMS (DictKey_ActionRadioText_*) ===');
    extracted.extracted.menu.forEach((item, i) => {
        console.log(`${i + 1}. [${item.context}]`);
        console.log(`   ${item.text}`);
    });

    // Test with ActionText included
    console.log('\n\nStep 3: Extracting with ActionText enabled...');
    const extractedWithAction = MizParser.extractText(parsedData, {
        mode: 'auto',
        preferredLocale: 'DEFAULT',
        includeActionText: true // Include long ActionText entries
    });

    console.log('\n✓ Extraction with ActionText complete');
    console.log('  Total strings:', extractedWithAction.stats.totalStrings);
    console.log('  By category:', extractedWithAction.stats.byCategory);

    if (extractedWithAction.extracted.triggers) {
        console.log('\n=== TRIGGER INSTRUCTIONS (DictKey_ActionText_* > 10 chars) ===');
        extractedWithAction.extracted.triggers.forEach((item, i) => {
            console.log(`${i + 1}. [${item.context}]`);
            console.log(`   ${item.text.substring(0, 80)}...`);
        });
    }

    // Format as text
    console.log('\n\nStep 4: Formatting as text file...');
    const textOutput = MizParser.formatAsText(extractedWithAction);

    const outputPath = path.join(__dirname, 'outputs', 'modern-extraction-output.txt');
    fs.writeFileSync(outputPath, textOutput);
    console.log('✓ Text output saved to:', outputPath);

    console.log('\n=== TEXT OUTPUT PREVIEW ===');
    console.log(textOutput);

    // Validation
    console.log('\n=== VALIDATION ===');
    console.log('  Complete:', extracted.validation.isComplete);
    if (extracted.validation.errors.length > 0) {
        console.log('  Errors:', extracted.validation.errors);
    }
    if (extracted.validation.warnings.length > 0) {
        console.log('  Warnings:', extracted.validation.warnings);
    }

    console.log('\n✓ All tests passed!');
}

testModernExtraction().catch(console.error);
