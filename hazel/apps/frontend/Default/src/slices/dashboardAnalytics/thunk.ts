import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getAllData = createAsyncThunk("dashboardAnalytics/getAllData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getAudiencesMetricsChartsData = createAsyncThunk("dashboardAnalytics/getAudiencesMetricsChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getUserDeviceChartsData = createAsyncThunk("dashboardAnalytics/getUserDeviceChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getAudiencesSessionsChartsData = createAsyncThunk("dashboardAnalytics/getAudiencesSessionsChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});