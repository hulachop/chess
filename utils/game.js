function Init(socket){
    socket.on('joingame', id => {
        socket.to(id).emit('joinRequest', socket.id);
        console.log(socket.id, " requesting to join ", id);
    });
    socket.on('acceptJoin', data => {
        socket.to(data.id).emit('joinAccepted', { id:socket.id , ids:data.ids, maxPlayers:data.maxPlayers});
    });
    socket.on('message', data => {
        data.ids.forEach(element => {
            socket.to(element).emit('message', {from:socket.id, message:data.message});
        });
    })
}
module.exports = Init;