import React from 'react';
import {useState} from 'react';
import AppBar from '@mui/material/AppBar';
import BackIcon from '@mui/icons-material/ArrowBack'
import GoogleIcon from '@mui/icons-material/Google';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField'
import  { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import Snackbar from '@mui/material/Snackbar';
import  { Link } from 'react-router-dom'
import { Button } from '@mui/material';

function SignUp({auth}) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [snackBarOpen, setSnackBarOpen] = useState(false)
    const [snackbarText, setSnackBarText] = useState("")
    const signup = () => {
      if (email.length > 0 && password.length > 0 && confirmPassword === password) {
        createUserWithEmailAndPassword(auth, email, password).then(()=> {
          if (auth.currentUser != null) {
            setSnackBarText("Signed up");
          } else {
            setSnackBarText("Could not signup!");
          }
          setSnackBarOpen(true);    
        }).catch(e => {
          console.log(`Error occurred while logging in: ${e}`);
          setSnackBarText("Error occurred while signing up!");
          setSnackBarOpen(true);
        });
      } else {
        setSnackBarText("Please enter all fields correctly!");
        setSnackBarOpen(true);
      }
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

    return(
      <div className='signup bg-gradient-to-r to-yellow-300 from-cyan-500 min-h-screen'>
        <AppBar position="static" className='p-4 flex' sx={{flexDirection: 'row'}}>
          <Link to="/login"><BackIcon/></Link>
          <span className='font-semibold text-lg ml-2'>Sign up for Face App</span>
        </AppBar>

        <div className="m-cont p-4 flex flex-col items-center md:flex-row" style={{minHeight: "80vh"}}>
          <div className="cont flex-1 flex justify-center">
            <img src="Daco_2327111.png" className="select-none max-h-80" alt=""/>
          </div>
          <div className="flex flex-col flex-1 p-4 mr-10" style={{
            boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.37 )",
            borderRadius: "10px",
            background: "rgba( 255, 255, 255, 0.25 )",
            WebkitBackdropFilter: "blur(4px)"
          }}>
            <span className="text-lg font-semibold mb-2">Sign Up with Email</span>
            <TextField
              label="Enter Your Email"
              type="email"
              variant="filled"
              onChange={(e) => { setEmail(e.target.value || ""); } } />
            <TextField
                sx={{
                  marginBottom: "0.5rem",
                  marginTop: "0.5rem"
                }}
                label="Enter Password"
                type="password"
                variant="filled"
                marginTop="13rem"
                onChange={(e) => { setPassword(e.target.value || ""); } } />
            <TextField
              label="Confirm Password"
              type="password"
              variant="filled"
              onChange={(e) => { setConfirmPassword(e.target.value || ""); } } />
            <Button className="self-center" onClick={signup} sx={{marginTop: '1rem', fontWeight: 600}}>Sign up</Button>
            <div className="flex flex-row items-center self-center">
              <span>Or Sign Up with</span> <IconButton onClick={signWithGoogle}>
                <GoogleIcon/>
              </IconButton>
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

      </div>
    )
  }


export default SignUp