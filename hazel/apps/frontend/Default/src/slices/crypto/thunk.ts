import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getTransationList = createAsyncThunk("crypto/getTransationList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const getOrderList = createAsyncThunk("crypto/getOrderList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

