const io = require('socket.io')(3000);
let connectedUserArr = [];

io.on('connection', socket => {
  let currentUserName;

  // Send message
  socket.on('send-chat-message', message => {
    socket.broadcast.emit('chat-message', message);
  });

  // User join Chat
  socket.on('userJoinChat', userName => {
    currentUserName = userName;
    connectedUserArr.push(currentUserName);
    socket.broadcast.emit('userJoinChatMessage', userName);

    ConnectedUserCount();
    GetConnectedUsersArr();
  });

  // Current user typing
  socket.on('currentUserTyping', isTyping => {
    socket.broadcast.emit('userTyping', true);
  });

  // User left chat
  socket.on('disconnect', function() {
    connectedUserArr = singleArrayRemove(connectedUserArr, currentUserName);

    socket.broadcast.emit('userLeftChatMessage', currentUserName);
    ConnectedUserCount();
    GetConnectedUsersArr();
  });

  function singleArrayRemove(array, value) {
    var index = array.indexOf(value);
    if (index > -1) array.splice(index, 1);
    return array;
  }

  function GetConnectedUsersArr() {
    socket.emit('connectedUsers', connectedUserArr);
    socket.broadcast.emit('connectedUsers', connectedUserArr);
  }

  // Return a count of the connected users
  function ConnectedUserCount() {
    socket.emit('connectedUserCount', socket.client.conn.server.clientsCount);
    socket.broadcast.emit('connectedUserCount', socket.client.conn.server.clientsCount);
  }
});