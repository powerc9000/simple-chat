(function(socket){
	var sharing = false;
	var video = document.querySelector('video');
	var canvas = document.getElementById('videoCanvas');
	var button = document.getElementById("shareVideo");
	var ctx = canvas.getContext("2d");
	var buffer = [];
	var i = new Image();
	var feeds = {};
	var fps = 20;
	var vc = document.getElementsByClassName("video")[0];
	var username = localStorage.getItem("chatUsername");
	var feeding = false;
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	                             window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
	video.width = 200;
	video.style.visibility = "hidden";
	video.style.position = "absolute";
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
		    		if(!feeding){
		    			requestAnimationFrame(draw);
		    		}
		    		
		    	});
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
	setInterval(function(){
		if(feeding){
			
			socket.emit("video", canvas.toDataURL());
		}
		
	}, 1000/24)
	function draw(){
	feeding = true;
	  try{
		ctx.drawImage(video, 0,0, canvas.width, canvas.height); 
		
	  }
	  catch(e){
	  	console.log("nope")
	  }
	  doOtherFeeds();
	  
	  requestAnimationFrame(draw);
	}
	socket.on("video", function(image, u){
		if(!feeding){
			requestAnimationFrame(draw);
		}
		if(u !== username){
			if(buffer.length > 50){
				buffer.length = 0;
			}
			else{
				buffer.push({username:u, image:image});
			}
			
		}
	});

	function doOtherFeeds(){
		if(buffer.length){
			i.src = buffer[0].image;
			if(!feeds[buffer[0].username]){
				feeds[buffer[0].username] = {};
				feeds[buffer[0].username].canvas = vc.appendChild(document.createElement("canvas"));
				feeds[buffer[0].username].ctx = feeds[buffer[0].username].canvas.getContext("2d");
				
			}
			i.onload = function(){
				setFeedSize.call(this);
				feeds[buffer[0].username].ctx.drawImage(i, 0,0, feeds[buffer[0].username].canvas.width, feeds[buffer[0].username].canvas.height);
				shift(buffer);
			}
			
			
			
			
		}
	}	
	function setFeedSize(){
			if(this.width && this.height){
				feeds[buffer[0].username].canvas.width = this.width;
				feeds[buffer[0].username].canvas.height = this.height;
			}
	}
	function shift(arr){
		for(var i =0; i<arr.length; i++){
			arr[i] = arr[i+1]
		}
		arr.length = arr.length - 1;
	}
}(socket))
 