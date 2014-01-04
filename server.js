var express = require('express')
var app = express()
var connect = require('connect')
var path = require('path')
var http = require('http'),
    httpProxy = require('http-proxy');

app.use(express.logger())
app.use(express.static(__dirname + '/public'))
// app.use(express.bodyParser())
app.use(express.methodOverride())

app.configure(function() {
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
})

app.get('/', function(req, resp) {
  resp.render('index')
})

var proxy = new httpProxy.HttpProxy({ 
  target: {
    port: 80,
    host: 'giftmeapp.cloudapp.net'
  }
});

// I would like to do a proxy request from local server to public GiftMe app
app.all('/api/*', function(req, resp){
    proxy.proxyRequest(req, resp)
})

var port = process.env.PORT || 3000
app.listen(port)
console.log('Listening on port ' + port)