import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

import AppBar from '@mui/material/AppBar';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import GoogleIcon from '@mui/icons-material/Google';
import BackIcon from '@mui/icons-material/ArrowBack'
import { useState } from 'react'
import IconButton from '@mui/material/IconButton';
import  { Link } from 'react-router-dom'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

function Login({auth}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [snackBarOpen, setSnackBarOpen] = useState(false)
  const [snackbarText, setSnackBarText] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const openDialog = () => {
    setIsDialogOpen(true);
  };
  const closeDialog = () => {
    setForgotEmail("");
    setIsDialogOpen(false);
  };

  const sendReset = () => {
    sendPasswordResetEmail(auth, forgotEmail).then(() => {
      setSnackBarText("Sent reset email!");
      setSnackBarOpen(true);
      setIsDialogOpen(false);
    }).catch(() => {
      setSnackBarText("Could not send email!");
      setSnackBarOpen(true);
      setIsDialogOpen(false);
    })
  }

  const signWithEmail = () => {
    signInWithEmailAndPassword(auth, email, password).then(() => {
      if (auth.currentUser != null) {
        setSnackBarText("Logged in");
      } else {
        setSnackBarText("Could not log in!");
      }
      setSnackBarOpen(true);
    }).catch(e => {
      console.log(`Error occurred while logging in: ${e}`);
      setSnackBarText("Error occurred while logging in!");
      setSnackBarOpen(true);
    });
  }
  const signWithGoogle = () => {
    signInWithPopup(auth, new GoogleAuthProvider()).then(() => {
      if (auth.currentUser != null) {
        setSnackBarText("Logged in");
      } else {
        setSnackBarText("Could not log in!");
      }
      setSnackBarOpen(true);
    }).catch(e => {
      console.log(`Error occurred while logging in: ${e}`);
      setSnackBarText("Error occurred while logging in!");
      setSnackBarOpen(true);
    });
  }

  return (
    <div className="login bg-gradient-to-r from-cyan-400 to-slate-500 min-h-screen">
      <AppBar position="static" className='p-4 flex' sx={{flexDirection: 'row'}}>
        <Link to="/"><BackIcon/></Link>
        <span className='font-semibold text-lg ml-2'>Login to Face App</span>
      </AppBar>
      <div className="forms-in flex flex-col justify-center items-center w-screen" style={{
        height: "80vh"
      }}>
        <div className="flex flex-col py-12 px-8 items-center justify-center" style={{
          minWidth: "50%",
          boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.37 )",
          borderRadius: "10px",
          background: "rgba( 255, 255, 255, 0.25 )",
          WebkitBackdropFilter: "blur(4px)"
        }}>
          <span className="text-xl font-semibold">Login with Email and Password </span>
          <TextField
            label="Enter Your Email"
            type="email"
            className='w-full'
            sx={{
              marginBottom: "1rem",
              marginTop: "1rem"
            }}
            variant="filled"
            onChange={(e) => { setEmail(e.target.value || ""); } }
            />
          <TextField
            label="Enter Password"
            type="password"
            variant="filled"
            className="w-full"
            onChange={(e) => { setPassword(e.target.value || ""); } }
            />
          <span onClick={openDialog} className="self-start text-sm mb-4 mt-2 cursor-pointer hover:underline">Forgot Password?</span>

          <Button variant="contained" className="mb-4" sx={{
            boxShadow: "2px 2px 10px blue"
          }} onClick={signWithEmail}>
            Login
          </Button>
          <div className="flex flex-row items-center">
            <span>Or Login with</span> <IconButton onClick={signWithGoogle}>
              <GoogleIcon/>
            </IconButton>
          </div>
          <div className="self-start">
            Don't have an account? <Link to="/signup" className='hover:underline'>Sign Up</Link>
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
      <Dialog open={isDialogOpen} onClose={closeDialog}>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter your email to reset your password
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            onChange={(e) => { setForgotEmail(e.target.value) }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={sendReset}>Send Reset Email</Button>
        </DialogActions>
      </Dialog>
     </div>
  );
}

export default Login