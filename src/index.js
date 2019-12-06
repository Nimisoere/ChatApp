const http = require('http')
const app = require('./app')
const socketio = require('socket.io')
const Filter = require('bad-words')

const port = process.env.PORT

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', (socket) => {
    socket.emit('message', 'Welcome!')
    socket.broadcast.emit('message', 'A new user has joined')

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed")
        }
        io.emit('message', message)
        callback()
    })
    socket.on('disconnect', () => {
        io.emit('message', 'A user has left')
    })
    socket.on('sendLocation', (location, callback) => {
        io.emit('locationMessage', `https://google.com/maps?q=${location.latitude},${location.longitude}`)
        callback()
    })
})



server.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})