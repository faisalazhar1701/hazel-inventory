import { createAsyncThunk } from "@reduxjs/toolkit";
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


export const getApplicationList = createAsyncThunk("jobs/getJobApplicationList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addNewJobApplicationList = createAsyncThunk("jobs/addNewJobApplicationList", async (job: any) => {
    try {
        // Mock data disabled - returning job
        toast.success("Job Application Added Successfully", { autoClose: 3000 });
        return job;
    } catch (error) {
        toast.error("Job Application Added Failed", { autoClose: 3000 });
        return error;
    }
});

export const updateJobApplicationList = createAsyncThunk("jobs/updateJobApplicationList", async (job: any) => {
    try {
        // Mock data disabled - returning job
        toast.success("Job Application Updated Successfully", { autoClose: 3000 });
        return job;
    } catch (error) {
        toast.error("Job Application Updated Failed", { autoClose: 3000 });
        return error;
    }
});

export const deleteJobApplicationList = createAsyncThunk("jobs/deleteJobApplicationList", async (job: any) => {
    try {
        // Mock data disabled - returning job for state update
        toast.success("Job Application Deleted Successfully", { autoClose: 3000 });
        return { job };
    } catch (error) {
        toast.error("Job Application Deleted Failed", { autoClose: 3000 });
        return error;
    }
});

// candidate List
export const getCandidateList = createAsyncThunk("jobs/getJobCandidateList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addCandidate = createAsyncThunk("jobs/addJobCandidate", async (candidate: any) => {
    try {
        // Mock data disabled - returning candidate
        toast.success("Candidate Added Successfully", { autoClose: 2000 });
        return candidate;
    } catch (error) {
        toast.error("Candidate Added Failed", { autoClose: 2000 });
        return error;
    }
});

export const updateCandidate = createAsyncThunk("jobs/updateJobCandidate", async (candidate: any) => {
    try {
        // Mock data disabled - returning candidate
        toast.success("Candidate Updated Successfully", { autoClose: 2000 });
        return candidate;
    } catch (error) {
        toast.error("Candidate Updated Failed", { autoClose: 2000 });
        return error;
    }
});

export const deleteCandidate = createAsyncThunk("jobs/deleteJobCandidate", async (id: any) => {
    try {
        // Mock data disabled - returning id for state update
        toast.success("Candidate Deleted Successfully", { autoClose: 2000 });
        return { id };
    } catch (error) {
        toast.error("Candidate Deleted Failed", { autoClose: 2000 });
        return error;
    }
});

// candidate grid
export const getCandidateGrid = createAsyncThunk("jobs/getJobCandidateGrid", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addCandidateGrid = createAsyncThunk("jobs/addJobCandidateGrid", async (candidate: any) => {
    try {
        // Mock data disabled - returning candidate
        toast.success("Candidate Added Successfully", { autoClose: 2000 });
        return candidate;
    } catch (error) {
        toast.error("Candidate Added Failed", { autoClose: 2000 });
        return error;
    }
});


// Job category
export const getCategoryList = createAsyncThunk("jobs/getcategoryList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addcategoryList = createAsyncThunk("jobs/addcategoryList", async (category: any) => {
    try {
        // Mock data disabled - returning category
        toast.success("Category Added Successfully", { autoClose: 3000 });
        return category;
    } catch (error) {
        toast.error("Category Added Failed", { autoClose: 3000 });
        return error;
    }
});
