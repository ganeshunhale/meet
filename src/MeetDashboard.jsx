import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { VideoCall } from './components/VideoCall';
import { Controls } from './components/Controls';
import { UserSetup } from './components/UserSetup';
import './App.css';
import { useSelector } from 'react-redux';

function MeetDashboard() {
  console.log("kkkkkkkkkkk");

  const [myPeerId, setMyPeerId] = useState('');
  const [targetPeerId, setTargetPeerId] = useState('');
  const [connections, setConnections] = useState([]);
  const [streams, setStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [userName, setUserName] = useState('');
  // const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(new Map());

  const peerInstance = useRef(null);
  const localVideoRef = useRef(null);
  const userdetails = useSelector(state => state.user)
  console.log(userdetails);

  useEffect(() => {


    
    const existingPeer = localStorage.getItem('Peer-Id');
    let randomId=null
    
    if (existingPeer) {
      randomId = existingPeer;
    
    }
    else {
    randomId = Math.round(Math.random() * 100);
    localStorage.setItem('Peer-Id', randomId)
    }

      let peer = new Peer(randomId);
      console.log("seethis",peer);
      
      
    

    peer.on('open', (id) => {
      console.log('Peer connection established. Your ID:', id);
      setMyPeerId(id);
      peerInstance.current = peer;
    });

    peer.on('connection', handleConnection);
    peer.on('call', handleIncomingCall);

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peer.destroy();
    };
  }, []);

  const handleConnection = (conn) => {
    console.log('New connection established:', conn.peer);

    conn.on('open', () => {
      console.log('Connection open:', conn.peer);
      console.log('connected user', connectedUsers)
      conn.send({ type: 'USER_INFO', userName: userdetails.name });
    });

    conn.on('data', (data) => {
      console.log('Data received:', data);

      if (data.type === 'USER_INFO') {
        setConnectedUsers(prev => new Map(prev).set(conn.peer, data.userName));
      }
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      setConnections(prev => prev.filter(c => c !== conn));
      setStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(conn.peer);
        return newStreams;
      });
      setConnectedUsers(prev => {
        const newUsers = new Map(prev);
        newUsers.delete(conn.peer);
        return newUsers;
      });
    });

    setConnections(prev => [...prev, conn]);
  };

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
        setStreams(prev => new Map(prev).set(call.peer, remoteStream));
      });
    } catch (err) {
      console.error('Error handling incoming call:', err);
    }
  };

  const connectToPeer = () => {
    if (!targetPeerId.trim()) return;

    const conn = peerInstance.current.connect(targetPeerId);

    conn.on('open', () => {
      console.log('Connected to peer:', conn.peer);
      conn.send({ type: 'USER_INFO', userName: userdetails.name });
    });

    conn.on('data', (data) => {
      console.log('Data received from:', conn.peer, data);
      if (data.type === 'USER_INFO') {
        setConnectedUsers(prev => new Map(prev).set(conn.peer, data.userName));
      }
    });

    handleConnection(conn);
  };

  const handleDisconnect = () => {
    connections.forEach(conn => conn.close());
    setConnections([]);
    setStreams(new Map());
    setConnectedUsers(new Map());
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    peerInstance.current?.destroy();
    setIsSetupComplete(false);
  };

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        localStream?.getVideoTracks().forEach(track => track.stop());
        setIsVideoEnabled(false);
        setLocalStream(null);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioEnabled });
        setLocalStream(stream);
        setIsVideoEnabled(true);

        connections.forEach(conn => {
          peerInstance.current.call(conn.peer, stream);
        });
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  };

  const toggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        localStream?.getAudioTracks().forEach(track => track.stop());
        setIsAudioEnabled(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled, audio: true });
        setLocalStream(stream);
        setIsAudioEnabled(true);

        connections.forEach(conn => {
          peerInstance.current.call(conn.peer, stream);
        });
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
    }
  };

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      connections.forEach(conn => {
        peerInstance.current.call(conn.peer, stream);
      });

      stream.getVideoTracks()[0].onended = () => {
        if (localStream) {
          connections.forEach(conn => {
            peerInstance.current.call(conn.peer, localStream);
          });
        }
      };
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  // if (!isSetupComplete) {
  //   return (
  //     <UserSetup
  //       onComplete={(name) => {
  //         setUserName(name);
  //         setIsSetupComplete(true);
  //       }}
  //     />
  //   );
  // }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Video Chat & Screen Sharing</h1>
        <div className="header-controls">
          <div className="connection-status">
            <span className="status-dot"></span>
            {connections.length} Connected
          </div>
          <button onClick={handleDisconnect} className="disconnect-btn">
            Leave Meeting
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="sidebar">
          <div className="peer-info">
            <h3>Welcome, {userdetails.name}</h3>
            {connections.length === 0 && (
              <>
                <div className="peer-id">{myPeerId}</div>
                <div className="connect-form">
                  <input
                    type="text"
                    placeholder="Enter peer ID to connect"
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                  />
                  <button onClick={connectToPeer} className="connect-btn">
                    Connect
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="connected-peers">
            <h3>Participants</h3>
            <ul>
              <li className="user-self">
                <i className="fas fa-user"></i>
                {userdetails.name} (You)
              </li>
              {Array.from(connectedUsers.entries()).map(([peerId, name]) => (
                <li key={peerId}>
                  <i className="fas fa-user"></i>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="video-grid">
          {localStream && (
            <VideoCall
              stream={localStream}
              muted={true}
              username={`${userdetails.name} (You)`}
            />
          )}
          {Array.from(streams.entries()).map(([peerId, stream]) => (
            <VideoCall
              key={peerId}
              stream={stream}
              username={connectedUsers.get(peerId) || 'Unknown User'}
            />
          ))}
        </div>
      </main>

      <footer className="app-footer">
        <Controls
          onShareScreen={shareScreen}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isConnected={connections.length > 0}
        />
      </footer>
    </div>
  );
}

export default MeetDashboard;
