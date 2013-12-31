var express = require('express')
var app = express()
var connect = require('connect')
var path = require('path')

app.use(express.logger())
app.use(express.static(__dirname + '/public'))
app.use(express.bodyParser())
app.use(express.methodOverride())

app.configure(function() {
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
})

app.get('/', function(req, resp) {
  resp.render('index')
})

var port = process.env.PORT || 3000
app.listen(port)
console.log('Listening on port ' + port)