import React from 'react'
import ReactDOM from 'react-dom/client'
import Page from './components/Page'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { io } from "socket.io-client";
import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'
import App from './routes/App'
import './index.css'
import Login from './routes/Login'
import Signup from './routes/Signup'
import Room from './routes/Room';
import Attendance from './routes/attendance'

const firebaseConfig = {
  apiKey: "AIzaSyCBUDR2UOTByLYWAjt5NR3asDRc3UUHS9Y",
  authDomain: "face-recognition-app-de529.firebaseapp.com",
  projectId: "face-recognition-app-de529",
  storageBucket: "face-recognition-app-de529.appspot.com",
  messagingSenderId: "128766852818",
  appId: "1:128766852818:web:670b7d5c8752ed60daf70b",
  measurementId: "G-PK5S9BWM07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const socket = io("http://localhost:3030")
const socket = io()
const db = getFirestore(app)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={<Page component={<App auth={getAuth(app)} socket={socket} db={db} />} title="Face App"/>} 
      />
      <Route
        path="login"
        element={<Page component={<Login auth={getAuth(app)} />} title="Login to Face App"/>} 
      />
      <Route
        path="signup"
        element={<Page component={<Signup auth={getAuth(app)} />} title="Signup for Face App"/>} 
      />
      <Route
        path="room"
        element={<Page component={<Room auth={getAuth(app)} db={db} socket={socket} />} title="Face App"/>} 
      />
      <Route
        path="attendance"
        element={<Page component={<Attendance auth={getAuth(app)} db={db} />} title="Attendance Portal"/>} 
      />
{/* 
      <Route path="/" element={<App auth={getAuth(app)} socket={socket} db={db} />} />
      <Route path='login' element={<Login auth={getAuth(app)} />} />
      <Route path='signup' element={<Signup auth={getAuth(app)} />} />
      <Route path='room' element={<Room auth={getAuth(app)} db={db} socket={socket} />} />
      <Route path='attendance' element={<Attendance auth={getAuth(app)} db={db} />} /> */}
    </Routes>
  </BrowserRouter>
)
