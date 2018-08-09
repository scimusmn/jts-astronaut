if (!window) var window = global;

var obtains = [
  'drivelist',
  'µ//events.js',
  'child_process',
  //'node-usb-detection',
];

obtain(obtains, (drivelist, { Emitter }, { exec, execSync })=> {
  if (!window.usbMonitor) {
    class Monitor extends Emitter {
      constructor() {
        super();

        this.drives = [];
      }

      begin() {
        var _this = this;
        drivelist.list((error, drives) => {
          this.drives = drives;
        });
        this.interval = setInterval(()=> {
          drivelist.list((error, drives) => {
            if (error) {
              throw error;
            }

            var usb = drives.filter(drive=>(drive.devicePath && drive.devicePath.includes('usb')) || drive.isUSB);
            usb.forEach((drive, ind, arr)=> {
              let exists = this.drives.find(drv=>drv.device == drive.device);
              if (!exists) {
                this.emit('connected', drive);
                if (drive.mountpoints.length) this.emit('mounted', drive);
              } else {
                if (exists && !exists.mountpoints.length && drive.mountpoints.length) {
                  this.emit('mounted', drive);
                }
              }
            });

            _this.drives = usb;
          });
        }, 1000);
      }

      mount(drive) {
        if (process.platform == 'linux') {
          //get the label in capture[1], UUID in capture[2], and type in 3
          var label_match = /\WLABEL="([^"]+)"/g;
          var id_match = /\WUUID="([^"]+)"/g;
          var type_match = /\WTYPE="([^"]+)"/g;
          var output = execSync(`sudo blkid ${drive.device}*`);
          var label = label_match.exec(output);
          label = (label) ? label[1] : 'usbdrive';

          var id = id_match.exec(output)[1];
          var type = type_match.exec(output)[1];

          execSync(`sudo mkdir -p /mnt/${id}`);
          exec(`sudo mount -t ${type} --uuid ${id} /mnt/${id}`, (err, stdout, stderr)=> {
          });
        }
      }

      unmount(drive) {
        if (process.platform == 'linux') {
          for (var i = 0; i < drive.mountpoints.length; i++) {
            execSync(`sudo umount ${drive.mountpoints[i].path}`);
          }
        }
      }
    }
    window.usbMonitor = new Monitor();
  }

  exports.monitor = window.usbMonitor;

});
