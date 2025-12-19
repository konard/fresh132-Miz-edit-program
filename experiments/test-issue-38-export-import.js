/**
 * Test script to reproduce issue #38
 * Export/Import issues: string positioning and locale display
 */

const fs = require('fs');
const path = require('path');
const MizParser = require('../src/miz-parser.js');

async function testExportImport() {
    console.log('=== Testing Issue #38: Export/Import Problems ===\n');

    // Find a sample .miz file
    const sampleFiles = [
        './experiments/test_mission_with_radio.miz',
        './experiments/outputs/test_issue_18.miz'
    ];

    let mizPath = null;
    for (const file of sampleFiles) {
        if (fs.existsSync(file)) {
            mizPath = file;
            break;
        }
    }

    if (!mizPath) {
        console.log('No sample .miz file found, creating a simple test case...');
        return;
    }

    console.log(`Using sample file: ${mizPath}\n`);

    // Step 1: Parse the .miz file
    console.log('Step 1: Parsing .miz file...');
    const mizBuffer = fs.readFileSync(mizPath);
    const parsedData = await MizParser.parse(mizBuffer);

    console.log('Available locales:', parsedData.availableLocales);
    console.log('\n');

    // Step 2: Extract text for DEFAULT locale
    console.log('Step 2: Extracting text for DEFAULT locale...');
    const extractionDefault = MizParser.extractText(parsedData, {
        mode: 'auto',
        preferredLocale: 'DEFAULT'
    });

    const defaultText = MizParser.formatAsText(extractionDefault);
    console.log('DEFAULT extraction:');
    console.log(defaultText.substring(0, 500));
    console.log('...\n');

    // Save DEFAULT extraction
    const defaultOutputPath = './experiments/outputs/issue-38-default-export.txt';
    fs.mkdirSync(path.dirname(defaultOutputPath), { recursive: true });
    fs.writeFileSync(defaultOutputPath, defaultText);
    console.log(`Saved DEFAULT extraction to: ${defaultOutputPath}\n`);

    // Step 3: Extract text for RU locale (if available)
    if (parsedData.availableLocales.includes('RU')) {
        console.log('Step 3: Extracting text for RU locale...');
        const extractionRu = MizParser.extractText(parsedData, {
            mode: 'auto',
            preferredLocale: 'RU'
        });

        const ruText = MizParser.formatAsText(extractionRu);
        console.log('RU extraction:');
        console.log(ruText.substring(0, 500));
        console.log('...\n');

        // Save RU extraction
        const ruOutputPath = './experiments/outputs/issue-38-ru-export.txt';
        fs.writeFileSync(ruOutputPath, ruText);
        console.log(`Saved RU extraction to: ${ruOutputPath}\n`);

        // Compare DEFAULT and RU exports
        console.log('Step 4: Comparing DEFAULT and RU exports...');
        const defaultLines = defaultText.split('\n').filter(l => l.trim());
        const ruLines = ruText.split('\n').filter(l => l.trim());

        console.log(`DEFAULT lines: ${defaultLines.length}`);
        console.log(`RU lines: ${ruLines.length}`);

        // Check if line order matches
        let orderMismatch = false;
        for (let i = 0; i < Math.min(10, defaultLines.length, ruLines.length); i++) {
            const defaultPrefix = defaultLines[i].split(':')[0].trim();
            const ruPrefix = ruLines[i].split(':')[0].trim();
            if (defaultPrefix !== ruPrefix) {
                console.log(`Line ${i} prefix mismatch:`);
                console.log(`  DEFAULT: ${defaultPrefix}`);
                console.log(`  RU: ${ruPrefix}`);
                orderMismatch = true;
            }
        }

        if (!orderMismatch) {
            console.log('✓ Line order matches between DEFAULT and RU\n');
        } else {
            console.log('✗ Line order MISMATCH detected between DEFAULT and RU\n');
        }
    } else {
        console.log('Step 3: No RU locale available in this .miz file\n');
    }

    // Step 5: Test import scenario
    console.log('Step 5: Testing import scenario...');

    // Create a modified version of the exported text
    const modifiedText = defaultText.replace(/Test/, 'Modified Test');

    // Import back to RU locale
    console.log('Importing modified text to RU locale...');
    const importedMizBlob = await MizParser.importToMiz(
        mizBuffer,
        modifiedText,
        'RU',
        (percent, msg) => console.log(`  ${percent.toFixed(0)}% - ${msg}`)
    );

    // Save imported .miz
    const importedMizPath = './experiments/outputs/issue-38-imported.miz';
    const importedBuffer = Buffer.from(await importedMizBlob.arrayBuffer());
    fs.writeFileSync(importedMizPath, importedBuffer);
    console.log(`\nSaved imported .miz to: ${importedMizPath}\n`);

    // Step 6: Re-extract from imported .miz to verify
    console.log('Step 6: Re-extracting from imported .miz...');
    const importedParsed = await MizParser.parse(importedBuffer);

    console.log('Imported file available locales:', importedParsed.availableLocales);

    // Extract RU locale from imported file
    const extractionImported = MizParser.extractText(importedParsed, {
        mode: 'auto',
        preferredLocale: 'RU'
    });

    const importedText = MizParser.formatAsText(extractionImported);
    console.log('\nExtracted RU text from imported .miz:');
    console.log(importedText.substring(0, 500));
    console.log('...\n');

    // Save re-extracted text
    const reExtractedPath = './experiments/outputs/issue-38-re-extracted.txt';
    fs.writeFileSync(reExtractedPath, importedText);
    console.log(`Saved re-extracted text to: ${reExtractedPath}\n`);

    // Compare original and re-extracted
    console.log('Step 7: Comparing original and re-extracted text...');
    const originalLines = defaultText.split('\n').filter(l => l.trim());
    const reExtractedLines = importedText.split('\n').filter(l => l.trim());

    console.log(`Original lines: ${originalLines.length}`);
    console.log(`Re-extracted lines: ${reExtractedLines.length}`);

    // Check for differences
    let hasDifferences = false;
    for (let i = 0; i < Math.min(10, originalLines.length, reExtractedLines.length); i++) {
        if (originalLines[i].split(':')[0] !== reExtractedLines[i].split(':')[0]) {
            console.log(`Line ${i} differs:`);
            console.log(`  Original: ${originalLines[i].substring(0, 80)}`);
            console.log(`  Re-extracted: ${reExtractedLines[i].substring(0, 80)}`);
            hasDifferences = true;
        }
    }

    if (!hasDifferences) {
        console.log('✓ Export/Import cycle preserves text order\n');
    } else {
        console.log('✗ Export/Import cycle CHANGES text order\n');
    }

    console.log('=== Test Complete ===');
}

testExportImport().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
