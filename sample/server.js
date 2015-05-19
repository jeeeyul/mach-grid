var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.get('/', function(req, res){
	res.render('index');
});
app.use('/lib', express.static(path.join(__dirname, "../lib")));
app.use('/', express.static(path.join(__dirname, "views")));

var server = app.listen(3333, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
