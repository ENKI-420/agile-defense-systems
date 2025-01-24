const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'

function createWindow() {
// Create the browser window
const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    enableRemoteModule: true
    }
})

// Load the index.html file
mainWindow.loadFile('src/index.html')

// Open DevTools in development mode
if (isDev) {
    mainWindow.webContents.openDevTools()
}
}

// Handle app lifecycle events
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
if (process.platform !== 'darwin') {
    app.quit()
}
})

app.on('activate', () => {
if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
}
})

// IPC Handlers
ipcMain.on('data-request', (event, arg) => {
// Handle data requests from renderer
event.reply('data-response', {status: 'success'})
})

