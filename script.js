const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const welcomeDiv = document.getElementById("welcome");
const videosDiv = document.getElementById("videos");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

let localStream;
let peers = {};

// Use PeerJS cloud server
const peer = new Peer(undefined, { host:'peerjs.com', port:443, secure:true });

peer.on('open', id => console.log('My Peer ID:', id));

joinBtn.onclick = async () => {
  if(!nameInput.value) { alert("Enter your name"); return; }
  welcomeDiv.style.display = "none";
  videosDiv.style.display = "block";

  localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
  localVideo.srcObject = localStream;

  // When someone calls you
  peer.on('call', call => {
    call.answer(localStream);
    const remoteVideo = document.createElement("video");
    remoteVideo.autoplay = true;
    call.on('stream', remoteStream => { remoteVideo.srcObject = remoteStream; });
    remoteVideos.appendChild(remoteVideo);
  });

  // Share your ID with family (or use a fixed room ID)
  const roomID = "FamilyRoomNepal2025";
  const yourCall = peer.connect(roomID);

  // Automatically call other peers in room
  yourCall.on('open', () => {
    // Broadcast your Peer ID to others
    yourCall.send(peer.id);
  });

  peer.on('connection', conn => {
    conn.on('data', peerId => {
      const call = peer.call(peerId, localStream);
      const remoteVideo = document.createElement("video");
      remoteVideo.autoplay = true;
      call.on('stream', remoteStream => { remoteVideo.srcObject = remoteStream; });
      remoteVideos.appendChild(remoteVideo);
    });
  });
};
