const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Use dev server when running electron-dev (concurrently with npm start)
const useDevServer = process.env.USE_DEV_SERVER === 'true';

let localServer = null;

/** Start a local HTTP server to serve the build folder. Firebase requires http/https, not file:// */
function startLocalServer() {
  return new Promise((resolve) => {
    const buildPath = path.join(__dirname, '../build');
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    };

    localServer = http.createServer((req, res) => {
      let filePath = url.parse(req.url).pathname;
      if (filePath === '/') filePath = '/index.html';
      filePath = path.join(buildPath, filePath);
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(path.resolve(buildPath))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            filePath = path.join(buildPath, 'index.html');
            fs.readFile(filePath, (e, d) => {
              if (e) {
                res.writeHead(500);
                res.end('Error loading app');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(d);
              }
            });
          } else {
            res.writeHead(500);
            res.end('Error loading file');
          }
          return;
        }
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    // Use fixed port + localhost (localhost is in Firebase Auth authorized domains)
    const PORT = 29482;
    localServer.listen(PORT, 'localhost', () => {
      resolve(`http://localhost:${PORT}`);
    });
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Required for Firebase to work in Electron
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // F12 to open DevTools for debugging (e.g. Firebase/network errors)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  if (useDevServer) {
    // Development: load from React dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: serve build over HTTP (Firebase requires http/https, not file://)
    startLocalServer().then((appUrl) => {
      mainWindow.loadURL(appUrl);
    });
  }

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('will-quit', () => {
  if (localServer) {
    localServer.close();
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
