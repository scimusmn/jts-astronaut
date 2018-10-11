# Giant Astronaut

Video system for the
[Giant Astronaut](https://twitter.com/hashtag/GiantAstronaut)
at the [Science Museum of Minnesota](https://www.smm.org).

## Technologies
* [NodeJS](https://nodejs.org/en/)
* [Electron](https://electronjs.org/)

## Installation

#### Install chocolatey:

*From admin command prompt:*
```
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
```
#### Disable Hibernation:

*Also from admin command prompt:*

```
powercfg.exe /h off
```
#### Install Node, git and yarn:

*From admin Powershell:*
```
choco install -y nodejs git yarn
```

#### Install Windows build tools:

```
npm install -g --production windows-build-tools
```

#### Setting up automatic startup:

  1. Open Windows Menu
  2. Type `run`
  3. Enter `shell:startup`
  4. Drop in [startup.bat](https://github.com/scimusmn/jts-astronaut/blob/075dda0483d733c5f653a319380e0bd311ee5984/startup.bat)

#### Setup auto-login:

  1. Open Windows Menu
  2. Type `run`
  3. Enter `netplwiz`
  4. Uncheck `Users must enter a username and password to use this computer`
  
#### Disable Windows Update Service:

  1. Open Windows Menu
  2. Type `run`
  3. Enter `services.msc`
  4. Find `Windows 10 Update Facilitation Service`
  5. Right click on it and select `Properties`
  6. Under the `General` tab, click the `Startup Type` dropdown menu and select `Disabled`
  
#### Install ELO Touch Drivers:

  Download and install from [this page](http://support.elotouch.com/Download/Drivers/DriverDownload/driverdownload.aspx?str=80)
  
#### Install the Powerchute software for the APC Battery Backup:
  Download and install from [this link](ftp://restrict:Kop$74!@ftp.apc.com/restricted/software/pcpe/302/windows/PCPEInstaller.exe)

## Notes
