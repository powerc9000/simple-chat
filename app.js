var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	socket = require("socket.io").listen(server),
	flash = require('connect-flash')
	RedisStore = require("connect-redis")(express),
	redis = require("redis"),
	client = redis.createClient();


app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.engine("html", require("ejs").renderFile);
	app.set("view options", {layout:false});
	app.use(express.static(__dirname + "/public"));
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.cookieParser("shh it's a secret!"));  
	app.use(express.session({store: new RedisStore()}));
	app.use(flash());
});
//test
server.listen(3000);
app.get("/", function(req, res){
	res.render("index.html");
});
(function(socket, client){
	var online = [];
	socket.sockets.on("connection", function(s){
		client.lrange("messages", 0,50, function(err, list){
			var li = [];
			list.forEach(function(l){
				li.push(JSON.parse(l));
			})
			s.emit("messages", li);
		});
		//s.emit("messages", )
		s.on("message", function(message){
			s.get("username", function(err, username){
				socket.sockets.emit("message", username, message);
				client.rpush("messages", JSON.stringify({"username":username, "message":message, time:(+new Date())}))
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
		s.on("newUsername", function(name){
			s.get("username", function(err, username){
				socket.sockets.emit("message", username + " changed their username to "+name);
				s.set("username", name);
				s.get("index", function(err, index){
					online[index] = name;
					socket.sockets.emit("online", online);
				});
			});
			
		});
	});
}(socket, client))




