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
server.listen(80);
app.get("/", function(req, res){
	res.render("index.html");
});

socket.sockets.on("connection", function(s){
	s.on("message", function(message){
		s.get("username", function(err, username){
			socket.sockets.emit("message", username, message);
		})
		
	});
	s.on("username", function(username){
		s.set("username", username);
		socket.sockets.emit("message", username + " joined the room!");
	})
});



