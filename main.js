const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Ensure it's consistent with your HTML expectations
        }
    });

    mainWindow.loadFile('index.html');
}

function initDatabase() {
    db = new sqlite3.Database('plants.db', (err) => {
        if (err) console.error('Database error:', err);
    });

    db.run(`CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        variety TEXT,
        notes TEXT
    )`);
}

app.whenReady().then(() => {
    createWindow();
    initDatabase();
});


ipcMain.handle('add-plant', async (event, plant) => {
  return new Promise((resolve, reject) => {
      db.run(`INSERT INTO plants (name, variety, notes) VALUES (?, ?, ?)`,
          [plant.name, plant.variety, plant.notes],
          function(err) {
              if (err) {
                  console.error('Database insert error:', err);
                  reject(err);
              }
              resolve(this.lastID);
          });
  });
});

ipcMain.handle('delete-plant', async (event, id) => {
  return new Promise((resolve, reject) => {
      db.run('DELETE FROM plants WHERE id = ?', [id], function(err) {
          if (err) {
              console.error('Database delete error:', err);
              reject(err);
          }
          resolve();
      });
  });
});


ipcMain.handle('get-plants', async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM plants', [], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
});

//Used for grabing details for loading a new page on click
ipcMain.handle('get-plant-by-id', async (event, id) => {
  return new Promise((resolve, reject) => {
      db.get('SELECT * FROM plants WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          resolve(row);
      });
  });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});