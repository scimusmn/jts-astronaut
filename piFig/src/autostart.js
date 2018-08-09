obtain(['./src/createService.js'], (services)=> {

  var mainDir = __dirname.substring(0, __dirname.indexOf('/piFig/src'));
  var startup = `/usr/bin/startx ${mainDir}/node_modules/.bin/electron ${mainDir}`;

  console.log(startup);

  exports.remove = ()=> {
    services.disable('electron');
  };

  exports.configure = ()=> {
    services.configure('electron', 'Autostart main application', startup);
  };
});
