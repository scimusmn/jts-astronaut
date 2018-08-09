var obtains = [
  'µ/google/drive.js',
  'µ/google/sheets.js',
  'µ/google/gmail.js',
  'µ/google/authenticate.js',
];

obtain(obtains, (drive, sheets, gmail, auth)=> {
  console.log(drive);
  exports.auth = auth;
  exports.drive = drive;
  exports.sheets = sheets;
  exports.gmail = gmail;
});
