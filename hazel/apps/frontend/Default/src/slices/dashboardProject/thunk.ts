import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getProjectChartsData = createAsyncThunk("dashboardProject/getProjectChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getProjectStatusChartsData = createAsyncThunk("dashboardProject/getProjectStatusChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});