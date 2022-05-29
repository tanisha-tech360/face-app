import express from 'express';
import { createServer } from 'http'
import cors from 'cors'
import { Server } from "socket.io"
import cred from './face-recognition-app-de529-firebase-adminsdk-q4qt5-f3d26f0bfe.js'
import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const firebaseApp = initializeApp({ credential: admin.credential.cert(cred) });
const auth = getAuth(firebaseApp)
const db = getFirestore()
const app = express()
// app.use(cors())
app.use(express.static(`${__dirname}/public`))
app.use(express.json({
  limit: '30mb'
}))
const server = createServer(app)
const io = new Server(server, {
  // cors: {
  //   origin: "*"
  // }
})
function getCurrentDate(today = new Date()) {
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();

  return `${mm}-${dd}-${yyyy}`;
}
const rooms = {};
io.on('connection', socket => {
  var idUser = null
  socket.on("createRoom", (userId, displayName, attendanceListId, meetingDate) => {
    auth.getUser(userId).then(user => {
      if (user != null && typeof user !== 'undefined') {
        var id = parseInt(Math.random() * 100000)
        while (rooms[id]) {
          id = parseInt(Math.random() * 100000);
        }
        if (!idUser) {
          idUser = userId
        }
        rooms[id] = {
          host: {
            socket: socket,
            id: userId,
            name: displayName,
            attendanceListId: attendanceListId,
            meetingDate: meetingDate
          },
          waitingRoom: [],
          participants: []
        }
        console.log(rooms)
        socket.emit("getRoomId", id)
      } else {
        socket.emit("couldNotCreateRoom")
      }
    }).catch((e) => {
      console.error(e)
      socket.emit("couldNotCreateRoom")
    })
  })
  socket.on('joinRoom', (userId, displayName, roomId) => {
    if (!rooms[roomId]) {
      console.log(rooms)
      socket.emit('couldNotJoinRoom', roomId)
    } else {
      auth.getUser(userId).then(user => {
        if (user != null && typeof user !== 'undefined') {
          if (!idUser) {
            idUser = userId
          }
          const room = rooms[roomId]
          room.waitingRoom.push(
            {
              socket: socket,
              id: userId,
              name: displayName
            }
          )
          room.host.socket.emit('getWaitingRoom', {
            participants: room.waitingRoom.map(p => ({ id: userId, displayName: displayName }))
          })
          socket.emit('hostWillLetYouIn', roomId)
        } else {
          console.log('User does not exist!')
          socket.emit("couldNotJoinRoom")
        }
      }).catch(() => {
        console.log('Could not fetch user!')
        socket.emit('couldNotJoinRoom')
      })
    }
  })
  socket.on('allowParticipant', (hostId, participantId, roomId) => {
    if (!rooms[roomId]) {
      console.log('Room does not exist!')
      socket.emit('roomNotPresent', roomId)
    } else {
      auth.getUser(hostId).then(host => {
        if (host != null && typeof host !== 'undefined' && rooms[roomId].host.id == hostId) {
          auth.getUser(participantId).then(participant => {
            if (participant != null && typeof participant !== 'undefined') {
              const room = rooms[roomId]
              const index = room.waitingRoom.findIndex(user => user.id == participantId)
              if (index < 0) {
                console.log('Participant not in waiting room!')
                socket.emit("couldNotAllowParticipant")
              } else {
                if (room.participants.findIndex(user => user.id == participantId) > -1) {
                  console.log('Participant already present!')
                  socket.emit("couldNotAllowParticipant")
                } else {
                  const [participant] = room.waitingRoom.splice(index, 1)
                  room.participants.push(participant)
                  participant.socket.emit('joinedRoom', roomId)
                  socket.emit('getWaitingRoom', {
                    participants: room.waitingRoom.map(p => ({ id: userId, displayName: displayName }))
                  })
                }
              }
            } else {
              console.log('Participant does not exist!')
              socket.emit("couldNotAllowParticipant")
            }
          }).catch(() => {
            console.log('Could not fetch participant!')
            socket.emit("couldNotAllowParticipant")
          })
        } else {
          console.log('Host error!')
          socket.emit("couldNotAllowParticipant")
        }
      }).catch(() => {
        console.log('Could not fetch host!')
        socket.emit('couldNotAllowParticipant')
      })
    }
  })
  socket.on('kickParticipant', (hostId, participantId, roomId) => {
    if (!rooms[roomId]) {
      socket.emit('roomNotPresent', roomId)
    } else {
      auth.getUser(hostId).then(host => {
        if (host != null && typeof host !== 'undefined' && rooms[roomId].host.id == hostId) {
          auth.getUser(participantId).then(participant => {
            if (participant != null && typeof participant !== 'undefined') {
              const room = rooms[roomId]
              const index = room.participants.findIndex(user => user.id == participantId)
              if (index < 0) {
                socket.emit("couldNotRemoveParticipant")
              } else {
                const [participant] = room.participants.splice(index, 1)
                participant.socket.emit('removedFromHost', roomId)
              }
            } else {
              socket.emit("couldNotRemoveParticipant")
            }
          }).catch(() => [
            socket.emit("couldNotRemoveParticipant")
          ])
        } else {
          socket.emit("couldNotRemoveParticipant")
        }
      }).catch(() => socket.emit('couldNotRemoveParticipant'))
    }
  })
  socket.on('leaveMeeting', (userId, roomId) => {
    if (!rooms[roomId]) {
      socket.emit('couldNotLeaveMeeting', roomId)
    } else {
      auth.getUser(userId).then(user => {
        if (user != null && typeof user !== 'undefined') {
          if (!idUser) {
            idUser = userId
          }
          const room = rooms[roomId]
          if (room.host.id == userId) {
            delete room.host
            room.waitingRoom.forEach(participant => {
              participant.socket.emit('meeting-ended', roomId)
            })
            room.waitingRoom = [];
            room.participants.forEach(participant => {
              participant.socket.emit('meeting-ended', roomId)
            })
            room.participants = [];
            socket.emit('meeting-ended')
            delete rooms[roomId]
          } else {
            const index = room.participants.findIndex(user => user.id == userId)
            if (index < 0) {
              socket.emit("couldNotLeaveMeeting")
            } else {
              const [participant] = room.participants.splice(index, 1)
              socket.emit('leftMeeting', roomId)
            }
          }
        } else {
          socket.emit("couldNotLeaveMeeting")
        }
      }).catch(() => socket.emit('couldNotLeaveMeeting'))
    }
  })
  socket.on('leaveWaitingRoom', (userId, roomId) => {
    if (!rooms[roomId]) {
      socket.emit('couldNotLeaveWaitingRoom', roomId)
    } else {
      auth.getUser(userId).then(user => {
        if (user != null && typeof user !== 'undefined') {
          if (!idUser) {
            idUser = userId
          }
          const room = rooms[roomId]
          const index = room.waitingRoom.findIndex(user => user.id == userId)
          if (index < 0) {
            socket.emit("couldNotLeaveWaitingRoom")
          } else {
            room.waitingRoom.splice(index, 1)
            room.host.socket.emit('getWaitingRoom', {
              participants: room.waitingRoom.map(p => ({ id: userId, displayName: displayName }))
            })
            socket.emit('leftWaitingRoom', roomId)
          }
        } else {
          socket.emit("couldNotLeaveWaitingRoom")
        }
      }).catch(() => socket.emit('couldNotLeaveWaitingRoom'))
    }
  })
  socket.on('endMeeting', (hostId, roomId) => {
    if (!rooms[roomId]) {
      socket.emit('roomNotPresent', roomId)
    } else {
      auth.getUser(hostId).then(host => {
        if (host != null && typeof host !== 'undefined' && rooms[roomId].host.id == hostId) {
          const room = rooms[roomId]
          room.waitingRoom.forEach(participant => {
            participant.socket.emit('meeting-ended', roomId)
          })
          room.waitingRoom = [];
          room.participants.forEach(participant => {
            participant.socket.emit('meeting-ended', roomId)
          })
          room.participants = [];
          socket.emit('meeting-ended')
          delete rooms[roomId]
        } else {
          socket.emit('couldNotEndMeeting')
        }
      }).catch(() => socket.emit('couldNotEndMeeting'))
    }
  })
  socket.on('disconnect', () => {
    if (idUser) {
      Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId]
        if (room) {
          if (room.host.id == idUser) {
            delete room.host
            room.waitingRoom.forEach(participant => {
              participant.socket.emit('meeting-ended', roomId)
            })
            room.waitingRoom = [];
            room.participants.forEach(participant => {
              participant.socket.emit('meeting-ended', roomId)
            })
            room.participants = [];
            socket.emit('meeting-ended')
            delete rooms[roomId]
          } else {
            const i = room.waitingRoom.findIndex(user => user.id == idUser)
            if (i > -1) {
              room.waitingRoom.splice(i, 1)
              room.host.socket.emit('getWaitingRoom', {
                participants: room.waitingRoom.map(p => ({ id: userId, displayName: displayName }))
              })
            }
            const j = room.participants.findIndex(user => user.id == idUser)
            if (j > -1) {
              room.participants.splice(i, 1)
            }
          }
        }
      })
    }
  })
})

