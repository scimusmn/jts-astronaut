obtain(['fs', `${__dirname}/utils.js`, 'child_process'], (fs, { copyConfigFile }, { execSync })=> {

  exports.configure = (pin)=> {
    var serviceFolder = __dirname.substring(0, __dirname.indexOf('/src')) + '/services';
    copyConfigFile(`${__dirname}/../configFiles/shutdownBlob.dts`, 'newBlob.dts', { SHUTDOWN_PIN: pin });
    execSync('sudo dtc -I dts -O dtb -o /boot/dt-blob.bin newBlob.dts');
    /*if (!fs.existsSync(serviceFolder + '/node_modules')) {
      fs.mkdirSync(serviceFolder + '/node_modules');
    }*/

    execSync('su pi -c "mkdir node_modules"', { cwd: serviceFolder });
    execSync('su pi -c "npm install onoff"', { cwd: serviceFolder });

    console.log('Configured soft shutdown.');
  };

});
