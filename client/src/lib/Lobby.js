let form = document.getElementById('lobby__form')
let displayName = sessionStorage.getItem('display_name')
if(displayName){
    form.name.value = displayName
}
form.addEventListener('submit',(e) =>{
    e.preventDefault()

    localStorage.setItem('display_name',e.target.name.value)

    let inviteCode  = e.target.room.value
    if(!inviteCode){
        inviteCode = String(Math.floor(Math.random()*1000))
    }
    window.location = `room?room=${inviteCode}`


})