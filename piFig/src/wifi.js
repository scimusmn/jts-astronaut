obtain(['fs', `${__dirname}/utils.js`], (fs, utils)=> {
  var writeWPASupplicant = (ssid, pass)=> {
    utils.copyConfigFile(`${__dirname}/../configFiles/wpa_supplicant_default.conf`,
                          '/etc/wpa_supplicant/wpa_supplicant.conf',
                          { SSID: ssid, PASSWORD: pass });
  };

  var writeUserSupplicant = (ssid, user, pass)=> {
    utils.copyConfigFile(`${__dirname}/../configFiles/wpa_supplicant_smm.conf`,
                          '/etc/wpa_supplicant/wpa_supplicant.conf',
                          { SSID: ssid, PASSWORD: pass, USERNAME: user });
  };

  exports.configure = (cfgObj)=> {
    console.log(cfgObj);
    if (!cfgObj.user) writeWPASupplicant(cfgObj.ssid, cfgObj.password);
    else writeUserSupplicant(cfgObj.ssid, cfgObj.user, cfgObj.password);
  };

});
