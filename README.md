# Big Astronaut

Video system for the Big Astronaut at the Science Museum of Minnesota

## Installation
To ensure that the camera works in the kiosk browser, we server the photobooth pages from a HTTPS connection with self-signed certificates. These are not included in this public repository.

To create the certificates:

    openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout cert/key.pem -out cert/cert.pem

Just hit enter to accept all of the defaults to the questions.

This will establish the two files you need--[key.pem & cert.pem]--for a self signed certificate, requiring no password, lasting for 10 years. 
