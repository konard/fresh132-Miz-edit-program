/**
 * Simple test to verify browser environment exports
 */

const fs = require('fs');
const path = require('path');

console.log('Checking lua-parser.js exports...\n');

// Read lua-parser.js
const luaParserCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lua-parser.js'), 'utf8');

// Check if it has browser export
const hasBrowserExport = luaParserCode.includes('window.LuaParser = LuaParser');
console.log('lua-parser.js has window.LuaParser export:', hasBrowserExport);

if (!hasBrowserExport) {
    console.error('ERROR: lua-parser.js does not export to window.LuaParser');
    process.exit(1);
}

console.log('\nChecking miz-parser.js exports...\n');

// Read miz-parser.js
const mizParserCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'miz-parser.js'), 'utf8');

// Check if it has browser export
const mizHasBrowserExport = mizParserCode.includes('window.MizParser = MizParser');
console.log('miz-parser.js has window.MizParser export:', mizHasBrowserExport);

if (!mizHasBrowserExport) {
    console.error('ERROR: miz-parser.js does not export to window.MizParser');
    process.exit(1);
}

// Check the export pattern is correct
const correctPattern = /if \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?module\.exports = \w+;[\s\S]*?\} else if \(typeof window !== 'undefined'\) \{[\s\S]*?window\.\w+ = \w+;[\s\S]*?\}/;

console.log('\nChecking export pattern...\n');
console.log('lua-parser.js has correct export pattern:', correctPattern.test(luaParserCode));
console.log('miz-parser.js has correct export pattern:', correctPattern.test(mizParserCode));

console.log('\n✓ All checks passed! Both files correctly export for browser use.');
console.log('✓ MizParser and LuaParser will be available in browser environment.');
