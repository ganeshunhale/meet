import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { VideoCall } from './components/VideoCall';
import { Controls } from './components/Controls';
import { UserSetup } from './components/UserSetup';
import './App.scss';
import { useDispatch, useSelector } from 'react-redux';
import { onConnect, revertAll } from './Redux/userSlice';
import { useNavigate } from 'react-router';
import img from "./assets/meeting.png"
function MeetDashboardNew() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [targetPeerId, setTargetPeerId] = useState('');
  const [connections, setConnections] = useState({});
  const [participants, setParticipants] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [streams, setStreams] = useState({});
  const [videoCallStream, setVideoCallStream] = useState({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const peerInstance = useRef(null);
  const dispatch = useDispatch();
  let navigate = useNavigate();
  const userdetails = useSelector((state) => state.user);

  const removePeer = (peerId) => {
    setConnections((prev) => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
    setParticipants((prev) => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
    setStreams((prevStreams) => {
      const updatedStreams = { ...prevStreams };
      delete updatedStreams[peerId];
      return updatedStreams;
    });
    setVideoCallStream((prev) => {
      const updatedStreams = { ...prev };
      delete updatedStreams[peerId];
      return updatedStreams;
    });
  };

  const handleDisconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop()); // Stop camera and mic
    }
    Object.values(connections).forEach((conn) => conn?.close());
    localStorage.clear();
    setConnections({});
    setParticipants({})
    peerInstance.current?.destroy();
    dispatch(revertAll());
    navigate("/")
  };

  // Handle incoming messages from any connection
  const handleMessage = (data) => {
    console.log('Data received:', data);
    if (data.type === 'USER_JOINED') {
      console.log("user joined participents set");

      setParticipants((prev) => ({
        ...prev,
        [data.peer]: { name: data.userName, isHost: false }
      }));
    }
    if (data.type === 'SYNC_PARTICIPANTS') {
      setParticipants(data.participants);
      console.log("recived sync participants", data);

    }
  };


  useEffect(() => {
    console.log("participants connection outside", participants, connections);
    if (!userdetails.isHost && Object.keys(participants).length !== Object.keys(connections).length) return;
    console.log("participants as host", participants, connections);

    const updatedParticipants = { ...participants, [userdetails.peerId]: { name: userdetails.name, isHost: true } };
    console.log("updatedparti", updatedParticipants);
    const allConnections = { ...connections }
    Object.values(connections).forEach((conn) => {
      console.log("Sending user details to", conn.peer, updatedParticipants);
      conn.send({ type: 'SYNC_PARTICIPANTS', participants: updatedParticipants });

    });
  }, [userdetails, participants, connections]);



  const handleIncomingCall = async (call) => {
    console.log('Incoming call from:', call);

    try {
      if (localStream) {
        call.answer(localStream);
      } else {
        call.answer();
      }
      call.on("close", (c) => {
        console.log("closed video call");
        console.log({ c, call })
        if (call.metadata.callType == "screenShare") {
          setStreams((prevStreams) => {
            const updatedStreams = { ...prevStreams };
            delete updatedStreams[call.peer]; 
            return updatedStreams;
          });
        } else if (call.metadata.callType == "videoCall") {
          setVideoCallStream((prev) => {
            const updatedStreams = { ...prev };
            delete updatedStreams[call.peer];
            return updatedStreams;
          });
        }

      })
      call.on('stream', (remoteStream) => {
        console.log('Received remote stream from:', call.peer);
        if (call.metadata && call.metadata.callType === 'screenShare') {
          setStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
        }
        if (call.metadata && call.metadata.callType === 'videoCall') {
          setVideoCallStream(prev => ({ ...prev, [call.peer]: remoteStream }));
        }
      });
    } catch (err) {
      console.error('Error handling incoming call:', err);
    }
  }


  useEffect(() => {
    const storedPeerId = localStorage.getItem('Peer-Id');
    const peerId = storedPeerId || Math.floor(Math.random() * 100).toString();

    if (!storedPeerId) localStorage.setItem('Peer-Id', peerId);

    const peer = new Peer(peerId, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    peerInstance.current = peer;
    peer.on('open', (id) => {
      dispatch(onConnect(id));
    });
    peer.on('connection', (conn) => {
      setConnections((prev) => ({ ...prev, [conn.peer]: conn }));
      console.log("connection recived");

      conn.on('data', handleMessage);
      conn.on('close', () => {
        removePeer(conn.peer);

      });
    });
    peer.on('call', handleIncomingCall);

    return () => {
      peer.destroy();
    };
  }, [dispatch]);

  const connectToPeer = () => {
    if (!targetPeerId.trim()) return;
    const conn = peerInstance.current.connect(targetPeerId);

    conn.on('open', () => {
      setConnections((prev) => ({ ...prev, [conn.peer]: conn }));
      conn.send({ type: 'USER_JOINED', userName: userdetails.name, peer: userdetails.peerId })

      console.log("USER_JOINED data sent");

    }
    ); //sending my details to host
    conn.on('data', handleMessage);

    conn.on('close', () => {
      removePeer(conn.peer);
    });
  };


  //----------------------------------------- video -----------------------------------------------
  const [calls, setCalls] = useState([])

  const handleCall = async (type) => {

    console.log({bisVideoEnabled: isVideoEnabled ,bisAudioEnabled: isAudioEnabled})

    if (!calls.length) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      console.log("streem_got", stream);

      if (type == "video") {
        setIsVideoEnabled(true);
        const audioTracks = stream.getAudioTracks();
        if (!isAudioEnabled && audioTracks.length > 0) {
          const isEnabled = audioTracks[0].enabled;
          audioTracks.forEach(track => (track.enabled = false));
        }
      } else if (type == "audio") {
        setIsAudioEnabled(true)
        const VideoTracks = stream.getVideoTracks();
        if (!isAudioEnabled && VideoTracks.length > 0) {
          const isEnabled = VideoTracks[0].enabled;
          VideoTracks.forEach(track => (track.enabled = false));
        }
      }

      Object.keys(participants).filter(id => id !== userdetails?.peerId).forEach(id => {
        console.log("calling..to", id);
        const call = peerInstance.current.call(id, stream, { metadata: { callType: 'videoCall' } });
        setCalls(p => [...p, call])
      });

    } else {
      if (localStream) {
        if (type == "audio") {
          const audioTracks = localStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const isEnabled = audioTracks[0].enabled;
            audioTracks.forEach(track => (track.enabled = !isEnabled));
            setIsAudioEnabled(!isEnabled);
          }
        } else if (type == "video") {
          const VideoTracks = localStream.getVideoTracks();
          if (VideoTracks.length > 0) {
            const isEnabled = VideoTracks[0].enabled;
            VideoTracks.forEach(track => (track.enabled = !isEnabled));
            setIsVideoEnabled(!isEnabled);
          }
        }
      } 
    }
    console.log({isVideoEnabled ,isAudioEnabled})

 
  }


  useEffect(() => {
    if(!isVideoEnabled && !isAudioEnabled){
      if(localStream)localStream?.getTracks().forEach(track => track.stop());
      calls.forEach(c => c.close())
      setCalls([])
      setLocalStream(null)
    }
  },[isVideoEnabled, isAudioEnabled,localStream])


  const [screenShareCon, setScreenShareCon] = useState([])
  const shareScreen = async () => {
    if (isScreenSharing) {
      // Stop screen sharing if already active
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenShareCon.forEach(c => c.close())
        setScreenShareCon([])
      }
      setIsScreenSharing(false);
    } else {
      try {
        // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const newScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

        setScreenStream(newScreenStream);
        setIsScreenSharing(true);
        Object.keys(participants)
          .filter((key) => key !== userdetails?.peerId)
          .forEach((connId) => {
            const con = peerInstance.current.call(connId, newScreenStream, { metadata: { callType: 'screenShare' } });
            setScreenShareCon(prev => [...prev, con])
          });

        // Handle when user stops screen sharing
        newScreenStream.getVideoTracks()[0].onended = () => {
          console.log("stoped casting...");

          screenShareCon.forEach(c => c.close())
          setScreenShareCon([])
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };
  return (
    <div className="app-container">
      <header className="app-header">
        <img src={img} width={60} alt="MeetSpaceLogo" />
        <h1>MeetSpace</h1>
        <div className="header-controls">

          <button onClick={handleDisconnect} className="disconnect-btn">
            <i className="fa-solid fa-phone-slash"></i>
          </button>
        </div>
      </header>

      <main className={`main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        {!sidebarOpen && <button
          className="toggle-sidebar-btn closed"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>}
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
          {sidebarOpen && <div className="peer-info">
            <h3>Welcome, {userdetails.name}{userdetails.isHost && " (Admin)"}</h3>
            {Object.keys(participants).length === 0 && (
              <>
                <div className="peer-id">{userdetails.peerId}</div>
                {!userdetails.isHost && <form onSubmit={(e) => {
                  e.preventDefault();
                  connectToPeer()
                }} className="connect-form">
                  <input
                    type="text"
                    placeholder="Enter peer ID to connect"
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    autoFocus
                  />
                  <button type='submit' className="connect-btn">
                    Connect
                  </button>
                </form>}
              </>
            )}
          </div>}

          {sidebarOpen && <div className="connected-peers">
            <div className="connection-status">
              <h3>Participants</h3>

              <div className='connectednumber'><div className="status-dot"></div>
                {participants && Object.keys(participants).length} Connected
              </div>

            </div>

            <ul>
              {/* If the current user is the host, display self separately */}
              {userdetails.isHost && (
                <li key={userdetails.peerId} className="user-self">
                  <i className="fas fa-user"></i>
                  {userdetails.name} (You)
                </li>
              )}
              {Object.entries(participants).map(([id, participant]) => {
                // Avoid duplicate self entry for the host
                if (userdetails.isHost && id === userdetails.peerId) return null;

                return (
                  <li key={id} className={id === userdetails.peerId ? "user-self" : ""}>
                    <i className="fas fa-user"></i>
                    {participant.name} {participant.isHost ? " (Host)" : ""}
                  </li>
                );
              })}
            </ul>
          </div>}

        </div>


        {/* Video grid can be added here */}
        <div className="video-grid">
          {localStream && (
            <VideoCall
              stream={localStream}
              muted={true}
              username={`${userdetails.name} (You)`}
            />
          )}
          {Object.keys(streams).map((peerId) => (
            <VideoCall
              key={peerId.concat("screenShare")}
              stream={streams[peerId]}
              username={participants[peerId]?.name || 'Unknown User'}
            />
          ))}
          {Object.keys(videoCallStream).map((peerId) => (
            <VideoCall
              key={peerId.concat("videoCall")}
              stream={videoCallStream[peerId]}
              username={participants[peerId]?.name || 'Unknown User'}
            />
          ))}
        </div>
      </main>

      <footer className="app-footer">
        {/* Uncomment and implement Controls as needed */}
        <Controls
          onShareScreen={shareScreen}
          onToggleVideo={() => handleCall("video")}
          onToggleAudio={() => handleCall("audio")}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isConnected={Object.keys(connections).length > 0}
        />
      </footer>
    </div>
  );
}

export default MeetDashboardNew;
