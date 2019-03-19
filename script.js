// This script is using WebRTC for p2p communications and ScaleDrone to for singaling.
// Docs:
// 1) https://www.scaledrone.com/docs/api-clients/javascript
// 2) https://www.html5rocks.com/en/tutorials/webrtc/basics/
// 3) RTCPeerConnection: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

let room, RTCpc;
let roomName = "observable-" + prompt("Enter room name", "defaultRoom");
let userName = prompt("Hey there, what's your name?", "Incognito");

// One instance of Scaledrone establishes a single connection.
var drone = new ScaleDrone("yiS12Ts5RdNhebyM", {
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

  // Subscribe after the 'open' or 'authenticate' event from the Scaledrone instance

  room = drone.subscribe(roomName);

  room.on("open", error => {
    if (error) {
      onError(error);
    }
  });

  // Event members is invoked once upon connecting to a room and returns array with member list (including client).
  room.on("members", members => {
    console.log("MEMBERS", members);
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });

  // member_join is invoked whenver someone joins the room and provides data on new member.
  room.on("member_join", member => {
    let joinMessage = (member.clientData.name += " joined");
    joinMessage += String.fromCharCode(13, 10);
    document.getElementById("notificationsBox").value += joinMessage;
  });

  room.on("member_leave", member => {
    let leftMessage = (member.clientData.name += " left");
    leftMessage += String.fromCharCode(13, 10);
    document.getElementById("notificationsBox").value += leftMessage;
  });

  room.on("message", message => {
    if (message.data.data) {
      // Checks if message has text intended for chat
      document.getElementById("chatBox").value += message.data.user += ": ";
      document.getElementById("chatBox").value += message.data.data;
      document.getElementById("chatBox").value += String.fromCharCode(13, 10);
      document.getElementById("chatBox").scrollTop = document.getElementById(
        "chatBox"
      ).scrollHeight;
    }
  });
});

function startWebRTC(isOfferer) {
  // instances of RTCPeerConnection represent a connection between the local device and a remote peer.
  RTCpc = new RTCPeerConnection(configuration);

  // This event occurs when the local ICE agent needs to deliver a message to the other peer through a signaling server.
  RTCpc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({ candidate: event.candidate });
    }
  };

  //
  if (isOfferer) {
    RTCpc.onnegotiationneeded = () => {
      RTCpc.createOffer()
        .then(localDescCreated)
        .catch(onError);
    };
  }

  // When a remote stream arrives display it in the #remoteVideo element
  RTCpc.ontrack = event => {
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
      stream.getTracks().forEach(track => RTCpc.addTrack(track, stream));
    }, onError);

  // Listen to signaling data from Scaledrone
  room.on("data", (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      RTCpc.setRemoteDescription(
        new RTCSessionDescription(message.sdp),
        () => {
          // When receiving an offer lets answer it
          if (RTCpc.remoteDescription.type === "offer") {
            RTCpc.createAnswer()
              .then(localDescCreated)
              .catch(onError);
          }
        },
        onError
      );
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      RTCpc.addIceCandidate(
        new RTCIceCandidate(message.candidate),
        onSuccess,
        onError
      );
    }
  });
}

function sendChatMessage() {
  drone.publish({
    room: `${roomName}`,
    message: {
      data: document.getElementById("chat_text_input").value,
      user: userName
    }
  });
}

function localDescCreated(desc) {
  RTCpc.setLocalDescription(
    desc,
    () => sendMessage({ sdp: RTCpc.localDescription }),
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