const sendPage = (res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
  res.end()
}

app.get('/', (req,res) => sendPage(res))
app.get('/login', (req,res) => sendPage(res))
app.get('/signup', (req,res) => sendPage(res))
app.get('/room', (req,res) => sendPage(res))
app.get('/attendance', (req,res) => sendPage(res))

app.get('/roomMemberExists/:roomId/:uid', (req, res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    if (room.host.id == req.params.uid || room.participants.findIndex(p => p.id == req.params.uid) > -1) {
      res.end("true")
    } else {
      res.end("false")
    }
  } else {
    res.end("false")
  }
})

app.get('/isHost/:roomId/:uid', (req, res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    if (room.host.id == req.params.uid) {
      res.end("true")
    } else {
      res.end("false")
    }
  } else {
    res.end("false")
  }
})

app.get('/get_host/:roomId', (req,res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    res.end(room.host.id)
  } else {
    res.status(400)
    res.end()
  }
})

app.get('/getAttendanceListId/:roomId', (req,res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    res.end(room.host.attendanceListId);
  } else {
    res.status(400);
    res.end();
  }
})

app.get('/getPhoto/:roomId/:uid', async (req,res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    const listId = room.host.attendanceListId
    if (listId) {
      const pData = (await db.doc(`${room.host.id}/${listId}/participants/${req.params.uid}`).get())
      if (pData.exists) {
        res.end(pData.data().photo)
      } else {
        res.end("null")
      }
    } else {
      res.end("null")
    }
  } else {
    res.status(400);
    res.end();
  }
})

