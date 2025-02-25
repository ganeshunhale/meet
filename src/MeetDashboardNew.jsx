import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { VideoCall } from './components/VideoCall';
import { Controls } from './components/Controls';
import { UserSetup } from './components/UserSetup';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { onConnect, revertAll } from './Redux/userSlice';
import { useNavigate } from 'react-router';

function MeetDashboardNew() {
  const [targetPeerId, setTargetPeerId] = useState('');
  const [connections, setConnections] = useState({});
  const [participants, setParticipants] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [streams, setStreams] = useState({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
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
  };

  const handleDisconnect = () => {
    Object.values(connections).forEach((conn) => conn.close());
    localStorage.clear();
    setConnections({});
    peerInstance.current?.destroy();
    dispatch(revertAll());
    navigate("/")
  };

  // Handle incoming messages from any connection
  const handleMessage = (data) => {
    console.log('Data received:', data);
    if (data.type === 'USER_JOINED') {
      setParticipants((prev) => ({
        ...prev,
        [data.peer]: { name: data.userName, isHost: false }
      }));
    }
    if (data.type === 'SYNC_PARTICIPANTS') {
      setParticipants(data.participants);
    }
  };


  useEffect(() => {
    console.log("participants",participants);
    
    if (!userdetails.isHost) return;
    if (Object.keys(participants).length !== Object.keys(connections).length) return

    const updatedParticipants = { ...participants, [userdetails.peerId]: { name: userdetails.name, isHost: true } };

    Object.values(connections).forEach((conn) => {
      console.log("Sending user details to", conn.peer, updatedParticipants);
      conn.send({ type: 'SYNC_PARTICIPANTS', participants: updatedParticipants});
    });
  }, [userdetails, participants, connections]);



 const handleIncomingCall = async (call) => {
    console.log('Incoming call from:', call.peer);

    try {
      if (localStream) {
        call.answer(localStream);
      } else {
        call.answer();
      }

      call.on('stream', (remoteStream) => {
        console.log('Received remote stream from:', call.peer);
        setStreams(prev => ({...prev,[call.peer]: remoteStream}));
      });
    } catch (err) {
      console.error('Error handling incoming call:', err);
    }
}


  useEffect(() => {
    const storedPeerId = localStorage.getItem('Peer-Id');
    const peerId = storedPeerId || Math.floor(Math.random() * 100).toString();

    if (!storedPeerId) localStorage.setItem('Peer-Id', peerId);

    const peer = new Peer(peerId);
    peerInstance.current = peer;

    peer.on('open', (id) => {
      dispatch(onConnect(id));
    });

    // when client connects to host
    peer.on('connection', (conn) => { 
        setConnections((prev) => ({ ...prev, [conn.peer]: conn }));
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

  // Connecting to host
  const connectToPeer = () => {
    if (!targetPeerId.trim()) return;
    const conn = peerInstance.current.connect(targetPeerId);

    conn.on('data', handleMessage);

    conn.on('open', () => {
        setConnections((prev) => ({ ...prev, [conn.peer]: conn }));
        conn.send({ type: 'USER_JOINED', userName: userdetails.name, peer: userdetails.peerId })
    }
    ); //sending my details to host

    conn.on('close', () => {
      removePeer(conn.peer);
    });
  };



  //----------------------------------------- video -----------------------------------------------
  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        localStream?.getVideoTracks().forEach(track => track.stop());
        setIsVideoEnabled(false);
        setLocalStream(null);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioEnabled });
        setLocalStream(stream);
        console.log("streem_got", stream);
        
        setIsVideoEnabled(true);

        Object.keys(participants).forEach(id => {
            console.log("calling..to",id);
            
          peerInstance.current.call(id, stream);
        });
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  };

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      Object.keys(participants).forEach(connId => {
        peerInstance.current.call(connId, stream);
      });

      stream.getVideoTracks()[0].onended = () => {
        if (localStream) {
            Object.keys(participants).forEach(connId => {
            peerInstance.current.call(connId, localStream);
          });
        }
      };
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Video Chat & Screen Sharing</h1>
        <div className="header-controls">
          <div className="connection-status">
            <span className="status-dot"></span>
            {Object.keys(connections).length} Connected
          </div>
          <button onClick={handleDisconnect} className="disconnect-btn">
            Leave Meeting
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="sidebar">
          <div className="peer-info">
            <h3>Welcome, {userdetails.name}{userdetails.isHost&&" (Admin)"}</h3>
            {Object.keys(participants).length === 0 && (
              <>
                <div className="peer-id">{userdetails.peerId}</div>
                {!userdetails.isHost&&<div className="connect-form">
                  <input
                    type="text"
                    placeholder="Enter peer ID to connect"
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                  />
                  <button onClick={connectToPeer} className="connect-btn">
                    Connect
                  </button>
                </div>}
              </>
            )}
          </div>

          <div className="connected-peers">
            <h3>Participants</h3>
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
                console.log(id,participant);
                
                return (
                  <li key={id} className={id === userdetails.peerId ? "user-self" : ""}>
                    <i className="fas fa-user"></i>
                    {participant.name} {participant.isHost ? " (Host)" : ""}
                  </li>
                );
              })}
            </ul>
          </div>
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
                key={peerId}
                stream={streams[peerId]}
                username={participants[peerId]?.name || 'Unknown User'}
              />
            ))}
          </div>
      </main>

      <footer className="app-footer">
        {/* Uncomment and implement Controls as needed */}
        <Controls
            onShareScreen={shareScreen}
            onToggleVideo={toggleVideo}
            // onToggleAudio={toggleAudio}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            isConnected={Object.keys(connections).length > 0}
          />
      </footer>
    </div>
  );
}

export default MeetDashboardNew;
