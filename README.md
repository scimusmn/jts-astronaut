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

## Notes
