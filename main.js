const { app, BrowserWindow, Menu, dialog, ipcMain, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let dirty = false;

function send(cmd) {
  if (win) win.webContents.send('menu', cmd);
}

function buildMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Yeni', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
        { label: 'Aç…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
        { type: 'separator' },
        { label: 'Kaydet', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: 'Farklı Kaydet…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('saveAs') },
        { type: 'separator' },
        { label: 'PNG olarak dışa aktar…', accelerator: 'CmdOrCtrl+E', click: () => send('exportPng') },
        { label: 'JPG olarak dışa aktar…', click: () => send('exportJpg') },
        { label: 'SVG olarak dışa aktar…', click: () => send('exportSvg') },
        { label: 'Resmi panoya kopyala', accelerator: 'CmdOrCtrl+Shift+C', click: () => send('copyImage') },
        { type: 'separator' },
        { label: 'Çıkış', role: 'quit' }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri al', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
        { label: 'Yinele', accelerator: 'CmdOrCtrl+Y', click: () => send('redo') },
        { type: 'separator' },
        { label: 'Kes', role: 'cut' },
        { label: 'Kopyala', role: 'copy' },
        { label: 'Yapıştır', role: 'paste' },
        { label: 'Tümünü seç', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Seçileni çoğalt', accelerator: 'CmdOrCtrl+D', click: () => send('duplicate') }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yakınlaştır', accelerator: 'CmdOrCtrl+=', click: () => send('zoomIn') },
        { label: 'Uzaklaştır', accelerator: 'CmdOrCtrl+-', click: () => send('zoomOut') },
        { label: 'Ekrana sığdır', accelerator: 'CmdOrCtrl+0', click: () => send('zoomFit') },
        { type: 'separator' },
        { label: 'Tam ekran', role: 'togglefullscreen' },
        { label: 'Geliştirici araçları', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () =>
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'KomikGen',
              message: 'KomikGen 1.0',
              detail: 'Karakter, duygu, poz, arka plan ve konuşma balonlarıyla kendi çizgi romanını oluştur.'
            })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    title: 'KomikGen',
    backgroundColor: '#1e1f24',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  win.on('close', (e) => {
    if (!dirty) return;
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Kaydetmeden çık', 'İptal'],
      defaultId: 1,
      cancelId: 1,
      title: 'Kaydedilmemiş değişiklikler',
      message: 'Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?'
    });
    if (choice === 1) e.preventDefault();
  });
}

const komikFilter = [{ name: 'KomikGen Projesi', extensions: ['komik'] }];

ipcMain.handle('set-dirty', (_e, value, title) => {
  dirty = !!value;
  if (win && title) win.setTitle(title);
});

ipcMain.handle('confirm', async (_e, message) => {
  const r = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['Evet', 'Hayır'],
    defaultId: 1,
    cancelId: 1,
    message
  });
  return r.response === 0;
});

ipcMain.handle('save-project', async (_e, { content, filePath, forceDialog }) => {
  let target = filePath;
  if (!target || forceDialog) {
    const r = await dialog.showSaveDialog(win, {
      title: 'Projeyi kaydet',
      defaultPath: target || 'komik.komik',
      filters: komikFilter
    });
    if (r.canceled || !r.filePath) return null;
    target = r.filePath;
  }
  fs.writeFileSync(target, content, 'utf8');
  return target;
});

ipcMain.handle('open-project', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Proje aç',
    filters: komikFilter,
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths.length) return null;
  const filePath = r.filePaths[0];
  return { filePath, content: fs.readFileSync(filePath, 'utf8') };
});

ipcMain.handle('open-image', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Resim seç',
    filters: [{ name: 'Resimler', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths.length) return null;
  const p = r.filePaths[0];
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
});

ipcMain.handle('export-file', async (_e, { data, ext, encoding }) => {
  const names = { png: 'PNG resmi', jpg: 'JPG resmi', svg: 'SVG vektör' };
  const r = await dialog.showSaveDialog(win, {
    title: 'Dışa aktar',
    defaultPath: `komik.${ext}`,
    filters: [{ name: names[ext] || ext, extensions: [ext] }]
  });
  if (r.canceled || !r.filePath) return null;
  if (encoding === 'dataurl') {
    const base64 = data.slice(data.indexOf(',') + 1);
    fs.writeFileSync(r.filePath, Buffer.from(base64, 'base64'));
  } else {
    fs.writeFileSync(r.filePath, data, 'utf8');
  }
  return r.filePath;
});

// Kullanıcının kendi karakterleri uygulama veri klasöründe saklanır
const charactersFile = () => path.join(app.getPath('userData'), 'karakterlerim.json');

ipcMain.handle('load-characters', () => {
  try {
    return JSON.parse(fs.readFileSync(charactersFile(), 'utf8'));
  } catch {
    return [];
  }
});

ipcMain.handle('save-characters', (_e, list) => {
  fs.mkdirSync(path.dirname(charactersFile()), { recursive: true });
  fs.writeFileSync(charactersFile(), JSON.stringify(list, null, 1), 'utf8');
  return true;
});

ipcMain.handle('copy-image', (_e, dataUrl) => {
  clipboard.writeImage(nativeImage.createFromDataURL(dataUrl));
  return true;
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
