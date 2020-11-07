var express = require('express')
const session = require('express-session') 
var port = process.env.PORT || '3000'
console.log(port)
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io').listen(http)
var bcrypt = require('bcrypt')
var authenticated = false
http.listen(port)
var rooms =[]
var sessions =[]
var roomdata =[]

cleanCount =function(array,deleteValue) {
  for(i in array){
    if (array[i].count == deleteValue) {
      array.splice(i,1);
    }
  }
  return array;
};

app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: '90d3cede6fe59d0e889acd74b9599204',
    resave: true,
    saveUninitialized: true
})) 


app.get('/',(req,res)=>{
  res.sendFile(__dirname+'/Static/Create.html')
})

app.post('/name',(req,res)=>{
  if(typeof req.body.username !== undefined){
    var result = sessions.filter(o =>{
    return o.name == req.body.username && o.session == req.sessionID})
    var names = sessions.filter(o =>{
    return o.name == req.body.username})
    if(result.length > 0){
      req.session.name = req.body.username
      res.redirect('/room')
    }else if(names.length == 0){
      req.session.name = req.body.username
      res.redirect('/room')
    }else{
      res.redirect('/')
    }
  }else{
    res.redirect('/')
  }
  
})

app.get('/room',(req,res)=>{
  if(typeof req.session.name !== 'undefined'){
    var index = sessions.findIndex(value => { return value.session == req.sessionID && value.name == req.session.name})
    if(index == -1){
      sessions.push({'session':req.sessionID,'name':req.session.name})
    }
  }
  var name = req.session.name
  var results = sessions.filter(o => o.session == req.sessionID && o.name == req.session.name)
  if(results.length > 0){
    res.sendFile(__dirname+'/Rooms/Index.html')
  }
})

app.get('/chat',(req,ress) =>{
  var result = roomdata.filter(value=>{
    return value.roomname == req.query.room
  })
  var check = false
  console.log(result)
  if(result.length >0){
    check = result[0].users.filter(value =>{
      return value.name == req.session.name
    })
  }
  var results = sessions.filter(o => o.session== req.sessionID && o.name == req.session.name)
  if(results.length > 0 && results.filter(o => o.name == req.query.name).length > 0 && rooms.includes(req.query.room) && check.length ==0){
    ress.sendFile(__dirname+'/client/Index.html')
  }
})

app.post('/create',(req,res)=>{
  if(!rooms.includes(req.body.roomname)){
     rooms.push(req.body.roomname)
     roomdata.push({'roomname':req.body.roomname,'count':0,'users':[],'online':false})
     res.statusCode = 201
     res.redirect(302,'/join/'+encodeURIComponent(req.body.roomname))
  }else{
    res.statusCode = 403
    res.redirect(301,'/rooms')
  }
 
})

app.get('/join/:room',(req,ress)=>{
  var room = req.params.room
  var name = req.session.name
  var result = roomdata.filter(value=>{
    return value.roomname == room
  })
  var check = false
  console.log(result)
  if(result.length >0){
    check = result[0].users.filter(value =>{
      return value.name == name
    })
  }
  if(rooms.includes(room)){
    if(check.length ==0){
      var name = req.session.name
  var results = sessions.filter(o => o.session == req.sessionID && o.name == req.session.name)
  if(results.length > 0  && results.filter(o =>o.name == name).length>0){
    ress.statusCode = 200
    ress.redirect(302,'/chat/?room='+encodeURIComponent(room)+'&name='+encodeURIComponent(name))
  }else{
    ress.statusCode = 200
    ress.redirect(302,'/chat/?room='+encodeURIComponent(room)+'&name='+encodeURIComponent(name))
  }
    }else{
      ress.statusCode =403
      ress.redirect(301,'/room')
    }
    
  }else{
    ress.statusCode = 404
    ress.redirect(301,'/room')
  }
})
  
  

app.use(express.static('Static'))
app.use('/room',express.static('Rooms'))
app.use('/client',express.static('client'))


io.on('connection',socket => {

  socket.on('listreq',()=>{
    socket.emit('list',rooms)
  })
  
  socket.on('user-joined',(name,room)=>{
    if(name == "" || name == null){ 
      socket.disconnect()
    }else{
      socket.room = room
      socket.username = name
      socket.join(room)
      var data = roomdata.filter(o => o.roomname == room)
      if(data.length == 1){
        data[0].count++
      data[0].users.push({'name':name,'id':socket.id})
      data[0].online = true
      socket.to(room).emit('user-joined',name,data[0].count)
      socket.emit('return',data[0].count)
      var count = data[0].count
      if(count == 15){
        var index = roomdata.filter(o => o.roomname == socket.room)[0]
        rooms.splice(rooms.indexOf(socket.room))
        roomdata.splice(roomdata.indexOf(index))
      }
      }
    }
  })
  
  socket.on('message',data => {
    var room = roomdata.filter(o => o.roomname == socket.room)
    if(room.length == 1){
      if(!data.replace(/\s+/, "") == ""){
        socket.to(socket.room).emit('chat-message',data,socket.username)
      }
    }
  })
  
  socket.on('disconnect',data=>{
    var room = socket.room
    var name = socket.username
    var lrooms = roomdata.filter(o => o.roomname == socket.room)
    if(lrooms.length ==1){
      var result = lrooms[0].users.filter(o => o.id == socket.id)
      if(result.length > 0){
        if(result[0].name !== ''){
        lrooms[0].count--
        lrooms[0].users.splice(lrooms[0].users.indexOf(result[0]))
        socket.to(socket.room).emit('disconnected-client',result[0].name,lrooms[0].count)
        if(lrooms[0].online == true && lrooms[0].count == 0){
          cleanCount(roomdata,0)
          rooms.splice(rooms.indexOf(socket.room))
          }
        }
      }
    }
  })
})