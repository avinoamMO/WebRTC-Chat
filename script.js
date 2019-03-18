// This script is relying on ScaleDrone service to substitute independent singaling server.
// Docs: https://www.scaledrone.com/docs/api-clients/javascript

let room;
let pc;
let userName = prompt("Hey there, what's your name?", "Incognito");
let roomName = "observable-" + prompt("Enter room name", "defaultRoom");

// If no location hash, generate one pseudo randomly.
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xffffff).toString(16);
}

var drone = new ScaleDrone("yiS12Ts5RdNhebyM", {
  data: {
    name: userName
  }
});

// Prefix room name with 'observable-'
// const roomHash = location.hash.substring(1);
const roomHash = "moishe";
// const roomName = "observable-" + roomHash;

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

drone.on("open", error => {
  if (error) return console.error(error);

  room = drone.subscribe(roomName);
  room.on("open", error => {
    if (error) {
      onError(error);
    }
  });

  // We're connected to the room and received an array of 'members'
  // connected to the room (including us). Signaling server is ready.
  room.on("members", members => {
    console.log("MEMBERS", members);

    // If we are the second user to connect to the room we will be creating the offer
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });
  room.on("member_join", member => {
    console.log();
    document.getElementById("chatBox").value += member.clientData.name +=
      " joined";
    document.getElementById("chatBox").value += String.fromCharCode(13, 10);
  });
  room.on("message", message => {
    console.log(message);

    if (message.data.data) {
      document.getElementById("chatBox").value += message.data.user += ": ";
      document.getElementById("chatBox").value += message.data.data;
      document.getElementById("chatBox").value += String.fromCharCode(13, 10);
      document.getElementById("chatBox").scrollTop = document.getElementById(
        "chatBox"
      ).scrollHeight;
    }
  });
});

function sendChatMessage() {
  drone.publish({
    room: `${roomName}`,
    message: {
      data: document.getElementById("chat_text_input").value,
      user: userName
    }
  });
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({ candidate: event.candidate });
    }
  };

  // If user is offerer let the 'negotiationneeded' event create the offer
  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer()
        .then(localDescCreated)
        .catch(onError);
    };
  }

  // When a remote stream arrives display it in the #remoteVideo element
  pc.ontrack = event => {
    const stream = event.streams[0];
    if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
      remoteVideo.srcObject = stream;
    }
  };

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true
    })
    .then(stream => {
      // Display your local video in #localVideo element
      localVideo.srcObject = stream;
      // Add your stream to be sent to the conneting peer
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }, onError);

  // Listen to signaling data from Scaledrone
  room.on("data", (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(
        new RTCSessionDescription(message.sdp),
        () => {
          // When receiving an offer lets answer it
          if (pc.remoteDescription.type === "offer") {
            pc.createAnswer()
              .then(localDescCreated)
              .catch(onError);
          }
        },
        onError
      );
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate),
        onSuccess,
        onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({ sdp: pc.localDescription }),
    onError
  );
}

function onSuccess() {}
function onError(error) {
  console.error(error);
}

// Send signaling data via Scaledrone
function sendMessage(message) {
  drone.publish({
    room: roomName,
    message
  });
}
