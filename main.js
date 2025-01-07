const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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
    db = new sqlite3.Database('plants.db', (err) => { // Notice no "const" here
        if (err) {
            console.error('Database error:', err);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        variety TEXT,
        notes TEXT
    )`);

    const newColumns = [
        { name: 'img_seed_filename', type: 'TEXT' },
        { name: 'img_plant_filename', type: 'TEXT' },
        { name: 'img_flower_filename', type: 'TEXT' },
        { name: 'img_fruit_filename', type: 'TEXT' },
        { name: 'img_description_filename', type: 'TEXT' },
        { name: 'description', type: 'TEXT' }
    ];

    newColumns.forEach((column) => {
        db.run(`ALTER TABLE plants ADD COLUMN ${column.name} ${column.type}`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error(`Error adding column ${column.name}:`, err);
            }
        });
    });

    console.log('Database initialized');
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

ipcMain.handle('upload-image', async (event, { plantId, filePath }) => {
    if (!filePath) {
        throw new TypeError('Invalid file path provided.');
    }

    try {
        const extension = path.extname(filePath); // Get the file extension
        const saveDir = path.join(__dirname, 'uploads'); // Directory to save images
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir); // Create directory if it doesn't exist
        }
        const savePath = path.join(saveDir, `${plantId}_${path.basename(filePath)}`); // Name file with plantId
        fs.copyFileSync(filePath, savePath); // Save the file
        return savePath; // Return the saved file path
    } catch (error) {
        console.error('Error occurred in upload-image handler:', error);
        throw error;
    }
});



ipcMain.handle('update-plant-images', async (event, { plantId, imgSeed, imgPlant, imgFlower, imgFruit, imgDescription }) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE plants SET 
                img_seed_filename = ?, 
                img_plant_filename = ?, 
                img_flower_filename = ?, 
                img_fruit_filename = ?, 
                img_description_filename = ? 
            WHERE id = ?`,
            [imgSeed, imgPlant, imgFlower, imgFruit, imgDescription, plantId],
            (err) => {
                if (err) {
                    console.error('Error updating plant images:', err);
                    reject(err);
                }
                resolve();
            }
        );
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
    if (!db) {
        throw new Error('Database is not initialized');
    }
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