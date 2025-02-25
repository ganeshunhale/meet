import { Navigate, Outlet } from "react-router"

export const PrivateRoutes = ({userDetails}) => {
  return (
    userDetails.name? <Outlet/> : <Navigate to='/'/>
    )
  }
export const PublicRoutes = ({userDetails}) => {
  return (
    userDetails.name&&userDetails.peerId  ? <Navigate to='/meeting-room'/> : <Outlet/> 
    )
  }