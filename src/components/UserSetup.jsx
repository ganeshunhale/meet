import { useState } from 'react';

export function UserSetup({ onComplete }) {
  const [step, setStep] = useState('name');
  const [userName, setUserName] = useState('');
  const [isHost, setIsHost] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'name' && userName.trim()) {
      setStep('type');
    } else if (step === 'type' && isHost !== null) {
      onComplete(userName, isHost);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1>Welcome to Video Chat</h1>
        
        {step === 'name' ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userName">Enter your name</label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="setup-btn">Continue</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="meeting-type-buttons">
              <button
                type="button"
                className={`type-btn ${isHost === true ? 'active' : ''}`}
                onClick={() => setIsHost(true)}
              >
                <i className="fas fa-plus-circle"></i>
                Create Meeting
              </button>
              <button
                type="button"
                className={`type-btn ${isHost === false ? 'active' : ''}`}
                onClick={() => setIsHost(false)}
              >
                <i className="fas fa-sign-in-alt"></i>
                Join Meeting
              </button>
            </div>
            <button type="submit" className="setup-btn">Start</button>
          </form>
        )}
      </div>
    </div>
  );
}