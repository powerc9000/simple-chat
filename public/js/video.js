(function(socket){
	// the socket handles sending messages between peer connections while they are in the 
// process of connecting
socket.on("assigned_id", function(id){
	socket.id = id;
});

socket.on("received_offer", function(data){
	//pc = new RTCPeerConnection(configuration);
	console.log('received offer');
	pc.setRemoteDescription(new RTCSessionDescription(data), function(){
		pc.createAnswer(function(description) {
			console.log("are we getting here?")
			console.log('sending answer');
			socket.emit("recieved_answer", description);
			pc.setLocalDescription(description); 
			
		}, null, mediaConstraints);
	});
	
});

socket.on("recieved_answer", function(data){
	console.log('received answer');
	if(!connected) {
		pc.setRemoteDescription(new RTCSessionDescription(data));
		connected = true;
	}
});

socket.on("received_candidate", function(data){
	console.log('received candidate');
	var candidate = new RTCIceCandidate({
		sdpMLineIndex: data.label,
		candidate: data.candidate
	});
	pc.addIceCandidate(candidate);
});


var pc;
var online;
var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var stream;
var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection  ;
var connected = false;
var mediaConstraints = {
  'mandatory': {
    'OfferToReceiveAudio':true, 
    'OfferToReceiveVideo':true
  }
};

pc = new RTCPeerConnection(configuration);
pc.onicecandidate = function(e) {
	if(e.candidate) {
		socket.emit("received_candidate", {
			label: e.candidate.sdpMLineIndex,
			id: e.candidate.sdpMid,
			candidate: e.candidate.candidate
		});
	}
};

pc.onaddstream = function(e) {
  console.log('start remote video stream');
  vid2.src = webkitURL.createObjectURL(e.stream);
  vid2.play();
};
socket.on("online", function(o){
	online = o;
});
function broadcast() {
	navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia ;
  // gets local video stream and renders to vid1
  navigator.getUserMedia({audio: true, video: true}, function(s) {
    stream = s;
    pc.addStream(s);
    vid1.src = webkitURL.createObjectURL(s);
    vid1.play();
    // initCall is set in views/index and is based on if there is another person in the room to connect to
    if(online.total > 1)
      start();
  	console.log(online.total);
  }, function(){});
}

function start() {
  // this initializes the peer connection
  pc.createOffer(function(description) {
    pc.setLocalDescription(description, function(){
    	socket.emit(
    	  'received_offer',
    	  description
    	);
    });
   
  }, null, mediaConstraints);
}

window.onload = function() {
  broadcast();
};

}(socket));
 