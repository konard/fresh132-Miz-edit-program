# Miz Editor

A web-based tool for extracting localizable text from DCS World `.miz` mission files. Designed to help Russian-speaking players translate mission content via APIs or AI models.

## Features

- **File Upload**: Drag-and-drop or browse to upload `.miz` files
- **Extraction Modes**:
  - **Automatic Mode**: Extract all localizable text automatically
  - **Manual Mode**: Select specific categories (briefings, triggers, units, waypoints, radio messages)
- **Locale Support**: Prioritizes DEFAULT locale; can detect and use RU if available
- **Output Formats**:
  - Plain text (`.txt`) - prefixed with context for easy reading
  - JSON (`.json`) - structured format for API/AI processing
- **Preview**: View extracted text before downloading
- **Cross-Platform**:
  - Web version hosted on GitHub Pages
  - Windows desktop app via Electron

## Quick Start

### Web Version

Visit the hosted version on GitHub Pages: [Miz Editor](https://fresh132.github.io/Miz-edit-program/)

### Local Development

```bash
# Clone the repository
git clone https://github.com/fresh132/Miz-edit-program.git
cd Miz-edit-program

# Install dependencies
npm install

# Create sample .miz file for testing
npm run create-sample

# Start local web server
npm run start:web
```

### Windows Desktop App

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build Windows executable
npm run make
```

The built executable will be in `out/make/` directory.

## Project Structure

```
miz-editor/
├── index.html              # Main web interface
├── css/
│   └── styles.css          # Application styles
├── src/
│   ├── app.js              # Main application logic
│   ├── lua-parser.js       # Lua table parser
│   └── miz-parser.js       # .miz file parser and text extractor
├── electron/
│   ├── main.js             # Electron main process
│   └── preload.js          # Electron preload script
├── tests/
│   └── miz-editor.spec.js  # Playwright UI tests
├── samples/
│   ├── create-sample-miz.js    # Script to create test files
│   └── create-miz-archive.js   # Script to create .miz archive
├── .github/workflows/
│   ├── ci.yml              # CI pipeline
│   └── pages.yml           # GitHub Pages deployment
├── package.json            # Project configuration
└── playwright.config.js    # Playwright test configuration
```

## Technical Details

### .miz File Structure

`.miz` files are ZIP archives containing:
- `mission` - Lua table with mission data (sortie, descriptions, coalitions, triggers)
- `l10n/DEFAULT/dictionary` - Default locale strings
- `l10n/RU/dictionary` - Russian locale strings (optional)
- `options` - Mission options

### Extracted Categories

| Category | Description | Source Keys |
|----------|-------------|-------------|
| Briefings | Mission name, descriptions, task assignments | sortie, descriptionText, descriptionBlueTask, etc. |
| Tasks | Group task descriptions | task, taskDescription |
| Triggers | Trigger messages and comments | text, message in trigrules |
| Units | Unit names | name in coalition units |
| Waypoints | Waypoint names and comments | name, comment in route points |
| Radio | Radio messages | radioText, message |

### DictKey Resolution

Text values starting with `DictKey_` are resolved against the selected locale dictionary. Example:
- Mission file: `["text"] = "DictKey_MissionStart"`
- Dictionary: `["DictKey_MissionStart"] = "Welcome to the mission"`
- Output: "Welcome to the mission"

## Testing

```bash
# Run Playwright tests
npm test

# Run tests with UI
npm run test:ui
```

## Dependencies

### Web
- [JSZip](https://stuk.github.io/jszip/) - ZIP file handling in browser
- [Bootstrap 5](https://getbootstrap.com/) - UI framework

### Development
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [Electron Forge](https://www.electronforge.io/) - Build tools
- [Playwright](https://playwright.dev/) - E2E testing

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run Electron app in development |
| `npm run start:web` | Start local web server |
| `npm run create-sample` | Create sample .miz file |
| `npm test` | Run Playwright tests |
| `npm run make` | Build Windows executable |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- DCS World by Eagle Dynamics
- Russian DCS community for translation needs
