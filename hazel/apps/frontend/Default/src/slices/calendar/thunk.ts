import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getEvents = createAsyncThunk("calendar/getEvents", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const addNewEvent = createAsyncThunk("calendar/addNewEvent", async (event: any) => {
  try {
    // Mock data disabled - returning event
    return event;
  } catch (error) {
    return error;
  }
});

export const updateEvent = createAsyncThunk("calendar/updateEvent", async (event: any) => {
  try {
    // Mock data disabled - returning event
    return event;
  } catch (error) {
    return error;
  }
});

export const deleteEvent = createAsyncThunk("calendar/deleteEvent", async (event: any) => {
  try {
    // Mock data disabled - returning event for state update
    return { event };
  } catch (error) {
    return error;
  }
});

export const getCategories = createAsyncThunk("calendar/getCategories", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
})

export const getUpCommingEvent = createAsyncThunk("calendar/getUpCommingEvent", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
})

export const resetCalendar = createAsyncThunk("calendar/resetCalendar", async () => {
  try {
    const response = '';
    return response;
  } catch (error) {
    return error;
  }
})