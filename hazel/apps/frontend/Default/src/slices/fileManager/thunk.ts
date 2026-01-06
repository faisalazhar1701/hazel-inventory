import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getFolders = createAsyncThunk("fileManager/getFolders", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  }
  catch (error) {
    return error;
  }
});

export const addNewFolder = createAsyncThunk("fileManager/addNewFolder", async (folder:any) => {
  try {
    // Mock data disabled - returning folder
    toast.success("Folder Added Successfully", { autoClose: 3000 });
    return folder;
  } catch (error) {
    toast.error("Folder Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateFolder = createAsyncThunk("fileManager/updateFolder", async (folder:any) => {
  try {
    // Mock data disabled - returning folder
    toast.success("Folder Updated Successfully", { autoClose: 3000 });
    return folder;
  } catch (error) {
    toast.error("Folder Updated Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteFolder = createAsyncThunk("fileManager/deleteFolder", async (folder:any) => {
  try {
    // Mock data disabled - returning folder for state update
    toast.success("Order Deleted Successfully", { autoClose: 3000 });
    return { folder };
  } catch (error) {
    toast.error("Order Deleted Failed", { autoClose: 3000 });
    return error;
  }
});

export const getFiles = createAsyncThunk("fileManager/getFiles", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const addNewFile = createAsyncThunk("fileManager/addNewFile", async (file:any) => {
  try {
    // Mock data disabled - returning file
    toast.success("File Added Successfully", { autoClose: 3000 });
    return file;
  } catch (error) {
    toast.error("File Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateFile = createAsyncThunk("fileManager/updateFile", async (file:any) => {
  try {
    // Mock data disabled - returning file
    toast.success("File Updated Successfully", { autoClose: 3000 });
    return file;
  } catch (error) {
    toast.error("File Updated Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteFile = createAsyncThunk("fileManager/deleteFile", async (file:any) => {
  try {
    // Mock data disabled - returning file for state update
    toast.success("File Delete Successfully", { autoClose: 3000 });
    return { file };
  } catch (error) {
    toast.error("File Delete Failed", { autoClose: 3000 });
    return error;
  }
});