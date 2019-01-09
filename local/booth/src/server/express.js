var obtains = [
  'express',
  'body-parser',
  'fs',
  'express-fileupload',
];

obtain(obtains, (express, bodyParser, fs, fileUpload)=> {
  var fileServer = express();
  var router = express.Router();

  router.use(bodyParser.json());
  router.use(fileUpload());

  fileServer.use('', express.static('./client'));
  fileServer.use('/common', express.static('./common'));

  fileServer.start = ()=> {
    fileServer.use(router);
    fileServer.listen(80, function () {
      console.log('listening on 80');
    });
  };

  exports.fileServer = fileServer;
  exports.router = router;
  exports.express = express;
});
