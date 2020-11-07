const form = document.getElementById('form')

form.addEventListener('submit',e =>{
   username = document.getElementById('text').value
  if(username == ''){
    e.preventDefault()
    document.getElementById('username').placeholder = "Name can't be empty"
  }
})