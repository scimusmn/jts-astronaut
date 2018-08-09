var obtains = [
  'µ/google/authenticate.js',
  'googleapis',
];

var sheets = {};

obtain(obtains, (auth, google)=> {
  auth.whenReady((oauth)=> {
    sheets = google.sheets({ version: 'v4', auth: oauth });

    exports.createSheet = (opts, cb)=> {
      sheets.spreadsheets.create({
        resource: {
          properties: {
            title: opts.title,
          },
        },
      }, function (err, response) {
        if (err) {
          console.error(err);
          return;
        }

        // TODO: Change code below to process the `response` object:
        //console.log(JSON.stringify(response, null, 2));
        cb(response.data);
      });
    };

    exports.putData = function (ssID, dataRange, dataArray, cb) {
      sheets.spreadsheets.values.update({
        spreadsheetId: ssID,
        range: dataRange,
        valueInputOption: 'USER_ENTERED',
        resource: { range: dataRange,
            majorDimension: 'ROWS',
            values: dataArray, },
      }, function (err, resp)  {

        if (err) {
          console.log('Data Error :', err);
        }

        if (cb) cb(resp);

      });
    };

    exports.getData = function (ssID, dataRange, cb) {
      sheets.spreadsheets.values.get({
        spreadsheetId: ssID,
        range: dataRange,
      }, function (err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        cb(response.data);
      });
    };
  });
});
