obtain(['fs', `${__dirname}/utils.js`, 'os'], (fs, utils, os)=> {
  var writeXinit = (ip)=> {
    utils.copyConfigFile(`${__dirname}/../configFiles/xserverrc`,
                          `/etc/X11/xinit/xserverrc`);
  };

  exports.configure = ()=> {
    writeXinit();
  };

});
