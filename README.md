# Giant Astronaut
Photobooth and projection system for the
[Giant Astronaut](https://twitter.com/hashtag/GiantAstronaut)
at the [Science Museum of Minnesota](https://www.smm.org).

## Technologies
* [NodeJS](https://nodejs.org/en/)
* [Electron](https://electronjs.org/)

## Basic Operation

This system acts as a simple video booth for visitors. Visitors are invited to record a short video of themselves at a small kiosk adjacent to the Giant Astronaut sculpture in our main atrium. After they are finished recording, they are prompted to enter their name using an on-screen keyboard. Once they submit their name, their video appears projected onto the inside of the visor of the Astronaut, and their name is displayed on the name badge monitors on the astronaut's chest. If the name entry screen is idle for more than 1 minute, the video will be sent to the projector with the default name, which is `i <3 space`

## Hardware Setup

The application runs on a single Windows machine, capable of output to 5 monitors concurrently. In our specific setup this is a Puget Systems box with a Ti1080 video card installed (? needs verification). The astronaut itself contains 3 monitors and 1 projector (needs specs). To get the video to the astronaut, we are using 4 Extron DVI extenders, which convert the DVI signal to be sent over Cat6 cables. The playback station uses an ELO Touchscreen monitor, which enables the visitor to directly interact with the interface.

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
cd C:\App\jts-astronaut
yarn install
```

#### Setting up automatic startup:

  1. Open Windows Menu
  2. Type `run`
  3. Enter `shell:startup`
  4. Drop a shortcut to [startup.bat] into the folder(https://github.com/scimusmn/jts-astronaut/blob/075dda0483d733c5f653a319380e0bd311ee5984/startup.bat)

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

* __Setting Shutdown Schedule__: The permenant shutdown schedule is set by the [`shutdownSchedule.json`](ForBoot/appData/shutdownSchedule.json) file in the appData directory. The file is formatted like this:
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

* __Setting the record time__: To set the amount of time that the photobooth records of each visitor, one must modify the [`config.js`](ForBoot/appData/config.js) file in the appData directory. One of the keys in this object is `recordTime`. The value is a float, specifying the time in seconds. By default, it is set to 15 seconds.

* __Setting the default__: To set the name that appears on the name badge if the entry time times out, or a swear is detected, one must modify the [`config.js`](ForBoot/appData/config.js) file in the appData directory. One of the keys in this object is `defaultName`. The value is a string of the name which will be displayed.

#### Troubleshooting

* *__Windows are displaying on the wrong display__*: This likely indicates that, for some reason, the display IDs of the monitors have changed. The most common reason for this to happen would be display cables being moved to a different port, but a hard shutdown of the computer can sometimes cause this to happen. To reset the display order of the windows, quit the application, open the `appData` directory, delete the `windowBindings.json` file, and restart the program. 

    On startup, if the program can't find the `windowBindings.json` file, it will automatically create a window on each display which asks which window should be displayed. Each of these windows has a dropdown from which to select from 5 different possible windows: 3 name badge monitors (`name_1`, `name_2`, and `name_3`), a booth window, and a playback window. The name badge windows are numbered from left to right, so the leftmost display should be set to display `name_1` and so on. The main touchscreen interface should display the window `booth`, and the projector should be displaying `playback`.
    
## Detailed program information

The application is written in Javascript and HTML5, and rendered on the monitors using Electron. All 5 monitors are rendered from the same Electron instance, and mapped to the displays according to a combination of [EDID information](https://en.wikipedia.org/wiki/Extended_Display_Identification_Data), [Chromium for Windows display ID conventions](https://chromium.googlesource.com/chromium/src/+/master/ui/display/win/display_info.cc), and information scraped from the registry by [MultiMonitorTool by Nirsoft](https://www.nirsoft.net/utils/multi_monitor_tool.html). This mapping is relatively stable, and will prefer to render no window to a display, rather than display an incorrect window.

Video capture is accomplished by capturing the RTC stream, using a the [RecordRTC library by muaz-khan](https://github.com/muaz-khan/RecordRTC). It temporarily saves the video to a dataURL, and is easily rendered in a standard HTML5 video tag.

Swear filtering for the namebadge names is accomplished with a simple regex expression, which looks for common symbolic and phonetic substitutions for words from the standard [`smm-profanities.json`](local/booth/src/swearFilter.js) list. This is using a greedy expression, so if any part of the name string contains a word from the swear list, the default name is displayed.
