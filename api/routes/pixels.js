var express = require('express');
var router = express.Router();
var auth1 = require('../auth0');
var eventstore = require('eventstore');
var debug = require('debug')('api');

//pour pourvoir maj la metadata auth0  de l'user avec le numero de pixel 
var ManagementClient = require('auth0').ManagementClient;

var auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET  
}); 


const mongoose = require('mongoose'), Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true });
var Events = mongoose.model('Events', new Schema(), 'events');

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

});

es.on('connect', function () {
  console.log('storage connected');
});

es.on('disconnect', function () {
  console.log('connection to storage is gone');
});
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
  debug(' GET calling with req.ID=');
  debug(req.query.pixel);

});

/* GET last pixel added. */
router.all('/last', function (req, res, next) {
  es.getLastEvent('pixels', function (err, evt) {
    evt_to_send = { "position": evt.position, "commitStamp": evt.commitStamp, "eventId": evt.id, "pixel": evt.payload[0].pixel };
    res.send(evt_to_send);
  });
});

/* GET  pixels count */
router.all('/count', function (req, res, next) {

  es.getLastEvent('pixels', function (err, evt) {
    evt_to_send = { "count": evt.position };
    res.send(evt_to_send);
    console.log('test=');
    //console.log(es.store);
  });
});


//router.post('/add', auth0.checkJwt, function (req, res, next) {


router.post('/add', auth1.checkJwt, function (req, res, next) {

  let event = [{ pixel: req.body.pixel }, { email: req.body.email }, { auth0Id: req.body.auth0Id }];
  Events.countDocuments({ 'payload.email': req.body.email }, function (err, count) {
    if (count > 0) {
      console.log('il exsite deja ' + count + ' pixel avec cet email');
      res.send('le pixel a DEJA été ajouté par : ' + req.body.email);
    } else {
      console.log('il exsite ' + count + ' pixel avec cet email');
      es.getEventStream('pixels', function (err, stream) {
        //verification que l'user n'a pas déjà deposé un pixel dans le store. Si non : 
        stream.addEvent(event);
        stream.commit(function (err, stream) {
          console.log(stream.eventsToDispatch); // this is an array containing all added events in this commit.
          var position = stream.eventsToDispatch[0]['position']; // N° de pixel 
          //var id_event = stream.eventsToDispatch[0]['id']; // Identidiant de l'event 
          res.send('le pixel a bien été ajouté: ' + req.body.pixel + req.body.email + req.body.auth0Id + ' a la position :' + position);
          //enregistrer la position dans les metadata Auth0 de l'user 



  //  console.log(users[0]);
  //console.log(users[0].user_id);
    var params = { id: req.body.auth0Id };
    var metadata = {
    pixel_added: 1,
    pixel_position: position
    
  };
  auth0.updateUserMetadata(params, metadata, function (err, user) {
    if (err) {
      // Handle error.
    }
    // Updated user.
  });
    


        });
      });
    }
  });
});

module.exports = router;
