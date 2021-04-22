const LOCAL_PLAYER = {
    
}

var socket = null;

const NETWORK_PLAYER = {
    ids: [],
    connected: false,
    maxPlayers: 2,
    hosting: false,
    Host: function(){
        socket = io();
        socket.on('connect', () => {
            console.log('hosting on', socket.id);
        });
        socket.on('joinRequest', id => {
            if(!this.connected){
                var newIds = this.ids.concat([socket.id]);
                socket.emit('acceptJoin', {id, ids:newIds, maxPlayers:this.maxPlayers});
                this.ids.push(id);
                if(this.ids.length == this.maxPlayers-1) this.connected = true;
                console.log(id, "connected!");
            }
            else{
                socket.emit('rejectJoin', id);
                console.log(id, "rejected!");
            }
        });
        this.hosting = true;
        this.InitSocket();
    },
    Join: function(joinId){
        if(this.hosting){
            console.log("you are hosting a game right now!");
            return;
        }
        if(socket == null){
            socket = io();
            socket.on('joinAccepted', (data) => {
                if(data.id == joinId){
                    this.maxPlayers = data.maxPlayers;
                    this.ids = data.ids;
                    if(this.ids.length == this.maxPlayers-1) this.connected = true;
                    this.ids.forEach(element => {
                        socket.emit('joined', element);
                    });
                    console.log('succesfully joined', joinId,"!");
                }
            });
            socket.on('joined', id => {
                if(this.ids.length == this.maxPlayers-1) return;
                this.ids.push(id);
                if(this.ids.length == this.maxPlayers-1) connected = true;
                console.log(id, 'joined!');
            });
            socket.emit('joingame', joinId);
            this.InitSocket();
        }
    },
    Message: function(message){
        this.ids.forEach(element => {
            socket.emit('message', {message, ids:this.ids});
        });
    },
    Disconnect: function(){
        socket.disconnect();
        console.log('disconnected!');
        socket = null;
    },
    InitSocket: function(){
        socket.on('message', data => {
            console.log(data.from,'said: ',data.message);
        });
    }
}