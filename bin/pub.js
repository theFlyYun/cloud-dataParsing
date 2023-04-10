var Redis = require('ioredis');
var _ = require('lodash');
var config = require('./config'); // in current directory
var sub = new Redis(config.msgQueue.options);
var pub = new Redis(config.msgQueue.options);

console.log(process.argv);
var operation = process.argv[2] || config.operation;
var did = process.argv[3] || config.did;
var payload = (process.argv[4] && JSON.stringify(process.argv[4])) || config.payload;

if (!operation || !did || !payload) {
  throw new Error('parameters not enough');
}

var pubTopic = `$rlwio/devices/${did}/shadow/${operation}`;
var subTopic = [
  `$rlwio/devices/${did}/shadow/update/accepted`,
  `$rlwio/devices/${did}/shadow/update/rejected`,
  `$rlwio/devices/${did}/shadow/update/delta`,
  `$rlwio/devices/${did}/shadow/get/accepted`,
  `$rlwio/devices/${did}/shadow/get/rejected`,
];

payload = JSON.stringify(payload);

sub.psubscribe(subTopic, function (err, reply) {
  if (err) {
    console.log(err);
  }

});

sub.on('pmessage', function (pattern, channel, message) {
  var payload = JSON.parse(message);
  console.log('recv:', JSON.stringify({
    topic: channel,
    payload: payload,
  }, null, 2));
});

function pubHandler(data) {
  console.log('send:', JSON.stringify(JSON.parse(payload), null, 2));
}

for (var i = 0; i < config.concurrency; i++) {
  pub.publish(pubTopic, payload).then(pubHandler);
}
