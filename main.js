"use strict";

const { app, ipcMain, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;
let dev = false;
if (
  process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath)
) {
  dev = true;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  // load the index.html of the app
  let indexPath;
  if (dev && process.argv.indexOf("--noDevServer") === -1) {
    indexPath = new URL("http://localhost:3000/index.html");
  } else {
    indexPath = new URL(path.join(__dirname, "dist", "index.html"), "file:");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (dev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on("closed", function () {
    mainWindow = null;

    // terminate the app when main window is closed
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  await mainWindow.loadURL(indexPath.toString());
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (mainWindow === null) {
    await createWindow();
  }
});

//-------------------- print function -----------------

// List of all options at -
// https://www.electronjs.org/docs/latest/api/web-contents#contentsprintoptions-callback
const printOptions = {
  silent: true,
  printBackground: true,
  color: true,
  margin: {
    marginType: "printableArea",
  },
  landscape: false,
  pagesPerSheet: 1,
  collate: false,
  copies: 1,
  header: "Page header",
  footer: "Page footer",
};

//handle print
ipcMain.handle("printComponent", async (event, url) => {
  const win = new BrowserWindow({ show: false, kiosk: true });

  win.webContents.on("did-frame-finish-load", () => {
    win.loadURL(
      "https://zto-one-storage-dev.s3-ap-southeast-1.amazonaws.com/2022_10/pdf/grn-received-f2d4e7d5-3465-4b4d-83a4-72a164dff1c0_72a03da4-aa3b-4b5f-a42e-96fafb40a9b5.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4JNNAGCC5AELFBBB%2F20221011%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20221011T072955Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=4ab0c7c7364dd79bcaf13f713cde1ebe03d009dba40968d60d77335cf86046d2"
    );
    // win.webContents.print(printOptions, (success, failureReason) => {
    //   console.log("Print Initiated in Main...");
    //   if (!success) console.log(failureReason);
    // });

    console.log("bbbbbbbbbbbbbbbbbbbbbbb");

    win.webContents.on("did-finish-load", () => {
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaa");

      win.webContents.print({ silent: true, printBackground: true });
    });

    // win.webContents.print(printOptions, (success, failureReason) => {
    //   console.log("Print Initiated in Main...");
    //   if (!success) console.log(failureReason);
    // });
  });

  await win.loadURL(url);
  return "shown print dialog";
});

//handle preview
ipcMain.handle("previewComponent", async (event, url) => {
  let win = new BrowserWindow({
    title: "Print Preview",
    show: false,
    autoHideMenuBar: true,
  });

  win.webContents.once("did-finish-load", () => {
    win.webContents
      .printToPDF(printOptions)
      .then((data) => {
        const buf = Buffer.from(data);
        data = buf.toString("base64");
        const url = "data:application/pdf;base64," + data;

        win.webContents.on("ready-to-show", () => {
          win.once("page-title-updated", (e) => e.preventDefault());
          win.show();
        });

        win.webContents.on("closed", () => (win = null));
        win.loadURL(url);
      })
      .catch((error) => {
        console.log(error);
      });
  });

  await win.loadURL(url);
  return "shown preview window";
});
