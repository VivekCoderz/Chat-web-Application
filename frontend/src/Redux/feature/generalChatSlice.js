import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeChat: { type: "general" },
  privateChatList: [],
  groupList: [],
  messages: [],
  sellerProducts: [],
  sellerOrders: [],
  buyerOrders: [],
  loading: false,
  error: null,
};

const generalChatSlice = createSlice({
  name: "generalChat",

  initialState,

  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },

    setPrivateChats: (state, action) => {
      state.privateChatList = action.payload;
    },

    addPrivateChat: (state, action) => {
      const exists = state.privateChatList.some(
        (u) => u._id === action.payload._id
      );
      if (!exists) {
        state.privateChatList.push(action.payload);
      }
    },

    setGroups: (state, action) => {
      state.groupList = action.payload;
    },

    addGroup: (state, action) => {
      const exists = state.groupList.some(
        (g) => g._id === action.payload._id
      );
      if (!exists) {
        state.groupList.push(action.payload);
      }
    },

    setSellerProducts: (state, action) => {
      state.sellerProducts = action.payload;
    },

    setSellerOrders: (state, action) => {
      state.sellerOrders = action.payload;
    },

    setBuyerOrders: (state, action) => {
      state.buyerOrders = action.payload;
    },

    chatRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    chatSuccess: (state, action) => {
      state.loading = false;
      state.messages = action.payload;
      state.error = null;
    },

    chatFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    updateMessage: (state, action) => {
      const index = state.messages.findIndex(
        (m) => m._id === action.payload._id
      );
      if (index > -1) {
        state.messages[index] = action.payload;
      }
    },

    removeMessage: (state, action) => {
      state.messages = state.messages.filter(
        (m) => m._id !== action.payload.messageId
      );
    },

    markMessagesAsSeen: (state) => {
      state.messages = state.messages.map((m) => ({ ...m, seen: true }));
    },

    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  setActiveChat,
  setPrivateChats,
  addPrivateChat,
  setGroups,
  addGroup,
  setSellerProducts,
  setSellerOrders,
  setBuyerOrders,
  chatRequest,
  chatSuccess,
  chatFail,
  addMessage,
  updateMessage,
  removeMessage,
  markMessagesAsSeen,
  clearMessages,
} = generalChatSlice.actions;

export default generalChatSlice.reducer;