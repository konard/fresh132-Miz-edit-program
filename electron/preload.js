/**
 * Miz Editor - Electron Preload Script
 * Exposes safe APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Open file dialog
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

    // Save file dialog
    saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),

    // Listen for file opened from menu
    onFileOpened: (callback) => {
        ipcRenderer.on('file-opened', (event, data) => callback(data));
    },

    // Check if running in Electron
    isElectron: true,

    // Get platform info
    platform: process.platform
});

console.log('Miz Editor: Electron preload script loaded');
