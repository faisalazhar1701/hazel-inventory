import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getTeamData = createAsyncThunk("team/getTeamData", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addTeamData = createAsyncThunk("team/addTeamData", async (team : any) => {
    try {
        // Mock data disabled - returning team
        toast.success("Team Data Added Successfully", { autoClose: 3000 });
        return team;
    } catch (error) {
        toast.error("Team Data Added Failed", { autoClose: 3000 });
        return error;
    }
});

export const updateTeamData = createAsyncThunk("team/updateTeamData", async (project : any) => {
    try {
        // Mock data disabled - returning project
        toast.success("Team Data Updated Successfully", { autoClose: 3000 });
        return project;
    } catch (error) {
        toast.error("Team Data Updated Failed", { autoClose: 3000 });
        return error;
    }
});

export const deleteTeamData = createAsyncThunk("team/deleteTeamData", async (team : any) => {
    try {
        // Mock data disabled - returning team for state update
        toast.success("Team Data Delete Successfully", { autoClose: 3000 });
        return { team };
    } catch (error) {
        toast.error("Team Data Delete Failed", { autoClose: 3000 });
        return error;
    }
});