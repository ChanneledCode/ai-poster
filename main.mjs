import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { savePrompts, saveTemplates, loadPrompts, loadTemplatesByPromptId, clearDatabase } from './database.js';
import OpenAI from "openai";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true
        },
    });

    mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('load-prompts', async () => {
    try {
        const prompts = await loadPrompts();
        return prompts;
    } catch (error) {
        console.error('Error loading prompts:', error);
        return [];
    }
});

ipcMain.handle('save-prompts', async (event, prompts) => {
    try {
        await savePrompts(prompts);
    } catch (error) {
        console.error('Error saving prompts:', error);
    }
});

ipcMain.handle('save-templates', async (event, templates) => {
    try {
        await saveTemplates(templates);
    } catch (error) {
        console.error('Error saving templates:', error);
    }
});

ipcMain.handle('load-templates-by-prompt-id', async (event, promptId) => {
    try {
        const templates = await loadTemplatesByPromptId(promptId);
        return templates;
    } catch (error) {
        console.error('Error loading templates:', error);
        return [];
    }
}); 

ipcMain.handle('clear-database', async () => {
    try {
        await clearDatabase();
    } catch (error) {
        console.error('Error clearing database:', error);
    }
});

ipcMain.handle('generate-post', async (event, prompt, apiKey) => {
    try {
        const openai = new OpenAI({ apiKey }); // Use the provided API key
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
        });
        return completion.choices[0].message;
    } catch (error) {
        console.error('Error generating post:', error);
        throw error;
    }
});