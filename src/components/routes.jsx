import { Navigate, Outlet } from "react-router"

export const PrivateRoutes = ({userDetails}) => {
    // console.log("prove",userDetails.name);
    const existingPeer = localStorage.getItem('Peer-Id');
    const userdetailsPeer = localStorage.getItem('userdetails');
    
  return (
    userDetails.name ? <Outlet/> : <Navigate to='/'/>
    )
  }