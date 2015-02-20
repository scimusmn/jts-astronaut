#!/usr/bin/env python

import time
from sarge import run


def main():
    # Open the Resolume Arena program
    run('open BigAstronaut.avc', cwd='/Users/exhibits/Desktop/jts-astronaut')
    # Wait enough time for the node instance to load
    time.sleep(20)
    cef_cmd = 'open -a CefWithSyphon.app \
        --args --url=http://localhost:7770/playback'
    run(cef_cmd, cwd='/Users/exhibits/Desktop/jts-astronaut')
    time.sleep(5)
    # Launch Stele
    run('./browser.py', cwd='/Users/exhibits/Desktop/stele')

if __name__ == "__main__":
    main()
