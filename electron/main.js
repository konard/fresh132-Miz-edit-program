/**
 * Miz Editor - Electron Main Process
 * Desktop wrapper for Windows
 */

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

// Check if running in development
const isDev = process.argv.includes('--dev') || !app.isPackaged;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        title: 'Miz Editor - DCS World Mission Text Extractor'
    });

    // Load the index.html file
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Create application menu
    createMenu();

    // Emitted when the window is closed
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open .miz File',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: 'Open .miz File',
                            filters: [
                                { name: 'DCS Mission Files', extensions: ['miz'] },
                                { name: 'All Files', extensions: ['*'] }
                            ],
                            properties: ['openFile']
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            const filePath = result.filePaths[0];
                            const fileBuffer = fs.readFileSync(filePath);
                            const fileName = path.basename(filePath);

                            mainWindow.webContents.send('file-opened', {
                                name: fileName,
                                path: filePath,
                                buffer: fileBuffer.buffer.slice(
                                    fileBuffer.byteOffset,
                                    fileBuffer.byteOffset + fileBuffer.byteLength
                                )
                            });
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Miz Editor',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Miz Editor',
                            message: 'Miz Editor v1.0.0',
                            detail: 'Extract localizable text from DCS World .miz files.\n\nFor Russian-speaking players who need to translate mission content.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Handle file open request from renderer
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open .miz File',
        filters: [
            { name: 'DCS Mission Files', extensions: ['miz'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        return {
            name: fileName,
            path: filePath,
            buffer: fileBuffer.buffer.slice(
                fileBuffer.byteOffset,
                fileBuffer.byteOffset + fileBuffer.byteLength
            )
        };
    }

    return null;
});

// Handle save file request from renderer
ipcMain.handle('save-file-dialog', async (event, { defaultName, content, mimeType }) => {
    const extension = mimeType === 'application/json' ? 'json' : 'txt';

    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Extracted Text',
        defaultPath: defaultName,
        filters: [
            { name: extension === 'json' ? 'JSON Files' : 'Text Files', extensions: [extension] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, content, 'utf8');
        return { success: true, path: result.filePath };
    }

    return { success: false };
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed (Windows behavior)
app.on('window-all-closed', function() {
    app.quit();
});

app.on('activate', function() {
    // On macOS re-create window when dock icon is clicked
    if (mainWindow === null) {
        createWindow();
    }
});
