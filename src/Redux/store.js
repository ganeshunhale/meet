import { configureStore } from '@reduxjs/toolkit'
import userReduce from './userSlice'

export default configureStore({
  reducer: {
    user: userReduce,
  },
})