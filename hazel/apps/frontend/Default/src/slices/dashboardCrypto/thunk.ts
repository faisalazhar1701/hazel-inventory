import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getPortfolioChartsData = createAsyncThunk("dashboardCrypto/getPortfolioChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getMarketChartsData = createAsyncThunk("dashboardCrypto/getMarketChartsData", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});