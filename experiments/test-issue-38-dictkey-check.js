/**
 * Test script to check if DictKeys are preserved during export
 */

const fs = require('fs');
const MizParser = require('../src/miz-parser.js');
const LuaParser = require('../src/lua-parser.js');

async function testDictKeyPreservation() {
    console.log('=== Testing DictKey Preservation ===\n');

    const mizPath = './experiments/test_mission_with_radio.miz';
    console.log(`Using file: ${mizPath}\n`);

    // Parse the .miz file
    const mizBuffer = fs.readFileSync(mizPath);
    const parsedData = await MizParser.parse(mizBuffer);

    console.log('Available locales:', parsedData.availableLocales);
    console.log('\n=== DEFAULT Dictionary Keys ===');

    const defaultDict = parsedData.dictionaries['DEFAULT'];
    if (defaultDict) {
        const keys = Object.keys(defaultDict);
        console.log(`Total keys: ${keys.length}`);
        console.log('\nSample keys:');
        keys.slice(0, 10).forEach(key => {
            const value = defaultDict[key];
            const preview = value ? value.substring(0, 50) : '[empty]';
            console.log(`  ${key}: ${preview}`);
        });
    }

    console.log('\n=== RU Dictionary Keys ===');
    const ruDict = parsedData.dictionaries['RU'];
    if (ruDict) {
        const keys = Object.keys(ruDict);
        console.log(`Total keys: ${keys.length}`);
        console.log('\nSample keys:');
        keys.slice(0, 10).forEach(key => {
            const value = ruDict[key];
            const preview = value ? value.substring(0, 50) : '[empty]';
            console.log(`  ${key}: ${preview}`);
        });
    }

    // Extract text for DEFAULT
    console.log('\n=== Extracting DEFAULT ===');
    const extractionDefault = MizParser.extractText(parsedData, {
        mode: 'auto',
        preferredLocale: 'DEFAULT'
    });

    console.log('\nExtracted items:');
    console.log('Briefings:', extractionDefault.extracted.briefings?.length || 0);
    extractionDefault.extracted.briefings?.slice(0, 3).forEach(item => {
        console.log(`  context: ${item.context}, text: ${item.text.substring(0, 50)}`);
    });

    console.log('Triggers:', extractionDefault.extracted.triggers?.length || 0);
    extractionDefault.extracted.triggers?.slice(0, 3).forEach(item => {
        console.log(`  context: ${item.context}, text: ${item.text.substring(0, 50)}`);
    });

    console.log('Radio:', extractionDefault.extracted.radio?.length || 0);
    extractionDefault.extracted.radio?.slice(0, 3).forEach(item => {
        console.log(`  context: ${item.context}, text: ${item.text.substring(0, 50)}`);
    });

    // Format as text and check if DictKeys are preserved
    console.log('\n=== Checking Export Format ===');
    const exportedText = MizParser.formatAsText(extractionDefault);
    const lines = exportedText.split('\n').filter(l => l.trim() && !l.includes('BRIEFING') && !l.includes('TRIGGERS') && !l.includes('RADIO'));

    console.log('\nFirst 10 exported lines:');
    lines.slice(0, 10).forEach(line => {
        const prefix = line.split(':')[0];
        console.log(`  Prefix: "${prefix}"`);
    });

    // Check if any DictKey_ prefixes are used
    const hasDictKeys = lines.some(line => line.startsWith('DictKey_'));
    console.log(`\n✓ Export uses DictKey_ prefixes: ${hasDictKeys}`);

    if (!hasDictKeys) {
        console.log('\n⚠️  ISSUE FOUND: Export does NOT preserve DictKey prefixes!');
        console.log('This means that during import, the exact key mapping will be lost.');
        console.log('\nExpected format: DictKey_ActionText_1234: text');
        console.log('Actual format:   Briefing_Mission: text');
    }

    console.log('\n=== Test Complete ===');
}

testDictKeyPreservation().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
