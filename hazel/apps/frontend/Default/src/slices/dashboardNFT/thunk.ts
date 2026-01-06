import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getMarketChartsDatas = createAsyncThunk("dashboardNFT/getMarketChartsDatas", async (data:any) => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});