app.get('/meetingDate/:roomId', (req,res) => {
  const room = rooms[req.params.roomId]
  if (room) {
    res.end(getCurrentDate(new Date(room.host.meetingDate)))
  } else {
    res.status(400);
    res.end();
  }
})

app.post('/get_uid_by_email', (req, res) => {
  console.log(req.body)
  if (typeof req.body === "undefined" || typeof req.body.email !== "string") {
    res.status(400);
    res.end();
  } else {
    auth.getUserByEmail(req.body.email).then(user => res.end(user.uid)).catch(e => {
      console.log(e)
      res.status(402)
      res.end()
    })
  }
})

app.get('/getDatesInSelection/:uid/:selection', async (req,res) => {
  const snapshot = (await db.collection(`${req.params.uid}/${req.params.selection}/attendance`).listDocuments())
  const dates = []
  for (let doc of snapshot) {
    dates.push(doc.id)
  }
  res.end(JSON.stringify(dates))
})

app.get('/getSessionsInDate/:uid/:selection/:date', async (req,res) => {
  const snapshot = (await db.collection(`${req.params.uid}/${req.params.selection}/attendance/${req.params.date}/sessions`).listDocuments())
  const sessions = []
  for (let doc of snapshot) {
    sessions.push(doc.id)
  }
  res.end(JSON.stringify(sessions))
})

app.get('/get_email_by_uid/:uid', (req,res) => {
  auth.getUser(req.params.uid).then(user => {
    res.end(user.email)
  }).catch(e => {
    console.log(e)
    res.status(400)
    res.end()
  })
})


server.listen(process.env.PORT || 3030)