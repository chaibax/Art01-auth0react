require('dotenv').config();
var auth0 = require('./auth0');
var express = require('express');
var path = require('path');
var bodyParser = require("body-parser");
const helmet = require('helmet')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pixelsRouter = require('./routes/pixels');
var eventstore = require('eventstore');
var debug = require('debug')('api');



var app = express();
app.use(cors(corsOptions));

// Define an endpoint that must be called with an access token
app.get("/api/external", auth0.checkJwt, (req, res) => {
  res.send({
    msg: "Your Access Token was successfully validated!"
  });
});



var es = eventstore();


var es = require('eventstore')({
  type: 'mongodb', // ca marche avec inMemory
  url: process.env.MONGODB_URI,                        // optional
  eventsCollectionName: 'events',                // optional
  snapshotsCollectionName: 'snapshots',          // optional
  transactionsCollectionName: 'transactions',    // optional
  positionsCollectionName: 'positions'

});

es.init(function (err) {
  es.defineEventMappings({
    id: 'id',
    commitId: 'commitId',
    commitSequence: 'commitSequence',
    commitStamp: 'commitStamp',
    streamRevision: 'streamRevision'
  });


  es.on('connect', function () {
    debug('storage connected');
  });

  es.on('disconnect', function () {
    debug('connection to storage is gone');
  });


  es.getEventStream('pixels', function (err, stream) {
    stream.addEvent({ my: 'event' });
    stream.addEvents([{ my: 'event2' }]);
    stream.commit(function (err, stream) {
     // console.log(stream.eventsToDispatch); // this is an array containing all added events in this commit.
    });


  });

});

// Set up a whitelist and check against it:
var whitelist = ['http://localhost:3000', 'http://localhost', 'https://art0x.herokuapp.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}


app.use(logger('dev'));
app.use(helmet());


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/users', usersRouter);
app.use('/api/pixels', pixelsRouter);
 
module.exports = app;


