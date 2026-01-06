import { createAsyncThunk } from "@reduxjs/toolkit";

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getDirectContact = createAsyncThunk("chat/getDirectContact", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getChannels = createAsyncThunk("chat/getChannels" , async () => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
});

export const getMessages = createAsyncThunk("chat/getMessages" , async (roomId:any) => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
});

export const addMessage = createAsyncThunk("chat/addMessage" , async (message:any) => {
  try{
    // Mock data disabled - returning message
    return message;
  }catch (error) {
    return error;
  }
});

export const deleteMessage = createAsyncThunk("chat/deleteMessage" , async (message : any) => {
  try{
    // Mock data disabled - returning message for state update
    return { message };
  }catch (error) {
    return error;
  }
});