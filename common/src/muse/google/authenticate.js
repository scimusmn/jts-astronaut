var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library').OAuth2Client;

// If modifying these scopes, delete your previously saved credentials
var SCOPES = ['https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/gmail.modify',
              'https://www.googleapis.com/auth/spreadsheets',
             ];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials';
var TOKEN_PATH = `${TOKEN_DIR}/drive+sheets+gmail.json`;

var oauth2Client = null;

if (!window) var window = global;

var authCB = [];

exports.whenReady = (cb)=> {
  if (window.google && window.google.auth) {
    cb(window.google.auth);
  } else {
    authCB.push(cb);
  }
};

if (!window.google) {
  window.google = {};

  // Load client secrets from a local file.
  fs.readFile(`${TOKEN_DIR}/client_secret.json`, (err, content)=> {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }

    console.log('Begin authorization');
    authorize(JSON.parse(content), function (auth) {
      console.log('Authorized');
      window.google.auth = auth;
      authCB.forEach(cb=>cb(auth));
    });

  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    oauth2Client = new googleAuth(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', function (code) {
      rl.close();
      oauth2Client.getToken(code, function (err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }

        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }
}
