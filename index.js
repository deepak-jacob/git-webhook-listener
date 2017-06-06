const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const bufferEq = require('buffer-equal-constant-time');

const crypto = require('crypto');
const exec = require('child_process').exec;
const config = require('./config.json');

const app = express();
const port = 4008;

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({
  verify: function(req, res, buf, encoding) {
    const computedSig = new Buffer(signBlob(config.secret, buf));
    const sig = new Buffer(req.headers['x-hub-signature'] || '');
    if(!bufferEq(computedSig, sig)) {
      throw(new Error('X-Hub-Signature does not match'));
    }
  }
}))

app.post('/straightforwardmedia/githubhook', (req, res) => {
  callscript();
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end('{"ok":true}')
});

app.listen(port);
console.log(`Started on port ${port}`);

//helper functions
function callscript() {
  exec('../deploy.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

function signBlob(key, blob) {
  return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
}