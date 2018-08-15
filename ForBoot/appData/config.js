module.exports = {
  showDevTools: true,
  preventStartup: false,
  automate: true,
  windows: [
    {
      label: 'booth',
      fullscreen: true,
      alwaysOnTop: true,
      //displayId: '69733248',
      file: 'local/booth/index.html',
    },
    {
      label: 'playback',
      fullscreen: true,
      alwaysOnTop: true,
      //displayId: '724059286',
      file: 'local/playback/index.html',
    },
    {
      label: 'name_1',
      fullscreen: true,
      alwaysOnTop: true,
      //displayId: '724059286',
      //url: 'http://localhost/index.html' //use for web protocol
      file: 'local/name/index.html',
      //size: { width: 192, height: 108 },
      //position: { x: 0, y: 200 },
    },
    {
      label: 'name_2',
      fullscreen: true,
      alwaysOnTop: true,
      //displayId: '724059286',
      file: 'local/name/index.html',
      //size: { width: 192, height: 108 },
      //position: { x: 192, y: 200 },
    },
    {
      label: 'name_3',
      fullscreen: true,
      alwaysOnTop: true,
      //displayId: '724059286',
      file: 'local/name/index.html',
      //size: { width: 192, height: 108 },
      //position: { x: 384, y: 200 },
    },
  ],
};
