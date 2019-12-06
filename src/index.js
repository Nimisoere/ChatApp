const http = require('http')
const app = require('./app')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
    generateMessage
} = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')

const port = process.env.PORT

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', (socket) => {

    socket.on('join', (options, callback) => {
        const {
            error,
            user
        } = addUser({
            id: socket.id,
            ...options
        })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage("Admin", 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed")
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })    
        }

    })
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
})



server.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})