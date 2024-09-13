const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'prompts.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database opened successfully');
        db.run(`
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY,
                label TEXT,
                prompt TEXT
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_id INTEGER,
                label TEXT,
                template TEXT,
                FOREIGN KEY(prompt_id) REFERENCES prompts(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating templates table:', err);
            } else {
                // Check if the label column exists, and add it if it doesn't
                db.all("PRAGMA table_info(templates)", (err, info) => {
                    if (err) {
                        console.error('Error checking templates table schema:', err);
                    } else {
                        if (Array.isArray(info)) {
                            const hasLabelColumn = info.some(column => column.name === 'label');
                            if (!hasLabelColumn) {
                                db.run("ALTER TABLE templates ADD COLUMN label TEXT", (err) => {
                                    if (err) {
                                        console.error('Error adding label column to templates table:', err);
                                    } else {
                                        console.log('Label column added to templates table');
                                    }
                                });
                            }
                        } else {
                            console.error('Unexpected result from PRAGMA table_info:', info);
                        }
                    }
                });
            }
        });
    }
});

function savePrompts(prompts) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO prompts (id, label, prompt) VALUES (?, ?, ?)');
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            prompts.forEach(prompt => {
                stmt.run(prompt.id, prompt.label, prompt.prompt);
            });
            db.run('COMMIT', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        stmt.finalize();
    });
}

function saveTemplates(templates) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO templates (prompt_id, label, template) VALUES (?, ?, ?)');
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            templates.forEach(template => {
                stmt.run(template.prompt_id, template.label, template.template);
            });
            db.run('COMMIT', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        stmt.finalize();
    });
}

function loadPrompts() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM prompts', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function loadTemplatesByPromptId(promptId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM templates WHERE prompt_id = ?', [promptId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function clearDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('DELETE FROM prompts', (err) => {
                if (err) {
                    reject(err);
                }
            });
            db.run('DELETE FROM templates', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

module.exports = {
    savePrompts,
    saveTemplates,
    loadPrompts,
    loadTemplatesByPromptId,
    clearDatabase
};