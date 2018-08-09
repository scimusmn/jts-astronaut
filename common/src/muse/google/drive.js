var obtains = [
  'µ/google/authenticate.js',
  'googleapis',
];

var drive = {};

obtain(obtains, (auth, google)=> {
  auth.whenReady((oauth)=> {
    drive = google.drive({ version: 'v3', auth: oauth });

    exports.createFolder = (opts, cb)=> {
      var fileMetadata = {
        name: opts.name,
        mimeType: 'application/vnd.google-apps.folder',
      };
      drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      }, function (err, file) {
        if (err) console.error(err);
        else cb(file);
      });
    };

    exports.moveFile = (opts, cb)=> {
      drive.files.get({
        fileId: opts.fileId,
        fields: 'parents',
      }, (err, file)=> {
        if (err) console.error(err);
        else {
          var previousParents = '';
          if (file.parents) previousParents = file.parents.join(',');
          drive.files.update({
            fileId: opts.fileId,
            addParents: opts.parentId,
            removeParents: previousParents,
            fields: 'id, parents',
          }, function (err, file) {
            if (err) console.error(err);
            else cb();
          });
        }
      });
    };

    exports.listFiles = function (prm, cb) {
      if (!prm.pageToken) prm.pageToken = '';
      if (!prm.orderBy) prm.orderBy = 'name desc';
      if (!prm.pageSize) prm.pageSize = 10;
      if (!prm.fields) prm.fields = 'nextPageToken, files(id, name, webContentLink, fileExtension, description, thumbnailLink)';
      if (!prm.queryString) prm.queryString = '';

      if (prm.parentId) {
        if (prm.queryString.length) prm.queryString += ' and ';
        prm.queryString += `'${prm.parentId}' in parents`;
        console.log(prm.queryString);
      }

      drive.files.list({
        pageSize: prm.pageSize,
        fields: prm.fields,
        pageToken: prm.pageToken,
        orderBy: prm.orderBy,
        q: prm.queryString,
      }, function (err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        cb(response.data.files);
      });

    };

    exports.uploadFile = function (params, cb) {
      var fileMetadata = {
        name: params.title,
        parents: params.parents,
        description: params.description,
      };
      var media = {
        mimeType: params.type,
        body: params.data,
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      }, function (err, file) {
        if (err) {
          // Handle error
          console.log(err);
        } else {
          console.log('File Id: ', file.id);

          cb(file);
        }
      });
    };
  });
});
