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
    generatePost: (prompt, apiKey) => ipcRenderer.invoke('generate-post', prompt, apiKey)
});