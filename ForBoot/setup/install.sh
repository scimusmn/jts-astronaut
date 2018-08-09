#!/bin/bash

REPO_NAME=Electron_Template
ACCOUNT=heidgera

echo -e "\nInstalling node:"

curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

sudo apt-get install xserver-xorg-video-fbturbo

sudo apt-get install --no-install-recommends build-essential hostapd dnsmasq network-manager xserver-xorg xinit xserver-xorg-video-fbdev libxss1 libgconf-2-4 libnss3 git nodejs libgtk2.0-0 libxtst6

sudo apt-get install libasound2

echo  -e "\nClone the application"

git clone https://github.com/${ACCOUNT}/${REPO_NAME}.git

cd ${REPO_NAME}

echo  -e "\nInit the submodules:"

git submodule init

git submodule update

echo  -e "\nInstalling dependencies for application:"

npm i

echo  -e "\nConfiguring"

cd piFig

sudo node install.js
