#!/usr/bin/env python

from sarge import run

import time
source_dir = '/Users/exhibits/Desktop/jts-astronaut'

def main():
    # We want to start while the other startup script runs
    # the Resolume Arena program
    time.sleep(20)
    run('node node-booth.js', cwd=source_dir)

if __name__ == "__main__":
    main()
