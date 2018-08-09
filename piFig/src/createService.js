obtain([`${__dirname}/utils.js`, 'child_process', 'fs'], ({ copyConfigFile, call: Call }, { execSync }, fs)=> {

  var mainDir = __dirname.substring(0, __dirname.indexOf('/piFig/src'));
  var startup = 'sudo startx ' + mainDir + 'node_modules/.bin/electron ' + mainDir;

  console.log(startup);

  exports.disable = (serviceName)=> {
    if (fs.existsSync(`/etc/systemd/system/${serviceName}.service`))
      execSync(`sudo systemctl disable ${serviceName}.service`);
    else console.error('Service not installed.');
  };

  exports.configure = (serviceName, serviceDescription, startCommand)=> {
    copyConfigFile(`${__dirname}/../configFiles/serviceTemplate`,
      `/etc/systemd/system/${serviceName}.service`, {
        START_COMMAND: startCommand,
        DESCRIPTION_TEXT: serviceDescription,
      }
    );
    execSync(`sudo systemctl enable ${serviceName}.service`);
  };

  exports.stop = (serviceName)=> {
    execSync(`sudo systemctl stop ${serviceName}.service`);
  };

  exports.start = (serviceName)=> {
    execSync(`sudo systemctl start ${serviceName}.service`);
  };
});
