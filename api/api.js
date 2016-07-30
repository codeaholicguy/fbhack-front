import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import config from '../src/config';
import http from 'http';
import SocketIo from 'socket.io';
import request from 'request';
import pg from 'pg';
import _ from 'lodash';

Promise.all(pg);

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/fbhack';

const app = express();

const server = new http.Server(app);

const io = new SocketIo(server);
const cached = {};
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

function callSendAPI(messageData, accessToken) {
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

function sendTextMessage(question, senderID) {
  const messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: question.title
    }
  };
  return callSendAPI(messageData);
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

function sendQuickReply(question, senderID) {
  const messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: question.title,
      quick_replies: []
    }
  };

  question.options.forEach((option) => {
    messageData.message.quick_replies.push({
      'content_type': 'text',
      'title': option.title,
      'payload': `${question.title}.${option.title}`
    });
  });
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

function getPGconnection() {
  return pg.connect(connectionString);
}

function getSuryveyQuestion(targetSurvey, targetUser) {
  cached[targetUser.fbUserId] = cached[targetUser.fbUserId] || {};
  const currentStep = cached[targetUser.fbUserId][targetSurvey.id];
  if (_.isEmpty(currentStep)) {
    const question = targetSurvey.questions[0];
    cached[targetUser.fbUserId][targetSurvey.id] = {
      survey: targetSurvey,
      index: 0
    };
    return question;
  }
  if (!_.isEmpty(currentStep.branch)) {
    const targetBranch = _.find(targetSurvey.branches, {title: currentStep.branch});
    const question = targetBranch.questions[currentStep.index + 1];
    if (!_.isEmpty(question)) {
      cached[targetUser.fbUserId][targetSurvey.id] = {
        ...currentStep,
        index: currentStep.index + 1
      };
      return question;
    }
    cached[targetUser.fbUserId][targetSurvey.id] = {
      survey: targetSurvey,
      index: targetBranch.rootIndex + 1
    };
    return targetSurvey.questions[targetBranch.rootIndex + 1];
  }
  const question = targetSurvey.questions[currentStep.index + 1];
  cached[targetUser.fbUserId][targetSurvey.id] = {
    survey: targetSurvey,
    index: currentStep.index + 1
  };
  return question;
}

function sendSurveyMessage(surveyId) {
  let targetSurvey;
  let targetUser;
  return new Promise((resolve, reject) => {
    getPGconnection().then((client) => {
      console.log(`SELECT * FROM "survey" WHERE "id"  = ${surveyId};`);
      return client.query(`SELECT * FROM "survey" WHERE "id"  = ${surveyId};`)
      .then((result) => {
        targetSurvey = result.rows[0].content;
        targetSurvey.id = result.rows[0].id;
        targetSurvey.title = result.rows[0].title;
        targetSurvey.fbPageId = result.rows[0].fbPageId;
        return client.query(`SELECT * FROM "page_member" WHERE "fbPageId" = '${result.rows[0].fbPageId}';`);
      });
    })
    .then((result) => {
      targetUser = result.rows[0];
      return targetUser;
    })
    .then(() => {
      const question = getSuryveyQuestion(targetSurvey, targetUser);
      console.log(question, cached[targetUser.fbUserId]);
      if (!question) return resolve(true);
      if (question.type === 'text') {
        return sendTextMessage(question, targetUser.fbUserId);
      } else {
        return sendQuickReply(question, targetUser.fbUserId);
      }
    })
    .catch((err) => {
      console.log(err);
      reject(err);
    });
  });
}

function isChatted(fbPageId, fbUserId) {
  return new Promise((resolve, reject) => {
    pg.connect(connectionString).then((client) => {
      client.query(`SELECT COUNT(*) FROM "page_member" WHERE "fbPageId" = '${fbPageId}' AND "fbUserId" = '${fbUserId}';`).then((result) => {
        console.log('isChatted', result.rows[0].count);
        if (result.rows[0].count === '0') return resolve(false);
        return resolve(true);
      });
    }).catch((err) => {
      console.log(err);
      reject(err);
    });
  });
}

