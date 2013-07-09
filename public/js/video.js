(function(socket){
	var sharing = false;
	var video = document.querySelector('video');
	var canvas = document.getElementById('videoCanvas');
	var button = document.getElementById("shareVideo");
	var ctx = canvas.getContext("2d");
	var buffer = [];
	video.width = 200;
	video.style.visibility = "hidden";
	video.style.position = "absolute"
	navigator.getMedia = ( navigator.getUserMedia ||
	                       navigator.webkitGetUserMedia ||
	                       navigator.mozGetUserMedia ||
	                       navigator.msGetUserMedia);
	function init(){
		navigator.getMedia (

		   // constraints
		   {
		      video: true,
		      audio: true
		   },

		   // successCallback
		   function(localMediaStream) {
		      if(!sharing){
		      	video.src = window.URL.createObjectURL(localMediaStream);
		      	video.play()
		      	video.addEventListener("loadedmetadata", function(){
		      	   canvas.width = this.clientWidth;
		      	   canvas.height = this.clientHeight;
		      	});
		      	requestAnimationFrame(draw);
		      	setInterval(function(){
		      		socket.emit("video", canvas.toDataURL());
		      	},1000/5);
		      	sharing = true;
		      }
		     
		   },

		   // errorCallback
		   function(err) {
		    console.log("The following error occured: " + err);
		   }

		);
	}
	
	button.addEventListener("click", init);
	function draw(){
	  ctx.drawImage(video, 0,0, canvas.width, canvas.height); 
	  requestAnimationFrame(draw);
	}
	setInterval(function(){
		if(!sharing){
			if(buffer.length){
				ctx.drawImage(buffer.shift(), 0,0, 200,200);
			}
		}
	},1000/24)
	socket.on("video", function(image){
		if(!sharing){
			var i = new Image();
			i.src = image;
			buffer.push(i);
		}
	});
}(socket))
 