import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { savePrompts, saveTemplates, loadPrompts, loadTemplatesByPromptId, clearDatabase } from './database.js';
import OpenAI from "openai";
import { syncNotionData } from './notionSync.js';
import { sequelize, Prompt, Template } from './models.js';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
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

// Register all IPC handlers
function registerIPCHandlers() {
    ipcMain.handle('load-prompts', loadPrompts);
    ipcMain.handle('save-prompts', (event, prompts) => savePrompts(prompts));
    ipcMain.handle('save-templates', (event, templates) => saveTemplates(templates));
    ipcMain.handle('load-templates-by-prompt-id', (event, promptId) => loadTemplatesByPromptId(promptId));
    ipcMain.handle('clear-database', clearDatabase);
    ipcMain.handle('generate-post', async (event, prompt, apiKey) => {
        try {
            const openai = new OpenAI({ apiKey });
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
    ipcMain.handle('get-prompts', async () => {
        try {
            const prompts = await Prompt.findAll({ 
                include: [{ 
                    model: Template,
                    attributes: ['id', 'title', 'content', 'promptId']
                }],
                attributes: ['id', 'title', 'description', 'promptContent']
            });
            const plainPrompts = JSON.parse(JSON.stringify(prompts));
            console.log('Fetched prompts from database:', plainPrompts);
            return plainPrompts;
        } catch (error) {
            console.error('Error fetching prompts:', error);
            throw error;
        }
    });
    ipcMain.handle('get-templates', async (event, promptId) => {
        try {
            const templates = await Template.findAll({ 
                where: { promptId },
                attributes: ['id', 'title', 'content', 'promptId']
            });
            return JSON.parse(JSON.stringify(templates));
        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    });
    ipcMain.handle('fetch-notion-data', async () => {
        try {
            await syncNotionData();
            return { success: true };
        } catch (error) {
            console.error('Error syncing Notion data:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('sync-notion-data', async () => {
        try {
            await syncNotionData();
            const prompts = await Prompt.findAll();
            return prompts;
        } catch (error) {
            console.error('Error syncing Notion data:', error);
            throw error;
        }
    });
}

app.whenReady().then(async () => {
    createWindow();

    // Register all IPC handlers
    registerIPCHandlers();

    try {
        await sequelize.sync();
        console.log('Starting initial Notion data sync...');
        await syncNotionData();
        console.log('Initial Notion data sync completed');
        
        const prompts = await Prompt.findAll({
            attributes: ['id', 'title', 'description', 'promptContent']
        });
        mainWindow.webContents.send('prompts-loaded', prompts);
    } catch (error) {
        console.error('Error during initial setup:', error);
    }
});

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