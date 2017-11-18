// app.js

window.addEventListener('load', function() {
    console.log('node-refserver: frontend loaded.');

    var socket;

    if (location.protocol.match(/https/)) {
        socket  = io();

        if (socket) {
            socket.on('user_join', function(user) {
                console.log('%s joined', user); 
            });

            socket.on('user_leave', function(user) {
                console.log('%s left', user);
            });

            socket.emit('user_list', '', function(users) {
                console.log('user_list got:', users);
            });
        }
    }
});
