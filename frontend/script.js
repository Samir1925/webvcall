const socket = io(); // Connect to backend

const joinBtn = document.getElementById("joinBtn");
const welcomeDiv = document.getElementById("welcome");
const videosDiv = document.getElementById("videos");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

let localStream;
let peers = {};
const roomID = "FamilyRoomNepal2025"; // fixed room

joinBtn.onclick = async () => {
  welcomeDiv.style.display = "none";
  videosDiv.style.display = "block";

  localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
  localVideo.srcObject = localStream;

  socket.emit("join-room", roomID);

  socket.on("user-connected", id => { connectToNewUser(id); });
  socket.on("offer", handleOffer);
  socket.on("answer", handleAnswer);
  socket.on("ice-candidate", handleCandidate);
  socket.on("user-disconnected", id => {
    if (peers[id]) peers[id].close();
  });
};

// WebRTC connections
async function connectToNewUser(id) {
  const peer = new RTCPeerConnection({ iceServers:[{ urls:"stun:stun.l.google.com:19302" }] });
  peers[id] = peer;

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  const remoteVideo = document.createElement("video");
  remoteVideo.autoplay = true;
  remoteVideos.appendChild(remoteVideo);

  peer.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };

  peer.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", { target: id, candidate: e.candidate });
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", { target: id, sdp: offer });
}

async function handleOffer({ sdp, caller }) {
  const peer = new RTCPeerConnection({ iceServers:[{ urls:"stun:stun.l.google.com:19302" }] });
  peers[caller] = peer;

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  const remoteVideo = document.createElement("video");
  remoteVideo.autoplay = true;
  remoteVideos.appendChild(remoteVideo);

  peer.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };

  peer.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", { target: caller, candidate: e.candidate });
  };

  await peer.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", { target: caller, sdp: answer });
}

async function handleAnswer({ sdp, responder }) {
  await peers[responder].setRemoteDescription(new RTCSessionDescription(sdp));
}

async function handleCandidate({ candidate, from }) {
  await peers[from].addIceCandidate(new RTCIceCandidate(candidate));
}
