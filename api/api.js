import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import config from '../src/config';
import http from 'http';
import SocketIo from 'socket.io';
import request from 'request';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/fbhack';

const app = express();

const server = new http.Server(app);

const io = new SocketIo(server);
io.path('/ws');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(session({
  secret: 'react and redux rule!!!!',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));
app.use(bodyParser.json());

const bufferSize = 100;
const messageBuffer = new Array(bufferSize);
let messageIndex = 0;

if (config.apiPort) {
  const runnable = app.listen(config.apiPort, (err) => {
    if (err) {
      console.error(err);
    }
    console.info('----\n==> 🌎  API is running on port %s', config.apiPort);
    console.info('==> 💻  Send requests to http://%s:%s', config.apiHost, config.apiPort);
  });

  io.on('connection', (socket) => {
    socket.emit('news', {msg: `'Hello World!' from server`});

    socket.on('history', () => {
      for (let index = 0; index < bufferSize; index++) {
        const msgNo = (messageIndex + index) % bufferSize;
        const msg = messageBuffer[msgNo];
        if (msg) {
          socket.emit('msg', msg);
        }
      }
    });

    socket.on('msg', (data) => {
      data.id = messageIndex;
      messageBuffer[messageIndex % bufferSize] = data;
      messageIndex++;
      io.emit('msg', data);
    });
  });
  io.listen(runnable);
} else {
  console.error('==>     ERROR: No PORT environment variable has been specified');
}

// Fbhack

// Support

app.get('/bot', (req, res) => {
  const result = {
    verifyToken: process.env.VERIFY_TOKEN,
    accessToken: process.env.ACCESS_TOKEN
  };

  res.send(result);
});

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;

      console.log(`Successfully sent generic message with id ${messageId} to recipient ${recipientId}`);
    } else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
}

function sendTextMessage(recipientId, messageText) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'rift',
            subtitle: 'Next-generation virtual reality',
            item_url: 'https://www.oculus.com/en-us/rift/',
            image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
            buttons: [{
              type: 'web_url',
              url: 'https://www.oculus.com/en-us/rift/',
              title: 'Open Web URL'
            }, {
              type: 'postback',
              title: 'Call Postback',
              payload: 'Payload for first bubble',
            }],
          }, {
            title: 'touch',
            subtitle: 'Your Hands, Now in VR',
            item_url: 'https://www.oculus.com/en-us/touch/',
            image_url: 'http://messengerdemo.parseapp.com/img/touch.png',
            buttons: [{
              type: 'web_url',
              url: 'https://www.oculus.com/en-us/touch/',
              title: 'Open Web URL'
            }, {
              type: 'postback',
              title: 'Call Postback',
              payload: 'Payload for second bubble',
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendButtonMessage(recipientId) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'This is test text',
          buttons: [{
            type: 'web_url',
            url: 'https://www.oculus.com/en-us/rift/',
            title: 'Open Web URL'
          }, {
            type: 'postback',
            title: 'Trigger Postback',
            payload: 'DEVELOPED_DEFINED_PAYLOAD'
          }, {
            type: 'phone_number',
            title: 'Call Phone Number',
            payload: '+16505551234'
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendQuickReply(recipientId) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: `What's your favorite movie genre?`,
      metadata: 'DEVELOPER_DEFINED_METADATA',
      quick_replies: [
        {
          'content_type': 'text',
          'title': 'Action',
          'payload': 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION'
        },
        {
          'content_type': 'text',
          'title': 'Comedy',
          'payload': 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY'
        },
        {
          'content_type': 'text',
          'title': 'Drama',
          'payload': 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA'
        }
      ]
    }
  };

  callSendAPI(messageData);
}

function sendImageMessage(recipientId) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: 'http://i0.kym-cdn.com/photos/images/newsfeed/000/096/044/trollface.jpg'
        }
      }
    }
  };

  callSendAPI(messageData);
}

function receivedMessage(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const message = event.message;

  console.log(`Received message for user ${senderID} and page ${recipientID} at ${timeOfMessage} with message`);
  console.log(JSON.stringify(message));

  const isEcho = message.is_echo;
  const messageId = message.mid;
  const appId = message.app_id;
  const metadata = message.metadata;
  const messageText = message.text;
  const messageAttachments = message.attachments;
  const quickReply = message.quick_reply;

  if (isEcho) {
    console.log(`Received echo for message ${messageId} and app ${appId} with metadata ${metadata}`);
    return;
  } else if (quickReply) {
    const quickReplyPayload = quickReply.payload;
    console.log(`Quick reply for message ${messageId} with payload ${quickReplyPayload}`);

    sendTextMessage(senderID, `Quick reply tapped`);
    return;
  }

  if (messageText) {
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'quick':
        sendQuickReply(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received');
  }
}

function receivedPostback(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfPostback = event.timestamp;
  const payload = event.postback.payload;

  console.log(`Received postback for user ${senderID} and page ${recipientID} with payload ${payload}, ${timeOfPostback}`);

  sendTextMessage(senderID, 'Postback called');
}

function receivedMessageRead(event) {
  const watermark = event.read.watermark;
  const sequenceNumber = event.read.seq;

  console.log(`Received message read event for watermark ${watermark} and sequence number ${sequenceNumber}`);
}

function isPageLikedUser(fbPageId, fbUserId) {
  return new Promise((resolve, reject) => {
    const results = [];

    pg.connect(connectionString, (err, client) => {
      if (err) {
        reject();
        console.log(err);
        throw err;
      }

      const query = client.query(`SELECT COUNT(*) FROM "page_member" WHERE "fbPageId" = '${fbPageId}' AND "fbUserId" = '${fbUserId}'`);

      query.on('row', (row) => {
        results.push(row);
      });

      query.on('end', () => {
        resolve();
        if (results.length === 0 || results[0].count === 0) return false;
        return true;
      });
    });
  });
}


function formatReport(data) {
  console.log(data);
  return data;
}

// API

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach((pageEntry) => {
      pageEntry.messaging.forEach((messagingEvent) => {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else {
          console.log(`Webhook received unknown messagingEvent: ${messagingEvent}`);
        }
      });
    });

    res.sendStatus(200);
  }
});

app.get('/db', (req, res) => {
  const results = [];
  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query(`SELECT * FROM "test" ORDER BY id ASC;`);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/surveys/:surveyId/send/:fbUserId', (req, res) => {
  const surveyId = req.params.surveyId;
  const fbUserId = req.params.fbUserId;
  const results = [];

  let survey;

  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query(`SELECT * FROM "survey" WHERE "id" = ${surveyId} LIMIT 1;`);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      if (results.length === 0) return res.status(404).json({success: false, data: 'Not found'});
      survey = results[0];
      console.log(isPageLikedUser(survey.fbPageId, fbUserId));
      return res.send(isPageLikedUser(survey.fbPageId, fbUserId));
    });
  });
});

app.post('/surveys', (req, res) => {
  const {title, fbPageId, content} = req.body;

  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query(`INSERT INTO survey VALUES (DEFAULT, '${title}', '${fbPageId}', '${content}')`);

    query.on('end', () => {
      done();
      return res.status(200).json({success: true});
    });
  });
});

app.get('/surveys', (req, res) => {
  const results = [];
  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM survey');

    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.status(200).json({results});
    });
  });
});

app.get('/report', (req, res) => {
  const results = [];
  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM "survey"');

    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.status(200).json({results: formatReport(results)});
    });
  });
});
