import { useRef, useEffect } from 'react';

export function VideoCall({ stream, muted = false, username = 'User' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-participant">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
      />
      <div className="participant-name">
        {username}
      </div>
    </div>
  );
}