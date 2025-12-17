/**
 * Create a test mission with modern 2023-2025 style dictionary
 * Uses ONLY DictKey_subtitle_* and DictKey_ActionRadioText_* keys
 * Per issue #15 requirements
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createModernMission() {
    console.log('Creating modern mission with dictionary-based localization...\n');

    const zip = new JSZip();

    // Create a minimal mission file (no DictKeys in mission file itself)
    const missionContent = `mission =
{
    ["sortie"] = "Modern Training Mission 2025",
    ["descriptionText"] = "This mission demonstrates the modern approach to DCS localization using dictionary.lua",
    ["descriptionBlueTask"] = "Blue forces: Complete training objectives.",
    ["coalition"] =
    {
        ["blue"] =
        {
            ["name"] = "blue",
            ["country"] =
            {
                [1] =
                {
                    ["name"] = "USA",
                    ["id"] = 2,
                }
            }
        }
    },
    ["trigrules"] =
    {
        [1] =
        {
            ["comment"] = "Mission Start",
            ["actions"] =
            {
                [1] =
                {
                    ["id"] = "MessageToAll",
                }
            }
        }
    }
}
`;

    // Create DEFAULT dictionary with MODERN format
    // Per issue #15: ALL player-visible text is in dictionary.lua
    const dictionaryContent = `dictionary =
{
    -- Radio messages and subtitles (top-left radio panel + subtitles)
    ["DictKey_subtitle_1"] = "PLAYER: FL070, Sword 2-1.",
    ["DictKey_subtitle_2"] = "POPEYE: Ok Sword 2-1 we're cleared in hot. Target is the SA-6 site, 2 o'clock, 8 miles.",
    ["DictKey_subtitle_3"] = "Contact RAPCON Arrival on button 4.",
    ["DictKey_subtitle_4"] = "AWACS: Sword 2-1, picture clean. You are cleared to engage.",
    ["DictKey_subtitle_5"] = "PLAYER: Copy, engaging now.",
    ["DictKey_subtitle_welcome"] = "Welcome to the training mission. All pilots report to your assigned aircraft.",
    ["DictKey_subtitle_complete"] = "Excellent work! Mission complete. RTB for debrief.",

    -- F10 Menu items (radio menu on the right)
    ["DictKey_ActionRadioText_RequestTanker"] = "Request Tanker",
    ["DictKey_ActionRadioText_RequestAWACS"] = "Request AWACS Support",
    ["DictKey_ActionRadioText_ReportStatus"] = "Report Mission Status",
    ["DictKey_ActionRadioText_AbortMission"] = "Abort Mission",
    ["DictKey_ActionRadioText_WeatherUpdate"] = "Request Weather Update",

    -- Optional: Long trigger instructions (shown in trigger messages)
    ["DictKey_ActionText_Briefing"] = "Your mission is to destroy the enemy SAM site located at grid 38T FL 12345 67890. Approach from the west to avoid radar detection. Use AGM-88 HARM missiles for initial suppression, then follow up with precision-guided munitions.",
    ["DictKey_ActionText_Warning"] = "Warning: Multiple hostile aircraft detected in your vicinity. Recommend immediate evasive action and weapon release authorization.",
    ["DictKey_ActionText_Navigation"] = "Proceed to waypoint ALPHA, then turn to heading 270 and maintain altitude 15000 feet.",

    -- Short ActionText (should be ignored per requirements - length <= 10)
    ["DictKey_ActionText_Short"] = "Roger",
}
`;

    // Add files to the archive
    zip.file('mission', missionContent);
    zip.file('l10n/DEFAULT/dictionary', dictionaryContent);

    // Generate the .miz file
    const mizBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    const outputPath = path.join(__dirname, 'modern_mission_2025.miz');
    fs.writeFileSync(outputPath, mizBuffer);

    console.log('✓ Created modern mission file:', outputPath);
    console.log('\nDictionary contains:');
    console.log('  - 7 subtitle entries (DictKey_subtitle_*)');
    console.log('  - 5 F10 menu entries (DictKey_ActionRadioText_*)');
    console.log('  - 3 long ActionText entries (>10 chars)');
    console.log('  - 1 short ActionText entry (should be ignored)\n');
}

createModernMission().catch(console.error);
