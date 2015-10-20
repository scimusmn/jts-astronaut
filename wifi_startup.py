#!/usr/bin/env python

import time
from sarge import run


def main():
    time.sleep(30)
    # Open the Resolume Arena program
    run('open BigAstronaut.avc', cwd='/Users/exhibits/Desktop/jts-astronaut')
    time.sleep(5)
    run('open BigAstronaut.avc', cwd='/Users/exhibits/Desktop/jts-astronaut')
    time.sleep(2)
    run('cliclick "c:462,9"')
    run('cliclick "c:462,105"')

    # Wait enough time for the node instance to load
    time.sleep(30)
    cef_cmd = 'open -a CefWithSyphon.app \
        --args --url=http://172.20.10.4:7770/playback'
    run(cef_cmd, cwd='/Users/exhibits/Desktop/jts-astronaut')
    time.sleep(5)
    # Launch Stele
    run('./browser.py', cwd='/Users/exhibits/Desktop/stele')
    time.sleep(5)
    run('cliclick "c:200,200"')


if __name__ == "__main__":
    main()
