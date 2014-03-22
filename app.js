var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	socket = require("socket.io").listen(server, {"log level": 2}),
	flash = require('connect-flash');
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
	app.use(express.cookieParser(process.env.COOKIE_KEY || "shh it's a secret!"));  
	app.use(express.session({store: new RedisStore()}));
	app.use(flash());
});
//test
server.listen(3000);
app.get("/", function(req, res){
	res.render("index.html");
});
(function(socket, client){
	var online = {};
	var privateOnline = {};
	socket.sockets.on("connection", function(s){
		s.set("index", online.length);
		client.lrange("messages", 0, 50, function(err, list){
			var li = [];
			list.forEach(function(l){
				li.push(JSON.parse(l));
			});
			s.emit("messages", li);
		});
		
		//s.emit("messages", )
		s.on("message", function(message){
			s.get("username", function(err, username){
				socket.sockets.emit("message", username, message);
				client.lpush("messages", JSON.stringify({"username":username, "message":message, time:(+new Date())}));
			});//commentcomment
			
		});
		s.on("image", function(image){
			s.get("username", function(err, username){
				socket.sockets.emit("image", username, image);
				client.lpush("messages", JSON.stringify({"username":username, "image":image, time:(+new Date())}));
			});
		});
		s.on("username", function(username){
			if(online[username] && privateOnline[username] !== s.id){
				username += "(1)";
				s.emit("username in use", username);
			}else if(!online[username]){
				socket.sockets.emit("message", username + " joined the room!");
			}
			online[username] = username;
			privateOnline[username] = s.id;
			s.set("username", username);
			
			socket.sockets.emit("online", online);
		});
		s.on("disconnect", function(){
			s.get("username", function(err, username){
				if(username){
					delete online[username];
					delete privateOnline[username];
					socket.sockets.emit("online", online);
					socket.sockets.emit("message", username + " left the room!");
				}
			});
			
			
		});
		s.on("newUsername", function(name){
			s.get("username", function(err, username){
				if(online[name] && name !== username){
					s.emit("username in use", username);
				}else{
					socket.sockets.emit("message", username + " changed their username to "+name);
					s.set("username", name);
					delete online[username];
					delete privateOnline[username];
					online[name] = true;
					privateOnline[name] = s.id;
					socket.sockets.emit("online", online);
				}
				
				
			});
			
		});
	});
}(socket, client));




