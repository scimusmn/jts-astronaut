obtain(['fs', `${__dirname}/utils.js`], (fs, utils)=> {
  var writeStaticConfFiles = (ip)=> {
    utils.copyConfigFile(`${__dirname}/../configFiles/dhcpcd_staticIP.conf`,
                          '/etc/dhcpcd.conf',
                          { STATIC_IP: ip });
    utils.copyConfigFile(`${__dirname}/../configFiles/interfaces_staticIp`,
                          '/etc/network/interfaces');
  };

  exports.configure = (ip)=> {
    writeStaticConfFiles(ip);
  };

});
