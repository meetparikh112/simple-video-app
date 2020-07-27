const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
	host: 'sample-video-meet.herokuapp.com',
	secure: true,
	port: '3001',
});
console.log('myPeer', myPeer);
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
console.log('navigator.mediaDevices', navigator.mediaDevices);

navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: true,
	})
	.then((stream) => {
		console.log('stream', stream);
		addVideoStream(myVideo, stream);

		myPeer.on('call', (call) => {
			console.log('myPeer.oncall');

			call.answer(stream);
			const video = document.createElement('video');
			call.on('stream', (userVideoStream) => {
				console.log('call.on.stream');

				addVideoStream(video, userVideoStream);
			});
		});

		socket.on('user-connected', (userId) => {
			console.log('user-connected', userId);
			connectToNewUser(userId, stream);
		});
	});

socket.on('user-disconnected', (userId) => {
	if (peers[userId]) peers[userId].close();
});

myPeer.on('open', (id) => {
	console.log('myPeer.on.open');
	console.log('join-room');

	socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
	console.log('connectToNewUser');

	const call = myPeer.call(userId, stream);
	const video = document.createElement('video');
	call.on('stream', (userVideoStream) => {
		addVideoStream(video, userVideoStream);
	});
	call.on('close', () => {
		video.remove();
	});

	peers[userId] = call;
}

function addVideoStream(video, stream) {
	video.srcObject = stream;
	video.addEventListener('loadedmetadata', () => {
		video.play();
	});
	videoGrid.append(video);
}
