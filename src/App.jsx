import React from 'react'
import { Route, Routes } from 'react-router'
import { UserSetup } from './components/UserSetup'
import MeetDashboard from './MeetDashboard'
import { PrivateRoutes, PublicRoutes } from './components/routes'
import { useSelector } from 'react-redux'
import MeetDashboardNew from './MeetDashboardNew'

const App = () => {
    const userDetails=useSelector(state=>state.user)
    const existingPeer = localStorage.getItem('Peer-Id')
    console.log("peer",userDetails,existingPeer);
  return (
    <>
    <Routes>
      <Route element={<PublicRoutes userDetails={userDetails}/>}>
        <Route path="/" element={<UserSetup/>} />
      </Route>  
      <Route element={<PrivateRoutes userDetails={userDetails}/>}>
        <Route path="meeting-room" element={<MeetDashboardNew/>} />
      </Route>
    </Routes>
    </>
  )
}

export default App