// This script is using WebRTC for p2p streaming and ScaleDrone for singaling.
// Based on tutorial's source code here: https://github.com/ScaleDrone/webrtc
// Docs:
// 1) https://www.scaledrone.com/docs/api-clients/javascript
// 2) https://www.html5rocks.com/en/tutorials/webrtc/basics/
// 3) RTCPeerConnection: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
// 4) https://webrtcglossary.com

let room, peerConnection;
let roomName = "observable-" + prompt("Enter room name", "defaultRoom");
let userName = prompt("Hey there, what's your name?", "Incognito") || "no_name";

// One instance of Scaledrone establishes a single connection, takes parameter 'CHANNEL_ID_FROM_DASHBOARD'.
let drone = new ScaleDrone("yiS12Ts5RdNhebyM", {
  data: {
    name: userName
  }
});

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

drone.on("error", error => {
  console.log(error);
});

// 'reconnect' event indicates reconnection occured succesfully.
drone.on("reconnect", () => {
  console.log("reconnected");
});

// 'open' event indicates a connection has been opened.
drone.on("open", error => {
  if (error) return console.error(error);

  // Subscribe to the room specified by the user.
  room = drone.subscribe(roomName);
  room.on("open", error => {
    if (error) {
      onError(error);
    }
  });

  // Event members is invoked once upon connecting to a room and returns array with member list (including client).
  room.on("members", members => {
    console.log("MEMBERS", members);
    const isOfferer = members.length === 2; // Returns boolean, where true means the client is the second person in the room.
    startWebRTC(isOfferer);
  });

  // member_join is invoked whenver someone joins the room.
  room.on("member_join", member => {
    let joinMessage = (member.clientData.name += " joined");
    joinMessage += String.fromCharCode(13, 10); // line break
    document.getElementById("notificationsBox").value += joinMessage;
  });

  room.on("member_leave", member => {
    let leftMessage = (member.clientData.name += " left");
    leftMessage += String.fromCharCode(13, 10);
    document.getElementById("notificationsBox").value += leftMessage;
    console.log(remoteVideo);
  });

  room.on("message", message => {
    // Checks if message is containing meta-data or a chat message.
    if (message.data.data) {
      // If it's a chat message, post to chatBox element.
      let chatBox = document.getElementById("chatBox");
      chatBox.value += message.data.user += ": ";
      chatBox.value += message.data.data;
      chatBox.value += String.fromCharCode(13, 10);
      chatBox.scrollTop = document.getElementById("chatBox").scrollHeight;
    }
  });
});

var keyPress = document.getElementById("chat_text_input");
keyPress.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) document.getElementById("sendMsgBtn").click();
});

function startWebRTC(isOfferer) {
  // instances of RTCPeerConnection represent a connection between the local device and a remote peer.
  peerConnection = new RTCPeerConnection(configuration);

  // This event occurs when the local ICE agent needs to deliver a message to the other peer through a signaling server.
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      SendMetaMessage({ candidate: event.candidate });
    }
  };

  // Handshake handling with respect to user being the first party in the room or not.
  if (isOfferer) {
    peerConnection.onnegotiationneeded = () => {
      peerConnection
        .createOffer()
        .then(localDescCreated)
        .catch(onError);
    };
  }

  // Stream video from remote peer to video element on page.
  peerConnection.ontrack = event => {
    const stream = event.streams[0];
    if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
      remoteVideo.srcObject = stream;
    }
  };

  // Capture video stream from local machine's webcam.
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true
    })
    .then(stream => {
      // Display your local video in #localVideo element
      localVideo.srcObject = stream;
      // Add your stream to be sent to the conneting peer
      stream
        .getTracks()
        .forEach(track => peerConnection.addTrack(track, stream));
    }, onError);

  // Listen to signaling data from Scaledrone
  room.on("data", (message, client) => {
    if (client.id === drone.clientId) {
      // If message was sent by us, do nothing.
      return;
    }

    if (message.sdp) {
      // Handshake handling
      peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.sdp),
        () => {
          // When receiving an offer, answer it
          if (peerConnection.remoteDescription.type === "offer") {
            peerConnection
              .createAnswer()
              .then(localDescCreated)
              .catch(onError);
          }
        },
        onError
      );
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      peerConnection.addIceCandidate(
        new RTCIceCandidate(message.candidate),
        onSuccess,
        onError
      );
    }
  });
}
function localDescCreated(desc) {
  //Handshake handling
  peerConnection.setLocalDescription(
    desc,
    () => SendMetaMessage({ sdp: peerConnection.localDescription }),
    onError
  );
}

function sendChatMessage() {
  drone.publish({
    room: `${roomName}`,
    message: {
      data: document.getElementById("chat_text_input").value,
      user: userName
    }
  });
  document.getElementById("chat_text_input").value = " "; //Clear chat input box
}

function onSuccess() {}
function onError(error) {
  console.error(error);
  }

// Send signaling data via Scaledrone
function SendMetaMessage(message) {
  drone.publish({
    room: roomName,
    message
  });
}
