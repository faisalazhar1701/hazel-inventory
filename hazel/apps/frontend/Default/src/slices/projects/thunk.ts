import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getProjectList = createAsyncThunk("projects/getProjectList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addProjectList = createAsyncThunk("projects/addProjectList", async (project:any) => {
    try {
        // Mock data disabled - returning project
        toast.success("project-list Added Successfully", { autoClose: 3000 });
        return project;
    } catch (error) {
        toast.error("project-list Added Failed", { autoClose: 3000 });
        return error;
    }
});

export const updateProjectList = createAsyncThunk("projects/updateProjectList", async (project:any) => {
    try {
        // Mock data disabled - returning project
        toast.success("project-list Updated Successfully", { autoClose: 3000 });
        return project;
    } catch (error) {
        toast.error("project-list Updated Failed", { autoClose: 3000 });
        return error;
    }
});

export const deleteProjectList = createAsyncThunk("projects/deleteProjectList", async (data:any) => {
    try {
        // Mock data disabled - returning data for state update
        toast.success("project-list Delete Successfully", { autoClose: 3000 });
        return data;
    } catch (error) {
        toast.error("project-list Delete Failed", { autoClose: 3000 });
        return error;
    }
});