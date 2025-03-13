import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { userNameAction } from '../Redux/userSlice';
import { useNavigate } from 'react-router';

export function UserSetup() {
  const [step, setStep] = useState('name');
  const [userName, setUserName] = useState('');
  const dispatch = useDispatch()
  let navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'name' && userName.trim()) {
      setStep('type');
    } 
  };

  const handleType=(isHost)=>{
    dispatch(userNameAction({userName,isHost}))
    localStorage.setItem("userdetails",JSON.stringify({userName,isHost}))
    navigate("/meeting-room")
  }
 
  return (
    <div className="setup-container">
      <div className="setup-card">
      <img src="src\assets\meeting.png" alt="MeetSpaceLogo" width={150} />
        <h1>Welcome to MeetSpace</h1>
        
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
                autoComplete='off'
              />
            </div>
            <button type="submit" className="setup-btn">Continue</button>
          </form>
        ) : (
          <form >
            <div className="meeting-type-buttons">
              <button
                type="button"
                className="type-btn"
                onClick={() => handleType(true)}
              >
                <i className="fas fa-plus-circle"></i>
                Create Meeting
              </button>
              <button
                type="button"
                className="type-btn"
                onClick={() => handleType(false)}
              >
                <i className="fas fa-sign-in-alt"></i>
                Join Meeting
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}