// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, dialog, Menu } from 'electron';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;


function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');

  // and load the index.html of the app.
  if (isDev) {
    mainWindow?.loadURL(url);
  } else {
    mainWindow?.loadFile(url);
  }
  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createMainWindow();
  
  const mainMenu = Menu.buildFromTemplate(menu as any);
  Menu.setApplicationMenu(mainMenu);

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

const menu = [
  {
    label: 'File',
    submenu: [
      {
        label: "Add file",
        accelerator: "CmdOrCtrl+O",
        click: async () => {
          const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile']
          });
          if (!canceled) {
            mainWindow?.webContents.send("file:open", filePaths[0]);
          }
        },
      },
      {
        label: 'Quit',
        click: () => app.quit(),
        accelerator: 'CmdOrCtrl+W',
      },
    ],
  },
  // {
  //   label: app.name,
  //   submenu: [
  //     {
  //       click: () => mainWindow.webContents.send("update-counter", 1),
  //       label: "increment"
  //     },
  //     {
  //       click: () => mainWindow.webContents.send("update-counter", -1),
  //       label: "decrement",
  //     }
  //   ]
  // },
  ...(isDev
    ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { type: 'separator' },
          { role: 'toggledevtools' },
        ],
      },
    ]
    : []),
];

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send('message', 'hi from electron'), 500);
});
