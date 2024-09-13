const { contextBridge, ipcRenderer } = require('electron');
const Papa = require('papaparse');

contextBridge.exposeInMainWorld('electronAPI', {
    loadPrompts: () => ipcRenderer.invoke('load-prompts'),
    parseCSV: (csvData, callback) => {
        Papa.parse(csvData, {
            complete: (results) => {
                callback(results.data);
            }
        });
    },
    savePrompts: (prompts) => ipcRenderer.invoke('save-prompts', prompts),
    saveTemplates: (templates) => ipcRenderer.invoke('save-templates', templates),
    loadTemplatesByPromptId: (promptId) => ipcRenderer.invoke('load-templates-by-prompt-id', promptId),
    clearDatabase: () => ipcRenderer.invoke('clear-database'),
    generatePost: (prompt, apiKey) => ipcRenderer.invoke('generate-post', prompt, apiKey),
    getPrompts: () => ipcRenderer.invoke('get-prompts'),
    getTemplates: (promptId) => ipcRenderer.invoke('get-templates', promptId),
    fetchNotionData: () => ipcRenderer.invoke('fetch-notion-data'),
    syncNotionData: () => ipcRenderer.invoke('sync-notion-data'),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});