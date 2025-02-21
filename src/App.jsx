import React from 'react'
import { Route, Routes } from 'react-router'
import { UserSetup } from './components/UserSetup'
import MeetDashboard from './MeetDashboard'
import { PrivateRoutes } from './components/routes'
import { useSelector } from 'react-redux'

const App = () => {
    const userDetails=useSelector(state=>state.user)
    const existingPeer = localStorage.getItem('Peer-Id')
    console.log("peer",userDetails,existingPeer);
  return (
    <>
    <Routes>
      
      <Route path="/" element={<UserSetup/>} />
      <Route element={<PrivateRoutes userDetails={userDetails}/>}>
        <Route path="meeting-room" element={<MeetDashboard/>} />
      </Route>
    </Routes>
    </>
  )
}

export default App