export default function join() {
    return async function (channel, rtmClient, addBotMessageToDom, displayName) {
        await channel.join()
        let handleMemberJoined = async (MemberId) => {
            console.log('A new member has joined the room', MemberId)
            addMemberToDom(MemberId)
            let members = await channel.getMembers()
            updateMemberTotal(members)
            let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
            addBotMessageToDom(`Welcome to the room ${name}! 👋`)
        }
        let handleMemberLeft = async (MemberId) => {
            removeMemberFromDom(MemberId)
            let members = await channel.getMembers()
            updateMemberTotal(members)
        }
        channel.on('MemberJoined', handleMemberJoined)
        let handleChannelMessage = async (messageData, MemberId) => {
            console.log('A new message was received')
            let data = JSON.parse(messageData.text)
            if (data.type === 'chat') {
                addMessageToDom(data.displayName, data.message)
            }

        }
        channel.on('MemberLeft', handleMemberLeft)
        channel.on('ChannelMessage', handleChannelMessage)

        let getMembers = async () => {
            let members = await channel.getMembers()
            updateMemberTotal(members)
            for (let i = 0; members.length > i; i++) {
                addMemberToDom(members[i])
            }
        }
        getMembers()

        let addMemberToDom = async (MemberId) => {
            let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
            let membersWrapper = document.getElementById('member__list')
            let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
        <span class="green__icon" />
        <span class="member_name">${name}</p>
         </div>`
            membersWrapper.insertAdjacentHTML('beforeend', memberItem)

        }
        let updateMemberTotal = async (members) => {
            let total = document.getElementById('members__count')
            total.innerText = members.length
        }
        let removeMemberFromDom = async (MemberId) => {
            let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`)
            let name = memberWrapper.getElementsByClassName('member_name')[0].textContent
            memberWrapper.remove()
            addBotMessageToDom(` ${name} has left the room`)
        }
        let sendMessage = async (e) => {
            e.preventDefault()
            const inputElem = document.querySelector('#message__form > input')
            let message = inputElem.value
            channel.sendMessage({ text: JSON.stringify({ 'type': 'chat', 'message': message, 'displayName': displayName }) })
            addMessageToDom(displayName, message)
            inputElem.value = ''
        }
        let addMessageToDom = (name, message) => {
            let messagesWrapper = document.getElementById('messages')
            let newMessage = `<div class="message__wrapper">
                                  <div class="message__body">
                                    <strong class="message__author">${name}</strong>
                                     <p class="message__text">${message}</p>
                                   </div>
                                </div>`
            messagesWrapper.insertAdjacentHTML('beforeend', newMessage)
            let lastMessage = document.querySelector('messages .message__wrapper :last-child')
            if (lastMessage) {

                lastMessage.scrollIntoView()
            }

        }
        let leaveChannel = async () => {
            await channel.leave()
            await rtmClient.logout()
        }
        window.addEventListener('beforeunload', leaveChannel)
        let messageForm = document.getElementById('message__form')
        messageForm.addEventListener('keyup', (e) => {
            if (e.key == 'enter' || e.keyCode == 13) {
                sendMessage(e)
            }
        })
        // return {
        //     handleMemberJoined,
        //     handleMemberLeft,            
        //     getMembers,
        //     handleChannelMessage            
        // }
    }
}
