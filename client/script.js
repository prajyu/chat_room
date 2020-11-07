const form = document.getElementById('message-form')
const recvdiv = document.getElementById('message-recv-container')
const messagediv = document.getElementById('message-container')
const dis = document.getElementById('disconnect-btn')
const re = document.getElementById('reconnect-btn')
const tools = document.getElementById('tools')
var name = ''
const socket = io('/')


function elementuser(message,classname,appendiv){
  var div = document.createElement('div')
  var para = document.createElement('p')
  para.innerText = message
  div.className = classname
  div.appendChild(para)
  appendiv.appendChild(div)
}

function element(message,user,classname,appendiv){
  var div = document.createElement('div')
  var para = document.createElement('p')
  var para1 = document.createElement('p')
  para.innerText = message
  para1.innerText = user
  para1.className = 'username'
  div.className = classname
  div.appendChild(para1)
  div.appendChild(para)
  appendiv.appendChild(div)
}

let params = (new URL(document.location));

name = params.searchParams.get('name')
room = params.searchParams.get('room')

socket.on('chat-message',(data,username) => {
  element(data,username,"Server",recvdiv)
})

form.addEventListener('submit',function(data){
  data.preventDefault()
  var message = document.getElementById('message-txt').value.replace(/\s+/, "")
  
  if(!message == ""){
    elementuser(message,"User",recvdiv)
    socket.emit('message',message)
    document.getElementById('message-txt').value = ''
  }
})

socket.on('connect', function(){
    if(name !== null){
      var message = "You joined"
      elementuser(message,"User",recvdiv)
      socket.emit('user-joined',name,room)
    }
  })


socket.on('user-joined',(data,count) => {
 var message = data+' joined'
 var count = count +' active'
 elementuser(message,"Server",recvdiv)
 tools.innerText = count
})

socket.on('disconnected-client',(data,count) =>{
  var message = data+' left'
  var count = count +' active'
  tools.innerText = count
  elementuser(message,"Server",recvdiv)
})

socket.on('disconnect',function(){
  var message = 'You left'
  elementuser(message,"User",recvdiv)
  socket.disconnect()
  tools.innerText = '0 active'
})

dis.addEventListener('click',() =>{
  socket.disconnect()
})

re.addEventListener('click',() =>{
  socket.connect()
})

socket.on('return',data =>{
  var count = data +' active'
  tools.innerText = count
  socket.emit('check','')
})