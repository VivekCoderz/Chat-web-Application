import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
  loading: false,
  error: null,
};

const generalChatSlice = createSlice({
  name: "generalChat",

  initialState,

  reducers: {
    // Jab messages fetch/send ho rahe hain
    chatRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    // Backend se messages mil gaye
    chatSuccess: (state, action) => {
      state.loading = false;
      state.messages = action.payload;
      state.error = null;
    },

    // Error
    chatFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Socket se ek naya message receive hua
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    // Chat clear karni ho
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  chatRequest,
  chatSuccess,
  chatFail,
  addMessage,
  clearMessages,
} = generalChatSlice.actions;

export default generalChatSlice.reducer;