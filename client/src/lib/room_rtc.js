import { setDoc, doc } from 'firebase/firestore'
import faceSimilarity from './api.js'

export default function roomer(uid, expandVideoFrame, displayFrame, userIdInDisplayFrame, displayName, msgInit, hostId, attendanceListId, db, meetingDate, takeAttendance = false, knownImageUrl = null) {
  const APP_ID = "08112eb80c574bbb897daea7663ef115"
  let token = null;
  let client;
  let rtmClient;
  let channel;

  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  let roomId = urlParams.get('room')

  let localTracks = []
  let remoteUsers = {}

  // let localScreenTracks;
  // let sharingScreen = false;

  let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')
    let newMessage = `<div class="message__wrapper">
                           <div class="message__body__bot">
                             <strong class="message__author__bot">🤖 Face-app Bot</strong>
                             <p class="message__text__bot">${botMessage}</p>
                            </div>
                          </div>`
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)
    let lastMessage = document.querySelector('messages .message__wrapper :last-child')
    if (lastMessage) {

      lastMessage.scrollIntoView()
    }

  }

  let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({ uid, token })
    await rtmClient.addOrUpdateLocalUserAttributes({ 'name': displayName })

    channel = await rtmClient.createChannel(roomId)
    await msgInit(channel, rtmClient, addBotMessageToDom, displayName)
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handelUserPublished)
    client.on('user-left', handleUserLeft)
    jointStream()
  }
  let jointStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
      encoderConfig: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min:/*480*/ 240, ideal: 1080, max: 1080 }
      }
    })

    let player = `<div class="video_container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                      </div>`

    document.getElementById('stream__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
    
    console.log("Take Attendance", takeAttendance)
    if (takeAttendance) {
      const videoElement = document.querySelector(`div#user-${uid} video`)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      let isPresent = false
      console.log(videoElement)
      async function attendance() {
        console.log('Play Enter')
        if (!videoElement.paused && !videoElement.ended && !isPresent) {
          console.log('Play context')
          ctx.drawImage(videoElement, 0, 0);
          const unknownImageUrl = canvas.toDataURL("image/png")
          console.log("Unknown Url")
          if (await faceSimilarity(knownImageUrl, unknownImageUrl)) {
            isPresent = true
            await setDoc(doc(db, hostId, attendanceListId, 'attendance', meetingDate, 'sessions', roomId, 'participants', uid), {
              present: true
            })
            console.log("Recorded attendance")
          }
        }
      }
      attendance()
      setInterval(attendance, 2500)
    }
  }
  // let switchToCamera = async () => {
  //   let player = `<div class="video_container" id="user-container-${uid}">
  //       <div class= "video-player" id="user-${uid}"></div>
  //       </div>`
  //   displayFrame.insertAdjacentHTML('beforeend', player)
  //   await localTracks[0].setMuted(true)
  //   await localTracks[1].setMuted(true)
  //   document.getElementById('mic-btn').classList.remove('active')
  //   document.getElementById('screen-btn').classList.remove('active')
  //   localTracks[1].play(`user-${uid}`)
  //   await client.publish([localTracks[1]])

  // }

  let handelUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)
    if (player == null) {
      player = ` <div class="video_container" id="user-container-${user.uid}">
                     <div class= "video-player" id="user-${user.uid}"></div>
                     </div>`

      document.getElementById('stream__container').insertAdjacentHTML('beforeend', player)
      document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
    }
    if (displayFrame.style.display) {
      let videoFrame = document.getElementById(`user-container-${user.uid}`)
      videoFrame.style.height = '100px'
      videoFrame.style.width = '100px'
    }
    if (mediaType === 'video') {
      user.videoTrack.play(`user-${user.uid}`)
    }
    if (mediaType === 'audio') {
      user.audioTrack.play()

    }
  }
  let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    let item = document.getElementById(`user-container-${user.uid}`)
    if (item) {
      item.remove()
    }
    if (userIdInDisplayFrame.value === `user-container-${user.uid}`) {
      displayFrame.style.display = null

      let videoFrames = document.getElementsByClassName("video_container")

      for (let i = 0; videoFrames.length > i; i++) {
        videoFrames[i].style.height = '300px'
        videoFrames[i].style.width = '300px'
      }
    }
  }
  let toggleMic = async (e) => {
    let button = e.currentTarget

    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false)
      button.classList.add('active')
    }
    else {
      await localTracks[0].setMuted(true)
      button.classList.remove('active')
    }
  }
  let toggleCamera = async (e) => {
    let button = e.currentTarget

    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false)
      button.classList.add('active')
    }
    else {
      await localTracks[1].setMuted(true)
      button.classList.remove('active')
    }


  }
  // let toggleScreen = async (e) => {
  //   let screenButton = e.currentTarget
  //   let cameraButton = document.getElementById('camera-btn')

  //   if (!sharingScreen) {
  //     sharingScreen = true
  //     screenButton.classList.add('active')
  //     cameraButton.classList.remove('active')
  //     cameraButton.style.display = 'none'
  //     localScreenTracks = await AgoraRTC.createScreenVideoTrack()
  //     document.getElementById(`user-container-${uid}`).remove()
  //     displayFrame.style.display = 'block'

  //     let player = `<div class="video_container" id="user-container-${uid}">
  //                           <div class= "video-player" id="user-${uid}"></div>
  //                        </div>`
  //     displayFrame.insertAdjacentHTML('beforeend', player)
  //     document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
  //     userIdInDisplayFrame.value = `user-container-${uid}`
  //     localScreenTracks.play(`user-${uid}`)
  //     await client.unpublish([localTracks[1]])
  //     await client.publish([localTracks])
  //     let videoFrames = document.getElementsByClassName('video_container')
  //     for (let i = 0; videoFrames.length > i; i++) {
  //       if (videoFrames[i].id != userIdInDisplayFrame.value) {
  //         videoFrames[i].style.height = '100px'
  //         videoFrames[i].style.width = '100px'
  //       }
  //     }
  //   } else {
  //     sharingScreen = false
  //     screenButton.classList.remove('active')
  //     cameraButton.style.display = 'block'
  //     document.getElementById(`user-container-${uid}`).remove()
  //     await client.unpublish([localTracks])
  //   }
  //   switchToCamera()
  // }

  document.getElementById('camera-btn').addEventListener('click', toggleCamera)
  document.getElementById('mic-btn').addEventListener('click', toggleMic)
  // document.getElementById('screen-btn').addEventListener('click', toggleScreen)
  joinRoomInit()

}