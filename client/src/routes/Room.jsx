import { useEffect, useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './Room.css'
import './Common.css'
import roomer from './../lib/room_rtc'
import join from './../lib/room_rtm.js'
import Snackbar from '@mui/material/Snackbar';
import delay from './../lib/delay.js'
import webUrl from './../lib/webUrl'
import { Button } from '@mui/material';

function Room({ auth, socket, db }) {
  const navigate = useNavigate()
  const [idRoom, setRoomId] = useState(null)
  const [snackBarOpen, setSnackBarOpen] = useState(false)
  const [snackbarText, setSnackBarText] = useState("")
  const [waitingParticipants, setWaitingParticipants] = useState([])
  const [isHost, setIsHost] = useState(false)
  const messagesContainer = useCallback(node => {
    if (node !== null) {
      node.scrollTop = node.scrollHeight;
    }
  }, [])

  const invite = async () => {
    if (idRoom != null) {
      await navigator.share({
        text: `To join this meeting go to https://face-api-917.herokuapp.com. Then click Join Meeting and enter the code ${idRoom}`
      })
    }
  }

  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  useEffect(() => {
    auth.onAuthStateChanged(async () => {
      if (auth.currentUser == null) {
        navigate("/login")
        return;
      } else {
        const roomId = getParameterByName('room')
        if (!roomId || !Boolean(await (await fetch(`${webUrl}roomMemberExists/${roomId}/${auth.currentUser.uid}`)).text())) {
          setSnackBarText("This room does not exist or you are not present in this room!")
          setSnackBarOpen(true)
          await delay(1000)
          navigate("/")
          return;
        }
        setRoomId(roomId)
        const host = Boolean(await (await fetch(`${webUrl}isHost/${roomId}/${auth.currentUser.uid}`)).text())
        setIsHost(host)
        if (host) {
          socket.on('getWaitingRoom', ({ participants }) => {
            setWaitingParticipants(participants)
          })
        }

        const hostId = await (await fetch(`${webUrl}get_host/${roomId}`)).text()
        const attendanceListId = await (await fetch(`${webUrl}getAttendanceListId/${roomId}`)).text()
        const photoKnown = await (await fetch(`${webUrl}getPhoto/${roomId}/${auth.currentUser.uid}`)).text()
        const meetingDate = await (await fetch(`${webUrl}meetingDate/${roomId}`)).text()
        const takeAttendance = photoKnown && photoKnown !== "null"

        let expandVideoFrame = (e) => {
          let child = displayFrame.children[0]
          if (child) {
            document.getElementById('streams__container').appendChild(child)
          }
          displayFrame.style.display = 'block'
          e.currentTarget.style.width = '100%';
          e.currentTarget.style.height = '100%';
          displayFrame.appendChild(e.currentTarget)
          userIdInDisplayFrame.value = e.currentTarget.id

          for (let i = 0; videoFrames.length > i; i++) {
            if (videoFrames[i].id != userIdInDisplayFrame.value) {
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }

        }
        let displayFrame = document.getElementById("stream_box")

        const msgInit = join()
        let userIdInDisplayFrame = {
          value: null
        };
        roomer(auth.currentUser.uid, expandVideoFrame, displayFrame, userIdInDisplayFrame, auth.currentUser.displayName, msgInit, hostId, attendanceListId, db, meetingDate, takeAttendance, photoKnown)
        let videoFrames = document.getElementsByClassName("video_container")

        for (let i = 0; videoFrames.length > i; i++) {
          videoFrames[i].addEventListener('click', expandVideoFrame)
        }
        let hideDisplayFrame = () => {
          userIdInDisplayFrame.value = null
          displayFrame.style.display = null
          let child = displayFrame.children[0]
          document.getElementById('streams__container').appendChild(child)
          for (let i = 0; videoFrames.length > i; i++) {
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
          }
        }
        displayFrame.addEventListener('click', hideDisplayFrame)
      }
    })

    socket.on('meeting-ended', async () => {
      setSnackBarText("Meeting has ended!")
      setSnackBarOpen(true)
      await delay(1000)
      window.open('/', '_self')
    })
  }, [])

  const memberContainer = useRef(null);
  const chatContainer = useRef(null);

  const [activeMemberContainer, setActiveMemberContainer] = useState(false);
  const [activeChatContainer, setActiveChatContainer] = useState(false);

  return (
    <>
      <div>
        <header id="nav" className='bg-slate-700 px-6 py-3'>
          <div className="nav--list">
            <button id="members__button" onClick={() => {
              if (activeMemberContainer) {
                memberContainer.current.classList.add('hidden')
                memberContainer.current.classList.remove('shown')
              } else {
                memberContainer.current.classList.remove('hidden')
                memberContainer.current.classList.add('shown')
              }
              setActiveMemberContainer(ac => !ac)
            }}>
              <svg width={24} height={24} xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd"><path d="M24 18v1h-24v-1h24zm0-6v1h-24v-1h24zm0-6v1h-24v-1h24z" fill="#ede0e0"><path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z" /></path></svg>
            </button>
            <span className="text-lg font-semibold select-none">Face App</span>
          </div>
          <div id="nav__links">
            <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" onClick={() => invite()}>Invite</button>
            <button id="chat__button" onClick={() => {
              if (activeChatContainer) {
                chatContainer.current.style.display = 'none';
              } else {
                chatContainer.current.style.display = 'block';
              }
              setActiveChatContainer(activeChatContainer => !activeChatContainer)
            }}><svg width={24} height={24} xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" fill="#ede0e0" clipRule="evenodd"><path d="M24 20h-3v4l-5.333-4h-7.667v-4h2v2h6.333l2.667 2v-2h3v-8.001h-2v-2h4v12.001zm-15.667-6l-5.333 4v-4h-3v-14.001l18 .001v14h-9.667zm-6.333-2h3v2l2.667-2h8.333v-10l-14-.001v10.001z" /></svg></button>
          </div>
        </header>
        <main className="container bg-gradient-to-r from-slate-800 to-gray-600">
          <div id="room__container">
            <section id="members__container" className='bg-gradient-to-r from-slate-900 to-gray-700' ref={memberContainer}>
              {isHost && (
                <div className="waiting__room w-full">
                  {waitingParticipants.length > 0 && (<>
                    <div className="w-full px-2 py-1 bg-gradient-to-r from-slate-700 to-stone-500 flex flex-row gap-2 mb-2">
                      <span className='text-sm'>Waiting Participants</span>
                      <span className='bg-slate-800 p-4'>{waitingParticipants.length}</span>
                    </div>
                  </>)}
                  {waitingParticipants.map(participant => (
                    <div className="flex flex-row w-full pl-2" key={participant.id}>
                      <span className='text-sm'>{participant.displayName}</span>
                      <button className='ml-2 focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-3 py-1 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900' onClick={() => {
                        socket.emit('allowParticipant', auth.currentUser.uid, participant.id, getParameterByName('room'))
                      }}>Allow</button>
                    </div>
                  ))}
                </div>
              )}
              <div id="members__header">
                <p>Participants</p>
                <strong id="members__count">0</strong>
              </div>
              <div id="member__list" />
            </section>
            <section id="stream__container">
              <div id="stream_box"> </div>
              <div id="streams__container" />
              <div className="stream__actions">
                <button id="camera-btn" className="active">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" /></svg>
                </button>
                <button id="mic-btn" className="active">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" /></svg>
                </button>
                {/* <button id="screen-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path d="M0 1v17h24v-17h-24zm22 15h-20v-13h20v13zm-6.599 4l2.599 3h-12l2.599-3h6.802z" /></svg>
                </button> */}
                <button id="leave-btn" onClick={() => {
                  if (auth.currentUser != null && idRoom != null) {
                    socket.emit('leaveMeeting', auth.currentUser.uid, idRoom)
                  }
                  window.open('/', '_self')
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path d="M16 10v-5l8 7-8 7v-5h-8v-4h8zm-16-8v20h14v-2h-12v-16h12v-2h-14z" /></svg>
                </button>
              </div>
            </section>
            <section id="messages__container" className="bg-gradient-to-r from-stone-800 to-slate-800" ref={chatContainer}>
              <div id="messages" ref={messagesContainer} />
              <div id="message__form">
                <input type="text" name="message" placeholder="Send a message...." />
              </div>
            </section>
          </div>
        </main>
        <Snackbar
          style={{
            left: "35%"
          }}
          open={snackBarOpen}
          onClose={() => setSnackBarOpen(false)}
          autoHideDuration={3000}
          message={snackbarText} />
      </div>
    </>
  )
}


export default Room