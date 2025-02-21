import { createSlice } from '@reduxjs/toolkit'
export const userSlice = createSlice({
    name: 'user',
    initialState: {
      value: 0,
      name:localStorage.getItem('userdetails')?JSON.parse(localStorage.getItem('userdetails')).userName:"",
      isHost:localStorage.getItem('userdetails')?JSON.parse(localStorage.getItem('userdetails')).isHost:false,
    },
    reducers: {
      increment: (state) => {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes.
        // Also, no return statement is required from these functions.
        state.value += 1
      },
     userNameAction:(state,action)=>{
        state.name=action.payload.userName;
        state.isHost=action.payload.isHost
     },
    },
  })
  
  // Action creators are generated for each case reducer function
  export const { increment,userNameAction} = userSlice.actions
  
  export default userSlice.reducer