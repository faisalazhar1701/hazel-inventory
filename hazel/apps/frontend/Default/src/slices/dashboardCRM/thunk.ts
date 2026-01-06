import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getBalanceChartsData = createAsyncThunk("dashboardCrm/getBalanceChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getDialChartsData = createAsyncThunk("dashboardCrm/getDialChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  }
  catch (error) {
    return error;
  }
});

export const getSalesChartsData = createAsyncThunk("dashboardCrm/getSalesChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  }
  catch (error) {
    return [];
  }
});