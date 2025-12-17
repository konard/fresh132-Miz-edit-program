/**
 * MIZ File Parser for DCS World mission files
 * Handles .miz file extraction and parsing
 */

const MizParser = {
    /**
     * Categories of extractable text
     */
    CATEGORIES: {
        briefings: {
            name: 'Mission Briefings',
            keys: ['descriptionText', 'descriptionBlueTask', 'descriptionRedTask', 'descriptionNeutralsTask', 'sortie']
        },
        tasks: {
            name: 'Task Descriptions',
            keys: ['task', 'taskDescription']
        },
        triggers: {
            name: 'Trigger Messages',
            patterns: ['message', 'text', 'comment']
        },
        units: {
            name: 'Unit Names',
            keys: ['name']
        },
        waypoints: {
            name: 'Waypoints',
            keys: ['name', 'comment']
        },
        radio: {
            name: 'Radio Messages',
            keys: ['radioText', 'message']
        }
    },

    /**
     * Parse a .miz file and extract its contents
     * @param {File|ArrayBuffer} file - The .miz file to parse
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise<object>} Parsed mission data
     */
    parse: async function(file, progressCallback = () => {}) {
        progressCallback(5, 'Loading .miz file...');

        let zip;
        try {
            zip = await JSZip.loadAsync(file);
        } catch (e) {
            throw new Error('Invalid .miz file: Unable to read as ZIP archive');
        }

        progressCallback(20, 'Extracting mission data...');

        const result = {
            mission: null,
            dictionaries: {},
            availableLocales: [],
            rawStrings: []
        };

        // List all files in the archive
        const fileNames = Object.keys(zip.files);

        // Find and parse the mission file
        const missionFile = zip.file('mission');
        if (missionFile) {
            progressCallback(30, 'Parsing mission file...');
            const missionContent = await missionFile.async('string');
            result.mission = LuaParser.parse(missionContent);
        } else {
            throw new Error('Invalid .miz file: No mission file found');
        }

        // Find and parse dictionary files
        progressCallback(50, 'Extracting localization data...');

        // Check for l10n folder
        const l10nPattern = /^l10n\/([^/]+)\/dictionary$/;
        for (const fileName of fileNames) {
            const match = fileName.match(l10nPattern);
            if (match) {
                const locale = match[1];
                result.availableLocales.push(locale);

                const dictFile = zip.file(fileName);
                if (dictFile) {
                    const dictContent = await dictFile.async('string');
                    result.dictionaries[locale] = LuaParser.parse(dictContent);
                }
            }

            // Also check for .lua extension
            const luaMatch = fileName.match(/^l10n\/([^/]+)\/dictionary\.lua$/);
            if (luaMatch) {
                const locale = luaMatch[1];
                if (!result.availableLocales.includes(locale)) {
                    result.availableLocales.push(locale);
                }

                const dictFile = zip.file(fileName);
                if (dictFile) {
                    const dictContent = await dictFile.async('string');
                    result.dictionaries[locale] = LuaParser.parse(dictContent);
                }
            }
        }

        progressCallback(70, 'Processing extracted data...');

        return result;
    },

    /**
     * Extract localizable text from parsed mission data
     * @param {object} parsedData - Data from parse()
     * @param {object} options - Extraction options
     * @returns {object} Extracted text organized by category
     */
    extractText: function(parsedData, options = {}) {
        const {
            mode = 'auto',
            categories = Object.keys(this.CATEGORIES),
            preferredLocale = 'DEFAULT'
        } = options;

        const result = {
            locale: preferredLocale,
            extracted: {},
            stats: {
                totalStrings: 0,
                uniqueStrings: 0,
                byCategory: {}
            }
        };

        // Select the dictionary to use
        let dictionary = parsedData.dictionaries[preferredLocale];
        if (!dictionary && preferredLocale !== 'DEFAULT') {
            dictionary = parsedData.dictionaries['DEFAULT'];
            result.locale = 'DEFAULT';
        }
        if (!dictionary) {
            // Use first available dictionary
            const firstLocale = parsedData.availableLocales[0];
            if (firstLocale) {
                dictionary = parsedData.dictionaries[firstLocale];
                result.locale = firstLocale;
            }
        }

        // Extract text by category
        if (mode === 'auto' || categories.includes('briefings')) {
            result.extracted.briefings = this.extractBriefings(parsedData.mission, dictionary);
            result.stats.byCategory.briefings = result.extracted.briefings.length;
        }

        if (mode === 'auto' || categories.includes('tasks')) {
            result.extracted.tasks = this.extractTasks(parsedData.mission, dictionary);
            result.stats.byCategory.tasks = result.extracted.tasks.length;
        }

        if (mode === 'auto' || categories.includes('triggers')) {
            result.extracted.triggers = this.extractTriggers(parsedData.mission, dictionary);
            result.stats.byCategory.triggers = result.extracted.triggers.length;
        }

        if (mode === 'auto' || categories.includes('units')) {
            result.extracted.units = this.extractUnits(parsedData.mission, dictionary);
            result.stats.byCategory.units = result.extracted.units.length;
        }

        if (mode === 'auto' || categories.includes('waypoints')) {
            result.extracted.waypoints = this.extractWaypoints(parsedData.mission, dictionary);
            result.stats.byCategory.waypoints = result.extracted.waypoints.length;
        }

        if (mode === 'auto' || categories.includes('radio')) {
            result.extracted.radio = this.extractRadioMessages(parsedData.mission, dictionary);
            result.stats.byCategory.radio = result.extracted.radio.length;
        }

        // Calculate totals
        const allStrings = [];
        for (const category of Object.keys(result.extracted)) {
            allStrings.push(...result.extracted[category]);
        }
        result.stats.totalStrings = allStrings.length;
        result.stats.uniqueStrings = new Set(allStrings.map(s => s.text)).size;

        return result;
    },

    /**
     * Resolve a DictKey reference to actual text
     */
    resolveText: function(value, dictionary) {
        if (!value) return null;

        // Check if it's a DictKey reference
        if (typeof value === 'string') {
            if (value.startsWith('DictKey_')) {
                if (dictionary && dictionary[value]) {
                    return this.cleanText(dictionary[value]);
                }
                return null;
            }
            return this.cleanText(value);
        }

        return null;
    },

    /**
     * Clean and trim text
     */
    cleanText: function(text) {
        if (!text || typeof text !== 'string') return null;

        // Trim whitespace
        text = text.trim();

        // Remove empty strings
        if (!text) return null;

        // Remove Lua artifacts (quotes at start/end that might have been escaped)
        text = text.replace(/^["']|["']$/g, '');

        // Unescape common Lua escape sequences
        text = text.replace(/\\n/g, '\n');
        text = text.replace(/\\t/g, '\t');
        text = text.replace(/\\"/g, '"');
        text = text.replace(/\\'/g, "'");
        text = text.replace(/\\\\/g, '\\');

        return text.trim() || null;
    },

    /**
     * Extract briefing texts
     */
    extractBriefings: function(mission, dictionary) {
        const results = [];

        if (!mission) return results;

        const briefingKeys = ['sortie', 'descriptionText', 'descriptionBlueTask', 'descriptionRedTask', 'descriptionNeutralsTask'];

        for (const key of briefingKeys) {
            if (mission[key]) {
                const text = this.resolveText(mission[key], dictionary);
                if (text) {
                    results.push({
                        category: 'Briefing',
                        context: this.formatContextName(key),
                        text: text
                    });
                }
            }
        }

        return results;
    },

    /**
     * Extract task descriptions
     */
    extractTasks: function(mission, dictionary) {
        const results = [];

        if (!mission) return results;

        // Search for tasks in coalition data
        const coalitions = ['blue', 'red', 'neutrals'];

        for (const coalition of coalitions) {
            const coalitionData = mission.coalition?.[coalition];
            if (!coalitionData) continue;

            // Look through countries and groups
            this.traverseGroups(coalitionData, (group, path) => {
                if (group.task) {
                    const text = this.resolveText(group.task, dictionary);
                    if (text) {
                        results.push({
                            category: 'Task',
                            context: `${coalition}/${path}`,
                            text: text
                        });
                    }
                }
            });
        }

        return results;
    },

    /**
     * Extract trigger messages
     */
    extractTriggers: function(mission, dictionary) {
        const results = [];

        if (!mission?.trigrules) return results;

        const trigrules = mission.trigrules;

        // Trigrules can be an object with numeric keys
        const rules = Array.isArray(trigrules) ? trigrules : Object.values(trigrules);

        for (const rule of rules) {
            if (!rule || typeof rule !== 'object') continue;

            // Check for message actions
            if (rule.actions) {
                const actions = Array.isArray(rule.actions) ? rule.actions : Object.values(rule.actions);
                for (const action of actions) {
                    if (!action) continue;

                    // Look for text/message properties
                    for (const key of ['text', 'message', 'comment', 'file']) {
                        if (action[key]) {
                            const text = this.resolveText(action[key], dictionary);
                            if (text) {
                                results.push({
                                    category: 'Trigger',
                                    context: rule.comment || 'Trigger Message',
                                    text: text
                                });
                            }
                        }
                    }
                }
            }

            // Check rule comment itself
            if (rule.comment) {
                const text = this.resolveText(rule.comment, dictionary);
                if (text && text.length > 2) { // Skip very short comments
                    results.push({
                        category: 'Trigger',
                        context: 'Rule Comment',
                        text: text
                    });
                }
            }
        }

        return results;
    },

    /**
     * Extract unit names
     */
    extractUnits: function(mission, dictionary) {
        const results = [];
        const seenNames = new Set();

        if (!mission) return results;

        const coalitions = ['blue', 'red', 'neutrals'];

        for (const coalition of coalitions) {
            const coalitionData = mission.coalition?.[coalition];
            if (!coalitionData) continue;

            this.traverseUnits(coalitionData, (unit, path) => {
                if (unit.name) {
                    const text = this.resolveText(unit.name, dictionary);
                    if (text && !seenNames.has(text)) {
                        seenNames.add(text);
                        results.push({
                            category: 'Unit',
                            context: `${coalition}/${path}`,
                            text: text
                        });
                    }
                }
            });
        }

        return results;
    },

    /**
     * Extract waypoint information
     */
    extractWaypoints: function(mission, dictionary) {
        const results = [];

        if (!mission) return results;

        const coalitions = ['blue', 'red', 'neutrals'];

        for (const coalition of coalitions) {
            const coalitionData = mission.coalition?.[coalition];
            if (!coalitionData) continue;

            this.traverseGroups(coalitionData, (group, path) => {
                if (group.route?.points) {
                    const points = Array.isArray(group.route.points)
                        ? group.route.points
                        : Object.values(group.route.points);

                    points.forEach((point, index) => {
                        if (!point) return;

                        if (point.name) {
                            const text = this.resolveText(point.name, dictionary);
                            if (text) {
                                results.push({
                                    category: 'Waypoint',
                                    context: `${path}/WP${index + 1}`,
                                    text: text
                                });
                            }
                        }

                        if (point.comment) {
                            const text = this.resolveText(point.comment, dictionary);
                            if (text) {
                                results.push({
                                    category: 'Waypoint',
                                    context: `${path}/WP${index + 1} Comment`,
                                    text: text
                                });
                            }
                        }
                    });
                }
            });
        }

        return results;
    },

    /**
     * Extract radio messages
     */
    extractRadioMessages: function(mission, dictionary) {
        const results = [];

        // Check for radio messages in various locations
        // This is mission-dependent, so we do a deep search

        const searchRadio = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') return;

            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}/${key}` : key;

                if (key.toLowerCase().includes('radio') || key.toLowerCase().includes('message')) {
                    if (typeof value === 'string') {
                        const text = this.resolveText(value, dictionary);
                        if (text) {
                            results.push({
                                category: 'Radio',
                                context: currentPath,
                                text: text
                            });
                        }
                    }
                }

                if (typeof value === 'object' && !Array.isArray(value)) {
                    searchRadio(value, currentPath);
                }
            }
        };

        if (mission) {
            searchRadio(mission.triggers);
            searchRadio(mission.trigrules);
        }

        return results;
    },

    /**
     * Traverse groups in coalition data
     */
    traverseGroups: function(coalitionData, callback) {
        if (!coalitionData?.country) return;

        const countries = Array.isArray(coalitionData.country)
            ? coalitionData.country
            : Object.values(coalitionData.country);

        for (const country of countries) {
            if (!country) continue;

            const countryName = country.name || 'Unknown';
            const groupTypes = ['plane', 'helicopter', 'vehicle', 'ship', 'static'];

            for (const groupType of groupTypes) {
                const typeData = country[groupType];
                if (!typeData?.group) continue;

                const groups = Array.isArray(typeData.group)
                    ? typeData.group
                    : Object.values(typeData.group);

                for (const group of groups) {
                    if (group) {
                        callback(group, `${countryName}/${groupType}/${group.name || 'Unknown'}`);
                    }
                }
            }
        }
    },

    /**
     * Traverse units in coalition data
     */
    traverseUnits: function(coalitionData, callback) {
        this.traverseGroups(coalitionData, (group, path) => {
            if (group.units) {
                const units = Array.isArray(group.units)
                    ? group.units
                    : Object.values(group.units);

                for (const unit of units) {
                    if (unit) {
                        callback(unit, path);
                    }
                }
            }
        });
    },

    /**
     * Format context name for display
     */
    formatContextName: function(key) {
        const names = {
            sortie: 'Mission Name',
            descriptionText: 'Description',
            descriptionBlueTask: 'Blue Task',
            descriptionRedTask: 'Red Task',
            descriptionNeutralsTask: 'Neutral Task'
        };
        return names[key] || key;
    },

    /**
     * Format extracted data as plain text
     */
    formatAsText: function(extractionResult) {
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('MIZ Editor - Extracted Text');
        lines.push(`Locale: ${extractionResult.locale}`);
        lines.push(`Total Strings: ${extractionResult.stats.totalStrings}`);
        lines.push(`Unique Strings: ${extractionResult.stats.uniqueStrings}`);
        lines.push('='.repeat(60));
        lines.push('');

        for (const [category, items] of Object.entries(extractionResult.extracted)) {
            if (items.length === 0) continue;

            lines.push('-'.repeat(40));
            lines.push(this.CATEGORIES[category]?.name || category.toUpperCase());
            lines.push('-'.repeat(40));

            for (const item of items) {
                lines.push(`${item.category}: [${item.context}]`);
                lines.push(item.text);
                lines.push('');
            }
        }

        return lines.join('\n');
    },

    /**
     * Format extracted data as JSON
     */
    formatAsJson: function(extractionResult) {
        const jsonOutput = {
            metadata: {
                locale: extractionResult.locale,
                totalStrings: extractionResult.stats.totalStrings,
                uniqueStrings: extractionResult.stats.uniqueStrings
            },
            strings: {}
        };

        let keyIndex = 1;
        for (const [category, items] of Object.entries(extractionResult.extracted)) {
            for (const item of items) {
                const key = `${category}_${keyIndex++}`;
                jsonOutput.strings[key] = {
                    category: item.category,
                    context: item.context,
                    text: item.text
                };
            }
        }

        return JSON.stringify(jsonOutput, null, 2);
    }
};

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MizParser;
}
