import { createAction, createSlice } from '@reduxjs/toolkit'

export const revertAll = createAction('REVERT_ALL');

const initialState={
  name:localStorage.getItem('userdetails')?JSON.parse(localStorage.getItem('userdetails')).userName:"",
  isHost:localStorage.getItem('userdetails')?JSON.parse(localStorage.getItem('userdetails')).isHost:false,
  peerId:localStorage.getItem('Peer-Id')?JSON.parse(localStorage.getItem('Peer-Id')):null
}
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
      onConnect: (state,action) => {
        state.peerId = action.payload
      },
     userNameAction:(state,action)=>{
        state.name=action.payload.userName;
        state.isHost=action.payload.isHost
     },
    },
    extraReducers: (builder) => {
      builder.addCase(revertAll, () => initialState);
    },
  })
  
  // Action creators are generated for each case reducer function
  export const { userNameAction, onConnect} = userSlice.actions
  
  export default userSlice.reducer