function receivedPostback(event) {
  const cachedSurveyId = _.first(_.keys(cached[event.sender.id]));
  const cachedProcess = cached[event.sender.id][cachedSurveyId];
  if (!_.isEmpty(cachedProcess.branch)) {
    console.log('sendSurveyMessage', 'in branch');
    return sendSurveyMessage(cachedSurveyId);
  } else {
    const branch = _.find(cachedProcess.survey.branches, {title: event.message.quick_reply.payload});
    console.log('sendSurveyMessage', 'no branch', branch, cachedProcess.survey.branches, event.message.quick_reply.payload);
    if (_.isEmpty(branch)) {
      return sendSurveyMessage(cachedSurveyId);
    }
    else {
      console.log('normal');
      cached[event.sender.id][cachedSurveyId] = {
        branch: event.message.quick_reply.payload,
        index: 0
      };
      const question = _.first(branch.questions);
      if (question.type === 'text') return sendTextMessage(question, event.sender.id);
      return sendQuickReply(question, event.sender.id);
    }
  }
}


function receivedMessage(event) {
  if (!_.isEmpty(event.message) && !_.isEmpty(event.message.quick_reply) && !_.isEmpty(event.message.quick_reply.payload)) {
    return receivedPostback(event);
  }
  const cachedSurveyId = _.first(_.keys(cached[event.sender.id]));
  return sendSurveyMessage(cachedSurveyId);
}

function receivedMessageRead(event) {
  const watermark = event.read.watermark;
  const sequenceNumber = event.read.seq;

  console.log(`Received message read event for watermark ${watermark} and sequence number ${sequenceNumber}`);
}

<<<<<<< HEAD
=======
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

>>>>>>> c7cedfcb7112ed72295cf76d1509a05b262d2500
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
        if (messagingEvent.message && !messagingEvent.message.is_echo) {
          console.log('a');
          receivedMessage(messagingEvent, '262174670835679');
        } else if (messagingEvent.postback) {
          console.log('b');
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

  pg.connect(connectionString).then((client) => {
    client.query(`SELECT * FROM "survey" WHERE "id" = ${surveyId} LIMIT 1;`).then((surveyResult) => {
      console.log('surveyResult', surveyResult);
      if (surveyResult.rowCount === 0) return res.status(404).json({success: false, data: 'Survey not found'});
      const survey = surveyResult.rows[0];

      isChatted(survey.fbPageId, fbUserId).then((chattedResult) => {
        console.log('chattedResult', chattedResult);
        if (!chattedResult) return res.status(404).json({success: false, data: 'User havent chat with the bot yet'});

        client.query(`SELECT * FROM "page" WHERE "fbPageId" = '${survey.fbPageId}' LIMIT 1;`).then((pageResult) => {
          console.log('pageResult', pageResult);
          if (pageResult.rowCount === 0) return res.status(404).json({success: false, data: 'Page not found'});
          const page = pageResult.rows[0];

          client.query(`SELECT * FROM "answer" WHERE "surveyId" = ${surveyId} AND "fbUserId" = '${fbUserId}' LIMIT 1;`).then((answerResult) => {
            console.log('answerResult', answerResult);
            if (answerResult.rowCount === 0) {
              console.log('insertAnswerResult');
              client.query(`INSERT INTO "answer" VALUES ('${fbUserId}', ${surveyId}, '${survey.content}', '0');`).then(() => {
                const question = survey.content.questions[0];
                console.log(question);
                if (question.type === 'multiple') {
                  const messageData = {
                    recipient: {
                      id: fbUserId
                    },
                    message: {
                      text: question.title,
                      quick_replies: []
                    }
                  };

                  question.options.forEach((option) => {
                    messageData.message.quick_replies.push({
                      'content_type': 'text',
                      'title': option.title,
                      'payload': `${surveyId}-0`
                    });
                  });

                  console.log('sendQuickReply', messageData);
                  sendQuickReply(messageData);
                  return res.status(200).json({success: true});
                }
              });
            }
          });
        });
      });
    });
  }).catch((err) => {
    console.err(err);
    return res.status(500).json({success: false, data: err});
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

app.get('/send/:surveyId', (req, res) => {
  const {surveyId} = req.params;

app.get('/latestAnswer', (req, res) => {
  const results = [];
  pg.connect(connectionString, (err, client, done) => {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM "answer"');

    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.status(200).json({results: formatReport(results)});
    });
  });
});
