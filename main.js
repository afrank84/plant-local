// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
const db = new sqlite3.Database('plants.db');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    last_watered DATE,
    notes TEXT
  )`);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.whenReady().then(createWindow);

// IPC handlers for database operations
ipcMain.handle('add-plant-record', async (event, plantData) => {
  return new Promise((resolve, reject) => {
    const { name, location, lastWatered, notes } = plantData;
    db.run(
      'INSERT INTO plants (name, location, last_watered, notes) VALUES (?, ?, ?, ?)',
      [name, location, lastWatered, notes],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
});

ipcMain.handle('get-plant-records', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM plants', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});