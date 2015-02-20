#!/usr/bin/env python

import time
from sarge import run


def main():
    # Open the Resolume Arena program
    run('open BigAstronaut.avc', cwd='/Users/bkennedy/ws/jts-astronaut')
    # Wait enough time for the node instance to load
    time.sleep(20)
    cef_cmd = 'open -a CefWithSyphon.app \
        --args --url=http://localhost:7770/playback'
    run(cef_cmd, cwd='/Users/bkennedy/ws/jts-astronaut')
    time.sleep(5)
    # Launch Stele
    run('./browser.py', cwd='/Users/bkennedy/ws/stele')

if __name__ == "__main__":
    main()
