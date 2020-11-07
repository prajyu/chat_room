var list = document.getElementById('Room-list')
var form = document.getElementById('Room-form')
var ul = document.getElementById('list')
var searchBox = document.querySelectorAll('.search-box input[type="text"] + span');
var search = document.getElementById('Search-value')
var value =[]

var socket = io('/')
var socketid = ''

form.addEventListener('submit',e =>{
  if(socketid == '' || document.getElementById('Room-name').value == ''){
    alert('Cant create room')
    e.preventDefault()
  }else{
    document.getElementById('name').value = name
  }
})

searchBox.forEach(elm => {
  elm.addEventListener('click', () => {
    elm.previousElementSibling.value = '';
  });
});

search.addEventListener('keyup',e =>{
  var items = document.getElementsByClassName('Room')
  var found = value.filter(o =>{
    return o.toLowerCase().includes(e.target.value.toLowerCase())
  })
  if(found.length > 0){
    for(e in items){
      if(found.includes(items[e].innerText)){
        items[e].style.display = "List-item"
      }else{
        items[e].style.display = 'none'
      }
    }
  }else{
    for(e in items){
      items[e].style.display = 'none'
    }
  }
})

function add(name){
  var li = document.createElement('li')
  var a = document.createElement('A')
  a.href = '/join/'+encodeURIComponent(name)
  a.innerText = name
  li.className = 'Room'
  li.appendChild(a)
  ul.appendChild(li)
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

socket.on('connect',()=>{
  socketid = socket.id
})

setInterval(()=>{
  socket.emit('listreq','')
},600)
 

socket.on('list',data=>{
  for(e in data){
    if(!value.includes(data[e])){
      value.push(data[e])
      add(data[e])
    }
  }
  var rlist = document.getElementsByClassName('list')
  var nodes = rlist.childNodes
  for(e in nodes){
    if(!value.includes(nodes[e].innerText)){
      alert(nodes[e])
      rlist.removeChild(nodes[e])
    }
  }
})