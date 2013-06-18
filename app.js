var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	socket = require("socket.io").listen(server),
	flash = require('connect-flash');


app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.engine("html", require("ejs").renderFile);
	app.set("view options", {layout:false});
	app.use(express.static(__dirname + "/public"));
	app.use(express.favicon());
	app.use(express.bodyParser());

	// app.use(express.cookieParser(config.sessionSecret));  
	// app.use(express.session({store: new RedisStore()}));
	app.use(flash());
});
//test
server.listen(3000);
app.get("/", function(req, res){
	res.render("index.html");
});
var online = [];
socket.sockets.on("connection", function(s){

	s.on("message", function(message){
		s.get("username", function(err, username){
			socket.sockets.emit("message", username, message);
		})//commentcomment
		
	});
	s.on("username", function(username){
		var idx = online.push(username) -1;
		s.set("username", username);
		socket.sockets.emit("message", username + " joined the room!");
		s.set("index", idx);
		socket.sockets.emit("online", online);
	});
	s.on("disconnect", function(){
		s.get("index", function(err, index){
			s.get("username", function(err, username){
				online.splice(index, 1);
				socket.sockets.emit("online", online);
				socket.sockets.emit("message", username + " left the room!");
			})
		})
		
	});
});



