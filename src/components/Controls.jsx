export function Controls({ 
  onShareScreen, 
  isScreenSharing,
  onToggleVideo, 
  onToggleAudio,
  isVideoEnabled,
  isAudioEnabled,
  isConnected
}) {
  return (
    <div className="controls">
      <button 
        onClick={onToggleVideo}
        className={`control-btn ${isVideoEnabled ? 'active' : ''}`}
        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        <i className={`fas fa-video${isVideoEnabled ? '' : '-slash'}`}></i>
      </button>
      
      <button 
        onClick={onToggleAudio}
        className={`control-btn ${isAudioEnabled ? 'active' : ''}`}
        title={isAudioEnabled ? 'Mute' : 'Unmute'}
      >
        <i className={`fas fa-microphone${isAudioEnabled ? '' : '-slash'}`}></i>
      </button>
      
      <button 
        onClick={onShareScreen}
        className={`control-btn ${isScreenSharing ? 'active' : ''} share-screen-btn`}
        disabled={!isConnected}
        title="Share screen"
      >
        <i className="fas fa-desktop"></i>
      </button>
    </div>
  );
}