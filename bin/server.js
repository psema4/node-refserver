#!/usr/bin/env node

var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , express = require('express')
  , app = express()
  , util = require('util')
  , config = require('../config')
  , httpPort = config.ports && config.ports.http || 8080
  , httpsPort = config.ports && config.ports.https || 8443
  , api = require('../lib/api')
  , statusCodes = require('../lib/statusCodes')
  , sslOptions = (!config.ssl) ? {} : {
        cert: fs.readFileSync(config.ssl.certFilename)
      , key: fs.readFileSync(config.ssl.keyFilename)
      , ca: fs.readFileSync(config.ssl.caFilename)
    }
  , accessToken = config.accessToken
  , users = []
;


// autoparse json payloads 
app.use(express.json());


// use pug (jade) views
app.set('views', __dirname + '/../views');
app.set('view engine', 'pug');


// Logging
app.use(function(req, res, next) {
    var dt = getTime()
      , requestMethod = req.method
      , requestURI = req.url
    ;

    console.log('%s %s', dt, requestMethod, requestURI)
    next();
});

// Static Files
app.use(express.static(__dirname + '/../public'));


// Public Endpoints
app.get('/', function(req, res, next) {
    res.render('app', { siteName: config.siteName, title: config.siteName, message: 'Will be back soon.' });
});

app.get('/throw', function(req, res, next) {
    res.status(500);
    next(new Error("Intentionally Thrown Error"));
});

app.get('/render', function(req, res, next) {
    res.render('error', { siteName: config.siteName, title: config.siteName, message: 'This is an api rendered endpoint.' });
});


// Auhtorized Endpoints
app.get('/all', authCheck, api.getAll);


// Error Handling
app.use(notFound)
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)


// Launch Server
if (config.ssl) {
    var server = https.createServer(sslOptions, app).listen(httpsPort);
    console.log('Listening on port %s with SSL and Web Socket support.', httpsPort);
    io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        var connectedAt = getTime()
          , user = socket.id
        ;

        users.push(user);
        console.log('%s user %s connected', connectedAt, user);

        socket.join('lobby', function() {
            var dt = getTime()
              , rooms = Object.keys(socket.rooms)
            ;


            console.log('%s user %s rooms: %s', dt, user, util.inspect(rooms));
            io.to('lobby').emit('user_join', user);
        });

        socket.on('disconnect', function() {
            var dt = getTime();

            console.log('%s user %s disconnected', dt, user);
            io.to('lobby').emit('user_leave', user);
            users = users.filter(function(u) { return u !== user; });
        });

        socket.on('user_list', function(data, fn) {
            fn(JSON.stringify(users));
        });
    });

    // Start an http server, redirect all traffic to the secure server
    http.createServer(function(req, res) {
        res.writeHead(302, {'Location': 'https://' + config.siteDomain + req.url});
        res.end();
    }).listen(httpPort);

} else {
    app.listen(httpPort, function() {
        console.log('Listening on port %s without SSL or Web Socket support.', httpPort);
    });
}


// Utility
function getTime() {
    return new Date().toLocaleString();
}

function authCheck(req, res, next) {
    var reqAuth = req.headers.authorization;

    if (!reqAuth || reqAuth !== config.accessToken) {
        res.statusCode = 401;
        next(new Error('Not Authorized'));

    } else {
        next();
    }
}

function notFound(req, res, next) {
    res.statusCode = 404;
    res.render('error', { siteName: config.siteName, title: statusCodes[res.statusCode], message: statusCodes[res.statusCode] });
}

function logErrors(err, req, res, next) {
    console.error(req.originalUrl, res.statusCode, err.stack);
    next(err);
}

function clientErrorHandler (err, req, res, next) {
    if (req.xhr) {
        if (! res.statusCode)
            res.statusCode = 500;

        if (! res.headersSent)
            res.status(res.statusCode);
   
        res.send({ error: statusCodes[res.statusCode] });

    } else {
        next(err)
    }
}

function errorHandler (err, req, res, next) {
    if (! res.statusCode)
        res.statusCode = 500;

    if (! res.headersSent)
        res.status(res.statusCode);
   
    res.render('error', { siteName: config.siteName, title: statusCodes[res.statusCode], message: statusCodes[res.statusCode] });
}
