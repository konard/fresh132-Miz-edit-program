/**
 * Script to create a sample .miz file for testing
 * Run with: node create-sample-miz.js
 */

const fs = require('fs');
const path = require('path');

// We'll use a simple ZIP library approach
// First, let's create the required Lua content

const missionContent = `mission =
{
    ["sortie"] = "Sample Training Mission",
    ["descriptionText"] = "This is a sample DCS World mission created for testing the Miz Editor application. The mission demonstrates text extraction capabilities.",
    ["descriptionBlueTask"] = "Blue coalition objective: Complete all training exercises and return to base safely.",
    ["descriptionRedTask"] = "Red coalition objective: Defend assigned airspace from enemy incursions.",
    ["descriptionNeutralsTask"] = "Neutral forces: Observe and report only.",
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
                    ["plane"] =
                    {
                        ["group"] =
                        {
                            [1] =
                            {
                                ["name"] = "Eagle Flight",
                                ["task"] = "CAP",
                                ["units"] =
                                {
                                    [1] =
                                    {
                                        ["name"] = "Eagle 1-1",
                                        ["type"] = "F-15C",
                                    },
                                    [2] =
                                    {
                                        ["name"] = "Eagle 1-2",
                                        ["type"] = "F-15C",
                                    },
                                },
                                ["route"] =
                                {
                                    ["points"] =
                                    {
                                        [1] =
                                        {
                                            ["name"] = "Takeoff",
                                            ["comment"] = "Depart runway 27",
                                            ["type"] = "TakeOff",
                                        },
                                        [2] =
                                        {
                                            ["name"] = "CAP Station Alpha",
                                            ["comment"] = "Begin combat air patrol",
                                            ["type"] = "Turning Point",
                                        },
                                        [3] =
                                        {
                                            ["name"] = "RTB",
                                            ["comment"] = "Return to base",
                                            ["type"] = "Land",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    ["helicopter"] =
                    {
                        ["group"] =
                        {
                            [1] =
                            {
                                ["name"] = "Rescue Hawk",
                                ["task"] = "Transport",
                                ["units"] =
                                {
                                    [1] =
                                    {
                                        ["name"] = "Rescue 1",
                                        ["type"] = "UH-60A",
                                    },
                                },
                                ["route"] =
                                {
                                    ["points"] =
                                    {
                                        [1] =
                                        {
                                            ["name"] = "FARP Delta",
                                            ["comment"] = "Staging area",
                                            ["type"] = "TakeOffParking",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        ["red"] =
        {
            ["name"] = "red",
            ["country"] =
            {
                [1] =
                {
                    ["name"] = "Russia",
                    ["id"] = 0,
                    ["plane"] =
                    {
                        ["group"] =
                        {
                            [1] =
                            {
                                ["name"] = "Bear Squadron",
                                ["task"] = "Intercept",
                                ["units"] =
                                {
                                    [1] =
                                    {
                                        ["name"] = "Bear 1",
                                        ["type"] = "Su-27",
                                    },
                                    [2] =
                                    {
                                        ["name"] = "Bear 2",
                                        ["type"] = "Su-27",
                                    },
                                },
                                ["route"] =
                                {
                                    ["points"] =
                                    {
                                        [1] =
                                        {
                                            ["name"] = "Alert 5",
                                            ["comment"] = "Ready for scramble",
                                            ["type"] = "TakeOffParking",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    ["trigrules"] =
    {
        [1] =
        {
            ["comment"] = "Mission Start Message",
            ["actions"] =
            {
                [1] =
                {
                    ["text"] = "DictKey_MissionStart",
                },
            },
        },
        [2] =
        {
            ["comment"] = "Objective Complete",
            ["actions"] =
            {
                [1] =
                {
                    ["text"] = "DictKey_ObjectiveComplete",
                },
            },
        },
        [3] =
        {
            ["comment"] = "Warning Message",
            ["actions"] =
            {
                [1] =
                {
                    ["text"] = "DictKey_Warning",
                },
            },
        },
    },
}
`;

const dictionaryDefaultContent = `dictionary =
{
    ["DictKey_MissionStart"] = "Welcome to the training mission. All pilots report to your assigned aircraft.",
    ["DictKey_ObjectiveComplete"] = "Excellent work! All objectives have been completed. Return to base.",
    ["DictKey_Warning"] = "Warning: Enemy aircraft detected. All fighters scramble immediately.",
    ["DictKey_Briefing1"] = "Today's mission involves coordinated air operations over the exercise area.",
    ["DictKey_Briefing2"] = "Weather conditions are favorable with clear skies and minimal wind.",
    ["DictKey_RadioCall1"] = "Overlord, Eagle Flight checking in, on station at Angels 25.",
    ["DictKey_RadioCall2"] = "Eagle Flight, Overlord, copy. Maintain CAP pattern and await further instructions.",
}
`;

const dictionaryRuContent = `dictionary =
{
    ["DictKey_MissionStart"] = "Добро пожаловать на тренировочную миссию. Все пилоты, доложите о готовности.",
    ["DictKey_ObjectiveComplete"] = "Отличная работа! Все цели выполнены. Возвращайтесь на базу.",
    ["DictKey_Warning"] = "Внимание: Обнаружены вражеские самолёты. Всем истребителям - немедленный взлёт.",
    ["DictKey_Briefing1"] = "Сегодняшняя миссия включает координированные воздушные операции над учебным районом.",
    ["DictKey_Briefing2"] = "Погодные условия благоприятные: ясное небо и минимальный ветер.",
    ["DictKey_RadioCall1"] = "Оверлорд, Игл Флайт на связи, на позиции на высоте 25.",
    ["DictKey_RadioCall2"] = "Игл Флайт, Оверлорд, принял. Продолжайте патрулирование и ожидайте дальнейших указаний.",
}
`;

const optionsContent = `options =
{
    ["difficulty"] =
    {
        ["fuel"] = false,
        ["labels"] = 0,
    },
}
`;

// Write the content files
const outputDir = path.join(__dirname);

console.log('Creating sample mission files...');
console.log('Output directory:', outputDir);

// Write individual files for reference
fs.writeFileSync(path.join(outputDir, 'mission.lua'), missionContent);
fs.writeFileSync(path.join(outputDir, 'dictionary_DEFAULT.lua'), dictionaryDefaultContent);
fs.writeFileSync(path.join(outputDir, 'dictionary_RU.lua'), dictionaryRuContent);
fs.writeFileSync(path.join(outputDir, 'options.lua'), optionsContent);

console.log('Sample mission files created:');
console.log('  - mission.lua');
console.log('  - dictionary_DEFAULT.lua');
console.log('  - dictionary_RU.lua');
console.log('  - options.lua');
console.log('');
console.log('To create a .miz file, use the web interface with JSZip or run:');
console.log('  node create-miz-archive.js');
