/**
 * Linkon Browser — Preload (context bridge)
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('linkon', {
  // Auth
  oauthLogin:   (provider) => ipcRenderer.invoke('oauth:login', provider),

  // Tabs
  newTab:       (url)  => ipcRenderer.invoke('tab:new', url),
  switchTab:    (id)   => ipcRenderer.invoke('tab:switch', id),
  closeTab:     (id)   => ipcRenderer.invoke('tab:close', id),
  listTabs:     ()     => ipcRenderer.invoke('tab:list'),

  // Navigation
  go:           (url)  => ipcRenderer.invoke('nav:go', url),
  back:         ()     => ipcRenderer.invoke('nav:back'),
  forward:      ()     => ipcRenderer.invoke('nav:forward'),
  reload:       ()     => ipcRenderer.invoke('nav:reload'),
  getUrl:       ()     => ipcRenderer.invoke('nav:getUrl'),

  // Window controls
  minimize:     ()     => ipcRenderer.invoke('window:minimize'),
  maximize:     ()     => ipcRenderer.invoke('window:maximize'),
  close:        ()     => ipcRenderer.invoke('window:close'),

  // Events → renderer
  onTabsUpdate: (cb)   => ipcRenderer.on('tabs:update',    (_, d) => cb(d)),
  onUrlChanged: (cb)   => ipcRenderer.on('nav:urlChanged', (_, u) => cb(u)),
});
