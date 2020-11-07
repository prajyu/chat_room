var express = require('express')
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io').listen(http)
var rooms =[]
http.listen(3000)

app.use(express.urlencoded({extended:true}));
app.use(express.static('Static'))
app.use('/chat',express.static('chat'))

app.get('/list',(req,res)=>{
  res.sendFile(__dirname + '/Static/Index.html')
})

app.post('/create',(req,res)=>{
  rooms.push(req.body.name)
  res.redirect('/join/'+encodeURIComponent(req.body.name))
})

app.get('/join/:room',(req,res)=>{
  var room = req.params.room
  res.redirect('/chat/'+encodeURIComponent(room))
})

app.get('/chat/:room',(req,res)=>{
  res.sendFile(__dirname+'/chat/Index.html')
  console.log(+req.params.room)
})

io.on('connection',socket=>{
  socket.on('listreq',()=>{
    socket.emit('list',rooms)
  })
})
