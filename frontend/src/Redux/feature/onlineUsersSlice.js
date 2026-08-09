import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  typingUsers: [],
};

const onlineUsersSlice = createSlice({
  name: "onlineUsers",

  initialState,

  reducers: {
    setOnlineUsers: (state, action) => {
      state.users = action.payload;
    },

    addOnlineUser: (state, action) => {
      const exists = state.users.some(
        (user) => user.userId === action.payload.userId,
      );

      if (!exists) {
        state.users.push(action.payload);
      }
    },

    removeOnlineUser: (state, action) => {
      state.users = state.users.filter(
        (user) => user.userId !== action.payload,
      );
    },

    addTypingUser: (state, action) => {
      const exists = state.typingUsers.some(
        (user) => user.userId === action.payload.userId,
      );

      if (!exists) {
        state.typingUsers.push(action.payload);
      }
    },

    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(
        (user) => user.userId !== action.payload,
      );
    },
  },
});

export const { setOnlineUsers, addOnlineUser, removeOnlineUser,addTypingUser, removeTypingUser} =
  onlineUsersSlice.actions;

export default onlineUsersSlice.reducer;
