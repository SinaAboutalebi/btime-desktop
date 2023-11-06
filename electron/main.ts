import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from 'electron'
import path from 'node:path'
import { store } from './store';
import { join } from "node:path";
import { config } from "dotenv";
import { getIconPath, getPublicFilePath } from '../shared/getIconPath';

config();

process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "./dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "./public")
  : process.env.DIST;


let win: BrowserWindow | null;
const icon = nativeImage.createFromPath(getIconPath());
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    height: 180,
    width: 170,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: true,
    center: true,
    x: store.get("bounds").x,
    y: store.get("bounds").y,
    title: "bTime",
    titleBarStyle: "hidden",
  })
  createTray()
  win.on("moved", () => {
    if (win) {
      const { x, y } = win.getBounds()
      store.set("bounds", { x, y })
    }
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}


app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});


app.on('activate', () => {

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()


  }


})

app.whenReady().then(createWindow)


function createTray() {

  const appIcon = new Tray(icon);

  const powerIcon = nativeImage.createFromPath(
    getPublicFilePath("icons/power.png")
  );
  const settingIcon = nativeImage.createFromPath(
    getPublicFilePath("icons/setting.png")
  );
  const linkIcon = nativeImage.createFromPath(
    getPublicFilePath("icons/link.png")
  );
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "bTime",
      enabled: false,
      icon: icon.resize({ height: 19, width: 19 }),
    },
    {
      label: "settings(soon)",
      icon: settingIcon,
      enabled: false,
    },
    {
      label: "website",
      icon: linkIcon,
      click: function () {
        shell.openExternal("https://github.com/sajjadmrx/btime-desktop");
      },
    },
    {
      label: "Quit bTime",
      icon: powerIcon,
      click: function () {
        app.exit(1);
      },
    },
  ]);


  appIcon.setToolTip("bTime");
  appIcon.setContextMenu(contextMenu);
  return appIcon;
}