import Tooltip from '@mui/material/Tooltip';
import { Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import { collection, setDoc, doc, getDoc, onSnapshot, getDocs } from 'firebase/firestore'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState, forwardRef } from 'react';
import Slide from '@mui/material/Slide';
import './attendance.css';
import PlusIcon from '@mui/icons-material/Add'
import ArrowDropdownIcon from '@mui/icons-material/ArrowDropDown'
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import FileInput from '../components/FileInput';
import TextInput from '../components/TextInput';
import fileToBase64 from './../lib/FileRead'
import axios from 'axios';
import webUrl from '../lib/webUrl';
import LinearProgress from '@mui/material/LinearProgress';
import getPercentage from '../lib/getPercentage.js'

export default function Attendance({ auth, db }) {
  const [analyticsList, setAnalyticsList] = useState({});
  const [attendanceList, setAttendanceList] = useState([]);
  const [participantList, setParticipantList] = useState([])
  const [currentSelectedListAttendance, setSelectedListAttendance] = useState(null)
  const [attendanceAnchor, setAttendanceAnchor] = useState(null);
  const [participantDialog, setParticipantDialog] = useState(false)
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  const [newParticipantPhoto, setNewParticipantPhoto] = useState(null)
  const [newItemText, setNewItemText] = useState("")
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true)
  const [snackBarOpen, setSnackBarOpen] = useState(false)
  const [snackbarText, setSnackBarText] = useState("")

  const openAttendanceMenu = (event) => {
    setAttendanceAnchor(event.currentTarget);
  };

  const closeAttendanceMenu = () => {
    setAttendanceAnchor(null);
  };

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
      }
    })
  }, [])

  useEffect(() => {
    let unsubscribeParticipantList = null
    let unsubscribeAnalyticsList = null
    auth.onAuthStateChanged(async () => {
      if (unsubscribeParticipantList) {
        unsubscribeParticipantList()
        unsubscribeParticipantList = null
      }
      if (unsubscribeAnalyticsList) {
        unsubscribeAnalyticsList()
        unsubscribeAnalyticsList = null
      }
      if (auth.currentUser != null) {
        if (currentSelectedListAttendance) {
          const uid = auth.currentUser.uid
          const selection = currentSelectedListAttendance
          console.log(selection)
          setParticipantList([])
          unsubscribeParticipantList = onSnapshot(collection(db, uid, selection, 'participants'), snapshot => {
            const list = [];
            snapshot.forEach(d => {
              const data = d.data()
              list.push({
                id: d.id,
                ...data
              })
            })
            setParticipantList(list)
          })

          setAnalyticsList({})
          const dates = [...(await (await fetch(`${webUrl}getDatesInSelection/${uid}/${selection}`)).json())]
          console.log(dates)
          const analyticsTemp = {}

          let totalSessions = 0;

          for (let date of dates) {
            const sessions = [...(await (await fetch(`${webUrl}getSessionsInDate/${uid}/${selection}/${date}`)).json())]
            totalSessions += sessions.length
            for (let session of sessions) {
              const participantsInSession = await Promise.all(sessions.map(session => getDocs(collection(db, uid, selection, 'attendance', date, 'sessions', session, 'participants'))))
              for (let o of participantsInSession) {
                for (let l of o.docs) {
                  const pEmail = await (await fetch(`${webUrl}get_email_by_uid/${l.id}`)).text()
                  console.log(pEmail)
                  if (typeof analyticsTemp[pEmail] !== "undefined") {
                    analyticsTemp[pEmail]++
                  } else {
                    analyticsTemp[pEmail] = 1
                  }                      
                }
              }
            }
          }

          setAnalyticsList({
            totalSessions: totalSessions,
            analytics: analyticsTemp
          })

        }
      }
    })
  }, [currentSelectedListAttendance])

  return (
    <>
      <div className="m-cont bg-gradient-to-tr from-orange-500 to-red-600 min-h-screen flex flex-col md:flex-row justify-center items-center">
        <div className="chips flex flex-row items-center justify-center md:flex-col gap-3 md:gap-1">
          <Chip label="Analytics" style={{ backgroundColor: isAnalyticsOpen ? 'rgb(51 65 85)' : 'rgb(71 85 105)', color: 'white', borderRadius: '10px' }} onClick={() => {
            setIsAnalyticsOpen(true)
          }} />
          <Chip label="Settings" style={{ backgroundColor: !isAnalyticsOpen ? 'rgb(51 65 85)' : 'rgb(71 85 105)', color: 'white', borderRadius: '10px' }} onClick={() => {
            setIsAnalyticsOpen(false)
          }} />
        </div>
        <div className="f-cont min-h-screen w-full p-4">
          <div className="glassy min-h-screen p-5 flex flex-col items-center w-full">

            <div style={{ minWidth: '50%' }}>
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
                <MenuItem onClick={() => {
                  closeAttendanceMenu()
                  setNewItemDialog(true)
                }}><PlusIcon /> Create New Item</MenuItem>
              </Menu>
            </div>
            {isAnalyticsOpen ? (<>
              {analyticsList.analytics && (
                <>
                  <div className='h-4' />
                  {Object.keys(analyticsList.analytics).map(participantEmail => (
                    <Tooltip title={`Attended ${analyticsList.analytics[participantEmail]} sessions out of ${analyticsList.totalSessions}`} key={participantEmail}>
                      <div className="flex flex-col w-full items-center">
                        <LinearProgress variant="determinate" sx={{ height: '1.5rem', width: '100%', borderRadius: '10px' }} value={getPercentage(analyticsList.analytics[participantEmail], analyticsList.totalSessions)} />
                        <span className="text-lg">{participantEmail}</span>
                      </div>
                    </Tooltip>
                  ))}
                </>
              )}
            </>) : (
              <>
                {participantList.map(participant => (
                  <div key={participant.id} className='w-full flex flex-row'>
                    <img src={participant.photo} alt={participant.email} className='w-10 mr-3 rounded-full shadow-md shadow-orange-300' />
                    <span className='text-base'>{participant.email}</span>
                  </div>
                ))}
                {currentSelectedListAttendance &&
                  <Button className="flex w-fit" variant="contained" sx={{ marginTop: '1rem', borderRadius: '1.2rem' }} onClick={() => {
                    setParticipantDialog(true)
                  }}>
                    <PlusIcon /> Create New Participant
                  </Button>
                }
              </>
            )}
          </div>
        </div>

      </div>

      <Dialog
        TransitionComponent={SlideUpTransition}
        open={participantDialog}
        onClose={() => {
          setNewParticipantEmail("")
          setNewParticipantPhoto(null)
          setParticipantDialog(false)
        }}
      >
        <DialogTitle>Add new Participant</DialogTitle>
        <DialogContent>
          <FileInput accept='image/png, image/jpeg' label='Upload Picture of Participant' onChange={(e) => {
            setNewParticipantPhoto(e.target.files[0])
          }} />
          <TextInput onChange={e => {
            setNewParticipantEmail(e.target.value)
          }} />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => {
            setNewParticipantEmail("")
            setNewParticipantPhoto(null)
            setParticipantDialog(false)
          }}>Cancel</Button>
          <Button onClick={async () => {
            if (!newParticipantPhoto || !newParticipantEmail || !newParticipantPhoto.type.startsWith('image')) {
              setSnackBarText("Enter all fields properly!")
              setSnackBarOpen(true)
            } else {
              const email = newParticipantEmail
              const base64 = await fileToBase64(newParticipantPhoto)
              const userIdRequest = await (async () => {
                try {
                  return (await axios({
                    method: 'POST',
                    url: `${webUrl}get_uid_by_email`,
                    headers: {},
                    data: {
                      email: email
                    }
                  }))
                } catch (e) {
                  return {
                    status: 402
                  }
                }
              })()
              if (!String(userIdRequest.status).startsWith('2')) {
                setSnackBarText('Enter email properly!')
                setSnackBarOpen(true)
              } else {
                const uid = userIdRequest.data
                const docRef = doc(db, auth.currentUser.uid, currentSelectedListAttendance, 'participants', uid);
                if ((await getDoc(docRef)).exists()) {
                  setSnackBarText("User already exists in list!")
                  setSnackBarOpen(true)
                } else {
                  const imgUrl = (await axios({
                    method: 'POST',
                    url: 'https://image-api-8265.herokuapp.com/upload',
                    headers: {},
                    data: {
                      image: base64
                    }
                  })).data
                  console.log(imgUrl)
                  await setDoc(docRef, {
                    email: email,
                    photo: imgUrl
                  })
                  setSnackBarText("Added user successfully!")
                  setSnackBarOpen(true)
                  setParticipantDialog(false)
                }
              }
            }
          }}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        TransitionComponent={SlideUpTransition}
        open={newItemDialog}
        onClose={() => { setNewItemText(""); setNewItemDialog(false); }}
      >
        <DialogTitle>Add new Attendance List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            onChange={(e) => setNewItemText(e.target.value)}
            margin="dense"
            label="Enter name of attendance list"
            type="text"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setNewItemText(""); setNewItemDialog(false); }}>Cancel</Button>
          <Button onClick={async () => {
            if ((await getDoc(doc(db, auth.currentUser.uid, newItemText))).exists()) {
              setSnackBarText("List already exists!")
            } else {
              await setDoc(doc(db, auth.currentUser.uid, newItemText), {
                id: newItemText
              })
              setSnackBarText("Added list!")
            }
            setSnackBarOpen(true)
            setNewItemDialog(false)
          }}>Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        style={{
          left: "35%"
        }}
        open={snackBarOpen}
        onClose={() => setSnackBarOpen(false)}
        autoHideDuration={3000}
        message={snackbarText} />
    </>
  )
}


const SlideUpTransition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});