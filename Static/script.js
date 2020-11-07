const login = document.getElementById('login')
const register = document.getElementById('register')
const form = document.getElementById('form')

let params = (new URL(document.location)).searchParams;

let name = params.get('name')
if(name !== null){
  document.getElementById('text').value = name
}


form.addEventListener('submit',e =>{
   username = document.getElementById('text').value
   password = document.getElementById('password').value
  if(username == '' || password == ''){
    e.preventDefault()
    document.getElementById('text').placeholder = 'Cant be empty'
    document.getElementById('text').placeholder = "Username can't be empty"
    document.getElementById('password').placeholder = "Password can't be empty"
  }
})

register.addEventListener('click',() =>{
  window.location.href = '/createuser'
})

login.addEventListener('click',() =>{
  username = document.getElementById('text').value
  password = document.getElementById('password').value
  if(username !== '' && password !== ''){
    socket.emit('log',{'username':username,'password': password})
  }
})