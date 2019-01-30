# Giant Astronaut
Photobooth and projection system for the
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

#### Install the application:
  
```
git clone --recurse-submodules https://github.com/scimusmn/jts-astronaut C:\App\jts-astronaut
yarn

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
  Download and install from APC.

## Notes

#### Configuration Options

* __Setting Shutdown Schedule__: The permenant shutdown schedule is set by the [`shutdownSchedule.json`] file in the appData directory. The file is formatted like this:
    ```
    {
      "weekly": [
        [0,17,30],
        [1,17,30],
        [2,17,30],
        [3,17,30],
        [4,21,30],
        [5,21,30],
        [6,21,30]
      ]
    }
    ```

    The first number in each triplet indicates the day of the week; '0' is Sunday, '1' is Monday, and so on. The second and third numbers represent the hour and minute of the day respectively, represented in 24 hour representation. So, in the example above, the line `[4,21,30]` instructs the computer to shutdown at 9:30PM on Thursdays.

* __Modify the next scheduled shutdown__: It is possible to change when the computer will next shutdown by typing specific commands into the name badge text entry field. Each of these commands is enter in the format `shutdown:{COMMAND}:{VALUE}`. The unique commands are listed below:

    | COMMAND     | VALUE                        | Result  |
    | ---         | ---                          | ---     |
    | `delay`     | Time in HH:MM format         | Delays the next shutdown by HH hours and MM minutes  |
    | `setTime`   | Time in HH:MM format         | Reschedules the next shutdown to HH:MM        |
    | `cancelNext`| None                         | Cancels the next scheduled shutdown        |
    | `now`       | None                         | Shutdown the computer immediately. |

* __Setting the record time__:

#### Troubleshooting

* *__Windows are displaying on the wrong display__*: This likely indicates that, for some reason, the display IDs of the monitors have changed. The most common reason for this to happen would be display cables being moved to a different port, but a hard shutdown of the computer can sometimes cause this to happen. To reset the display order of the windows, quit the application, open the 

#### System basics

This system uses EDID information and Windows-specific display names to project the correct window to the correct display. 
