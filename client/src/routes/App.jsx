import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './App.css'
import { updateProfile } from "firebase/auth";
import React, { useEffect, useState, forwardRef } from "react";
import DuoIcon from '@mui/icons-material/Duo';
import Snackbar from '@mui/material/Snackbar';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import AppBar from '@mui/material/AppBar';
import Dialog from '@mui/material/Dialog';
import PlusIcon from '@mui/icons-material/Add'
import Slide from '@mui/material/Slide';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import getGravatar from './../lib/gravatar'
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import delay from '../lib/delay';
import { collection, setDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import ArrowDropdownIcon from '@mui/icons-material/ArrowDropDown'

function App({ auth, socket, db }) {
  const [quote, setQuote] = useState(null)
  const [displayName, setDisplayName] = useState("")
  const [time, setTime] = useState(new Date())
  const [attendanceList, setAttendanceList] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentSelectedListAttendance, setSelectedListAttendance] = useState(null);
  const [attendanceAnchor, setAttendanceAnchor] = useState(null);
  const [meetingCode, setMeetingCode] = useState("")
  const [snackBarOpen, setSnackBarOpen] = useState(false)
  const [snackbarText, setSnackBarText] = useState("")
  const [hostLetYouInDialog, setHostLetYouInDialog] = useState(false)
  const [displayNameDialog, setDisplayNameDialog] = useState(false)
  const [showJoinRoomDialog, setJoinRoomDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openAttendanceMenu = (event) => {
    setAttendanceAnchor(event.currentTarget);
  };

  const closeAttendanceMenu = () => {
    setAttendanceAnchor(null);
  };

  const navigate = useNavigate()

  const createMeeting = () => {
    if (auth.currentUser == null) {
      setSnackBarText("You are not logged in!")
      setSnackBarOpen(true)
      setTimeout(() => navigate("login"), 1000)
    } else {
      if (!auth.currentUser.displayName) {
        setSnackBarText("Set your name before creating room!")
        setSnackBarOpen(true)
      } else {
        setCreateDialogOpen(true)
      }
    }
  }

  const joinMeeting = (roomId) => {
    if (auth.currentUser == null) {
      setSnackBarText("You are not logged in!")
      setSnackBarOpen(true)
      setTimeout(() => navigate("login"), 1000)
    } else {
      if (!auth.currentUser.displayName) {
        setSnackBarText("Set your name before creating room!")
        setSnackBarOpen(true)
      } else {
        socket.emit("joinRoom", auth.currentUser.uid, auth.currentUser.displayName || "participant", roomId);
      }
    }
  }

  useEffect(() => {
    (async () => {
      setQuote((await (await fetch('https://api.quotable.io/random')).json()).content);
    })()
  }, []) 

  useEffect(() => {
    let unsubscribeAttendanceList = null
    auth.onAuthStateChanged(() => {
      if (unsubscribeAttendanceList) {
        unsubscribeAttendanceList()
        unsubscribeAttendanceList = null
      }
      if (auth.currentUser == null) {
        setSnackBarText("You are not logged in!")
        setSnackBarOpen(true)
        setTimeout(() => navigate("login"), 1000)
      } else {
        unsubscribeAttendanceList = onSnapshot(collection(db, auth.currentUser.uid), snapshot => {
          const list = []
          snapshot.forEach(doc => {
            list.push(doc.id)
          })
          setAttendanceList(list)
          if (attendanceList.length > 0) {
            setSelectedListAttendance(attendanceList[0])
          }
        })
        if (!auth.currentUser.photoURL) {
          updateProfile(auth.currentUser, {
            photoURL: getGravatar(auth.currentUser.email)
          })
        }
        if (auth.currentUser.displayName) {
          setDisplayName(auth.currentUser.displayName)
        }
      }
    })
    setInterval(() => {
      setTime(new Date())
    }, 1000);

    socket.on('leftWaitingRoom', (roomId) => {
      setSnackBarText('Left waiting room')
      setSnackBarOpen(true)
      setHostLetYouInDialog(false)
    })

    socket.on('couldNotLeaveWaitingRoom', roomId => {
      setSnackBarText("Could not leave waiting room!")
      setSnackBarOpen(true)
    })

    socket.on('getRoomId', roomId => {
      navigate(`/room?room=${roomId}`)
    })
    socket.on('couldNotCreateRoom', () => {
      setSnackBarText("Could not create room!")
      setSnackBarOpen(true)
    })

    socket.on('couldNotJoinRoom', () => {
      setSnackBarText("Could not join room!")
      setSnackBarOpen(true)
    })

    socket.on('hostWillLetYouIn', (roomId) => {
      setHostLetYouInDialog(true)
    })

    socket.on('joinedRoom', async (roomId) => {
      setSnackBarText('Joined room')
      setSnackBarOpen(true)
      await delay(1000)
      navigate(`/room?room=${roomId}`)
    })

  }, [])


  return (
    <div className="Front bg-gradient-to-r from-slate-900 to-blue-800 min-h-screen">
      <AppBar position="static" className="p-3 bg-gradient-to-r from-slate-800 to-blue-500 flex items-center" elevation={10} style={{ flexDirection: 'row' }}>
        <span className='text-lg'>Face App</span>
        {auth.currentUser && (
          <>
            <IconButton
              className='right-2'
              sx={{ position: 'absolute', right: '0.5rem' }}
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
            >
              <img src={auth.currentUser?.photoURL || ""} className='w-10 h-10 rounded-full' alt="Profile picture" />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => {
                handleClose()
                setDisplayNameDialog(true)
              }}>Change Display Name</MenuItem>

              <MenuItem onClick={() => navigate("/attendance")}>Visit Attendance Portal</MenuItem>
            </Menu>
          </>
        )
        }
      </AppBar>
      <div className="flex flex-col items-center min-h-screen md:flex-row md:items-start md:h-screen pb-16 select-none">
        <div className="flex flex-row md:pt-20 md:pl-16 justify-center gap-5 action-meetings">
          <div className='flex-container'>
            <div className="flex flex-col items-center hover:bg-slate-700 cursor-pointer rounded-md active:scale-90" onClick={() => createMeeting()}>
              <DuoIcon style={{
                color: "blue",
                height: "calc(3.5rem + 10vh)",
                width: "calc(3.5rem + 10vw)"
              }} />
              <span className='text-xl mt-2'>New Meeting</span>
            </div>

          </div>
          <div className="flex-container">
            <div className="flex flex-col items-center p-4 hover:bg-slate-700 cursor-pointer rounded-md active:scale-90" onClick={() => setJoinRoomDialog(true)}>
              <div className="p-4 mt-2 bg-slate-900 rounded-xl">
                <PlusIcon style={{
                  color: "orange",
                  width: "4rem",
                  height: "4rem"
                }} />
              </div>
              <span className="text-xl mt-2">Join Meeting</span>
            </div>

          </div>
        </div>
        <div className="flex flex-col items-center min-h-full pt-20 timer">
          <div className="time-cont flex flex-col items-center shadow-lg  shadow-blue-700 border border-blue-500">
            <div className="time-inner flex flex-col items-center px-32 py-8 bg-gray-800 w-full">
              <span className="text-4xl font-bold mb-4">
                {time.toLocaleTimeString()}
              </span>
              <span className="text-xl">{time.toDateString()}</span>
            </div>
            <div className="w-full py-32 px-32 bg-gradient-to-r from-slate-600 to-gray-700 flex flex-col items-center justify-center">
              <span className='text-xl'>{quote || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        style={{
          left: "35%"
        }}
        open={snackBarOpen}
        onClose={() => setSnackBarOpen(false)}
        autoHideDuration={3000}
        message={snackbarText} />

      <Dialog
        open={createDialogOpen}
        TransitionComponent={SlideUpTransition}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create a Meeting</DialogTitle>
        <DialogContent>
          <DialogContentText>Select an attendance list</DialogContentText>
          <div className='p-6 w-full'>
            <Typography
              className='bg-gradient-to-r py-1 px-5 from-orange-500 to-red-500 shadow-xl shadow-orange-400 border border-red-600 rounded-md text-center text-black w-full'
              sx={{ cursor: 'pointer', minHeight: '2rem', fontSize: '1.3rem' }}
              aria-label="account of current user"
              aria-controls="attendance-list"
              aria-haspopup="true"
              onClick={openAttendanceMenu}
            >{currentSelectedListAttendance || '---'}<ArrowDropdownIcon /></Typography>
            <Menu
              id="attendance-list"
              anchorEl={attendanceAnchor}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(attendanceAnchor)}
              onClose={closeAttendanceMenu}
            >
              {attendanceList.map(item => (
                <MenuItem key={item} onClick={() => {
                  closeAttendanceMenu()
                  setSelectedListAttendance(item)
                }}>{item}</MenuItem>
              ))}
            </Menu>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setCreateDialogOpen(false)
            socket.emit("createRoom", auth.currentUser.uid, auth.currentUser.displayName, currentSelectedListAttendance, new Date().getTime())
          }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullScreen
        open={hostLetYouInDialog}
        TransitionComponent={SlideUpTransition}
      >
        <div className="w-full h-full flex flex-col bg-slate-800">
          <button className="py-2 px-3 bg-red-600 text-white self-end" onClick={() => {
            socket.emit('leaveWaitingRoom', auth.currentUser.uid, meetingCode)
          }}>Leave</button>
          <div className="di-cont w-full flex-wrap flex flex-col items-center justify-center">
            <span className='text-center text-white'>The host will let you in soon</span>
          </div>
        </div>
      </Dialog>
      <Dialog
        TransitionComponent={SlideUpTransition}
        open={showJoinRoomDialog}
        onClose={() => { setMeetingCode(""); setJoinRoomDialog(false) }}
      >
        <DialogTitle>Join Meeting</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the meeting code the host has provided you to join the meeting
          </DialogContentText>
          <TextField
            autoFocus
            onChange={(e) => setMeetingCode(e.target.value)}
            margin="dense"
            label="Enter meeting code"
            type="number"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMeetingCode(""); setJoinRoomDialog(false) }}>Cancel</Button>
          <Button onClick={() => {
            joinMeeting(meetingCode)
            setJoinRoomDialog(false)
          }}>Join</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        TransitionComponent={SlideUpTransition}
        open={displayNameDialog}
        onClose={() => { setDisplayName(auth.currentUser.displayName || ""); setDisplayNameDialog(false) }}
      >
        <DialogTitle>Change Display Name</DialogTitle>
        <DialogContent>
          <TextField
            value={displayName}
            autoFocus
            onChange={(e) => setDisplayName(e.target.value)}
            margin="dense"
            label="Enter your name"
            type="text"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDisplayName(auth.currentUser.displayName || ""); setDisplayNameDialog(false) }}>Cancel</Button>
          <Button onClick={() => {
            updateProfile(auth.currentUser, {
              displayName: displayName
            }).then(() => {
              setSnackBarText("Changed name successfully!")
              setSnackBarOpen(true)
            }).finally(() => {
              setDisplayName(auth.currentUser.displayName || "")
              setDisplayNameDialog(false)
            })
          }}>Change</Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}

const SlideUpTransition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default App