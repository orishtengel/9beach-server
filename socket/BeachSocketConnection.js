
var { v4: uuidv4 } = require('uuid');


// I'm maintaining all active connections in this object
const clients = {};



module.exports = {
    addConnection: (wsConnection) => {
        const id = uuidv4();
        clients[id] = wsConnection
        console.log('addding ' + id)

        wsConnection.isAlive = true
        wsConnection.on('pong', () => {
            wsConnection.isAlive = true;
        });

        wsConnection.on('close', () => {
            delete clients[id]
            console.log('has left: ' + id)
        })
    },

    broadcast: (type, message) => {
        Object.keys(clients).map(id => {
            try {
                if(clients[id]) {
                    message["type"] = type
                    clients[id].send(JSON.stringify(message))
                }
            }
            catch(e) {
                console.log(e)
                console.log('Failed to send to client ' + id + ' removing him rom list')
                delete clients[id]
            }
        })
    }
}