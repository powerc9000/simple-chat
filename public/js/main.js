var socket = io.connect();
			(function(socket){
				var form = document.getElementById("messageform");
				var usernameForm = document.getElementById("username");
				var focused = true;
				var missMessage = 0;
				var alert = new Audio();
				var playSound = document.getElementById("notifySound");
				var username = localStorage.getItem("chatUsername");
				var commands = {
					username:changeUsername
				};
				if(username){
					document.getElementsByClassName("chatArea")[0].style.display = "block";
					document.getElementsByClassName("username")[0].style.display = "none";
					socket.emit("username", username);
				}
				alert.src = "/sound/alert.mp3";
				usernameForm.addEventListener("submit", setUsername, false);
				form.addEventListener("submit", sendMessage, false);
				window.addEventListener("focus", onfocus);
				window.addEventListener("blur", onblur);

				socket.on("message", handleMessage);
				socket.on("online", usersOnline);
				socket.on("messages", handleArchive);
				socket.on("image", handleImage);
				socket.on("connect", connect);
				socket.on("username in use", usernameConflict);

				function connect(){
					if(username){
						socket.emit("username", username);
					}
				}

				function usernameConflict(username){
					appendMessage("Username is in use already");
					localStorage.setItem("chatUsername", username);
				}

				function handleArchive(messages){
					for(var i=messages.length-1; i>=0; i--){
						if(messages[i].message){
							appendMessage(messages[i].username, messages[i].message);
						}
						else if(messages[i].image){
							handleImage(messages[i].username, messages[i].image);
						}
					}
				}

				function handleMessage(username, message){
					var title;

					if(!focused){
						missMessage++;
						title = window.document.title;
						window.document.title = "("+missMessage+") Chat!";
						if(playSound.checked){
							alert.pause();
							alert.currentTime = 0;
							alert.play();
						}
					}
					appendMessage(username, message);
				}
				function handleImage(username, img){
					var box = document.getElementById("messagebox"),
						image = createElement("<img>"),
						messagearea = createElement("<p class='message'></p>");
						messagearea.textContent = username + ": ";
						image.src = img;
						messagearea.style.visibility = "hidden";
						messagearea = box.appendChild(messagearea);
						image.style.visibility = "hidden";
						image = box.appendChild(image);
						
						setTimeout(function(){
							scrollbot();
							image.style.visibility = "visible";
							messagearea.style.visibility = "visible";
						}, 0);
				}
				function appendMessage(username, message){
					var box = document.getElementById("messagebox"),
						messagearea = createElement("<p class='message'></p>");
					if(message){
						messagearea.textContent = username + ": " + message;
						
					}
					else{
						messagearea.textContent = username;
						messagearea.classList.add('system-message');

					}
					
					messagearea.style.visibility = "hidden";
					messagearea = box.appendChild(messagearea);
					setTimeout(function(){
						scrollbot();
						messagearea.style.visibility = "visible";
					}, 0);
				}
				function sendMessage(e){
					var message = form.message.value;
					var command;
					var args;
					if(message[0] === "/"){
						command = message.substr(1, message.indexOf(" ")-1);
						args = message.substr(message.indexOf(" ")+1);
						doCommand(command, args);
					}
					else{
						socket.emit("message", message);
					}
					
					form.message.value = "";
					e.preventDefault();
				}

				function setUsername(e){
					var chat = document.getElementsByClassName("chatArea")[0];
					var formContain = document.getElementsByClassName("username")[0];
					chat.style.display = "block";
					formContain.style.display = "none";
					socket.emit("username", usernameForm.username.value);
					localStorage.setItem("chatUsername", usernameForm.username.value);
					e.preventDefault();
				}

				function createElement(text){
					var holder = document.createElement("div"),
					frag = document.createDocumentFragment();
					holder.innerHTML = text;
					while(holder.firstChild){
						frag.appendChild(holder.firstChild);
					}
					return frag.firstChild;
				}

				function scrollbot(){
					var d = document.getElementById('messagebox');

					if(d.scrollHeight > d.clientHeight) {
					d.scrollTop = d.scrollHeight - d.clientHeight;
					}
				}

				function usersOnline(users){
					var list = document.getElementsByClassName("online")[0];
					list.innerHTML = "";
					for(var i in users.online){
						if(users.online.hasOwnProperty(i)){
							var item = createElement("<li></li>");
							item.textContent = i;
							list.appendChild(item);
						}
					}
				}

				function onfocus(){
					focused = true;
					window.document.title = "Chat!";
					missMessage = 0;
				}

				function onblur(){
					focused = false;
				}

				function doCommand(command, args){
					if(commands[command]){
						commands[command].apply(null, args.split(" "));
					}
				}

				function changeUsername(username){
					socket.emit("newUsername", username);
					localStorage.setItem("chatUsername", username);
				}
			}(socket));


			(function(socket){
				var canvas = document.getElementById("canvas");
				var save = document.getElementById("save");
				var ctx = canvas.getContext("2d");
				var mousedown = false;
				var colors = document.getElementsByClassName("colors")[0].children;
				var color = "black";
				var clear = document.getElementById("clear");
				var shift = false;
				var click = {};
				clear.addEventListener("click", function(){
					var c = confirm("really clear?");
					if(c){
							ctx.clearRect(0,0,canvas.width,canvas.height);	
					}
				});
				window.addEventListener("keydown", function(e){
				shift = (e.keyCode == 16); 
					console.log(shift);
				});
				window.addEventListener("keyup", function(e){
					if(e.keyCode == 16){
						shift = false;	
					}
				});
				save.addEventListener("click", function(){
					socket.emit("image", canvas.toDataURL("img/png"));
					ctx.clearRect(0,0,canvas.width,canvas.height);	
				});
				[].forEach.call(colors, function(c){
					c.addEventListener("click", function(e){

						removeBorders();
						c.style.border = "3px black solid";
						
						color = c.style["background-color"];
						
					});
				});
				canvas.width = 250;
				canvas.height = 250;
				previous = {};
				canvas.onmousedown = function(e){
					click.x = e.offsetX;
					click.y = e.offsetY;
					mousedown = true;	
					return false;
				};
				canvas.onmouseup = function(e){
					mousedown = false;
					return false;
				};
				canvas.onmousemove = function(e){
				
					
					if(mousedown){
						if(previous.x && previous.y){
								ctx.strokeStyle = color;
								ctx.lineWidth = 2;
								ctx.beginPath();
								ctx.moveTo(previous.x, previous.y);
								ctx.lineTo(e.offsetX, e.offsetY);
								ctx.stroke();	
						}
						if(!shift){
								previous.x = e.offsetX;
								previous.y = e.offsetY;
						}
						else{
								previous.x = click.x;
								previous.y = click.y;
						}
						
					}
					else{
						previous.x = false;
						previous.y = false;
					}
						
					
					
					return false;
				};
				function removeBorders(){
					[].forEach.call(colors, function(c){
						c.style.border = "1px black solid";
					});
				}
			}(socket));