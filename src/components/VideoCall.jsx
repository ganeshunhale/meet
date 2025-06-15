import { useRef, useEffect } from 'react';

export function VideoCall({ stream, muted = false, username = 'User' ,mirrored=false}) {
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
        style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      />
      <div className="participant-name">
        {username}
      </div>
    </div>
  );
}