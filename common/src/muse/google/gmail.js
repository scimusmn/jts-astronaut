var obtains = [
  'µ/google/authenticate.js',
  'googleapis',
  'nodemailer/lib/mail-composer',
];

var gmail = {};

obtain(obtains, (auth, google, MailComposer)=> {
  auth.whenReady((oauth)=> {
    gmail = google.gmail({ version: 'v1', auth: oauth });

    exports.listMessages = (opts, cb, errCB)=> {
      try {
        gmail.users.messages.list({
          userId: 'me',
          labelIds: opts.labels,
          q: opts.queryString,
        }, function (err, response) {
          if (err) {
            console.log('The API returned an error: ' + err);
            if (errCB) errCB();
            return;
          }

          cb(response.data);
        });
      } catch (e) {
        //console.log(e);
      }

    };

    exports.getMessage = function (msgId, cb) {
      gmail.users.messages.get({
        userId: 'me',
        id: msgId,
      }, function (err, resp) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        cb(resp.data);
      });
    };

    exports.sendMessage = function (opts, cb) {
      var mail = new MailComposer({
        from: opts.from, // sender address
        to: opts.to, // list of receivers
        subject: opts.subject, // Subject line
        text: opts.body, // plaintext body
      });

      mail.compile().build(function (err, message) {
        console.log(message.toString());
        var b64 = message.toString('base64');

        gmail.users.messages.send({
          userId: 'me',
          resource: {
            raw: b64,
          },
        }, function (err, response) {
          if (err) {
            console.log('The API returned an error: ' + err);
            return;
          }

          if (cb) cb(response);
        });
      });
    };

    exports.getAttachment = function (msgId, attachmentId, cb) {
      gmail.users.messages.attachments.get({
        userId: 'me',
        id: attachmentId,
        messageId: msgId,
      }, function (err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        cb(response.data);
      });
    };

    exports.editLabels = function (msgId, labelsToAdd, labelsToRemove, cb) {
      gmail.users.messages.modify({
        userId: 'me',
        id: msgId,
        resource: {
          addLabelIds: labelsToAdd,
          removeLabelIds: labelsToRemove,
        },
      }, function (err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        if (cb) cb(response.data);
      });
    };
  });
});
