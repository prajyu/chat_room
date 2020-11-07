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
var value =[]
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
    secret: 'My key',
    resave: true,
    saveUninitialized: true
})) 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/Static/Login.html')
});

app.get('/authenticate',(req,ress)=>{
  if(req.query.username == '' ||req.query.passwd == ''){
    ress.redirect(301,'/')
  }
  let result = value.filter(o => o.id == req.query.username)
  if(result.length > 0){
    for(x in result){
      bcrypt.compare(req.query.username,result[x].users.username,(err,res)=>{
        if(res){
          bcrypt.compare(req.query.passwd,result[x].users.password,(err,res)=>{
            if(res){
              ress.statusCode = 200
              req.session.name = req.query.username
              ress.redirect(302,'/room')
              result[x].authenticated = true
            }else{
              ress.statusCode = 403
              ress.redirect(403,'/?name='+encodeURIComponent(req.query.username))
            }
          })
        }
      })
    }
  }else{
    ress.statusCode = 404
    ress.redirect(301,'/?name='+encodeURIComponent(req.query.username))
  }
})

app.post('/register',async (req,res)=>{
  var data = req.body
  var password = await bcrypt.hash(data.passwd,10)
  var username = await bcrypt.hash(data.username,10)
  var jdata = {'id':data.username,'users':{'username':username,'password':password},'authenticated':false}
  value.push(jdata)
  res.statusCode = 201
  res.redirect(302,'/')
})

app.get('/createuser',(req,res) =>{
  res.sendFile(__dirname+'/Static/Create/Create.html')
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
  if(results.length > 0  && results.filter(o =>o.name == name).length>0){
    res.sendFile(__dirname+'/Rooms/Index.html')
  }
})

app.get('/chat',(req,ress) =>{
  var results = sessions.filter(o => o.session== req.sessionID && o.name == req.session.name)
  if(results.length > 0 && results.filter(o => o.name == req.query.name).length > 0 && rooms.includes(req.query.room)){
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
  if(rooms.includes(room)){
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
        console.log(lrooms[0].online)
        console.log(lrooms[0].count)
        if(lrooms[0].online == true && lrooms[0].count == 0){
          cleanCount(roomdata,0)
          rooms.splice(rooms.indexOf(socket.room))
          console.log(roomdata)
          console.log(rooms)
          }
        }
      }
    }
  })
})