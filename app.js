
/**
 * Module dependencies.
 */

var url = require('url');
var sio = require('socket.io');
var mongoose = require('mongoose');
var logger = require('logger').createLogger();
var _date = require('underscore.date');
var express = require('express');
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Init
logger.setLevel('info');
// mongodb
var db;
mongoose.connect('mongodb://localhost/counterdb');
var Schema = mongoose.Schema;
var CounterSchema = new Schema({
  ymd: String,
  word: String,
  count: Number
});
mongoose.model('Counter', CounterSchema);
var Counter = mongoose.model('Counter');


// Routes
app.get('/', function (req, res) {
    res.render('index');
});

// Start
var io = sio.listen(app);
io.set('transports', ['xhr-polling']);
io.set('log level', 2);
io.sockets.on('connection', function (socket) {
    logger.debug("connection1..........");
});
// mongodbから定期的にデータ取得して全クライアントにプッシュ
setInterval(function() {
    check_interval = true;
    logger.debug('setInterval...');
    try {
        var _ymd = _date().format("YYYY-MM-DD");
        // Counterスキーマ取得
        Counter.find({ 'ymd' : _ymd }).sort('count', -1).limit(50).run(function(err, docs) {
            logger.debug("get counter...");
            if(!err) {
                var message = JSON.stringify(docs);
                //socket.send(message);
                //socket.broadcast(message);
                io.sockets.emit('mongo_response', message);
            }
        });
    } catch (e) {
        logger.error(e);
        callback(null);
    }
} , 3000);

// listener
app.listen(process.env.PORT || 3010, function () {
    logger.debug("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
