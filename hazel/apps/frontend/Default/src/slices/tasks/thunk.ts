import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getTaskList = createAsyncThunk("tasks/getTaskList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});
export const addNewTask = createAsyncThunk("tasks/addNewTask", async (task: any) => {
    try {
        // Mock data disabled - returning task
        toast.success("Task Added Successfully", { autoClose: 3000 });
        return task;
    } catch (error) {
        toast.error("Task Added Failed", { autoClose: 3000 });
        return error;
    }
});
export const updateTask = createAsyncThunk("tasks/updateTask", async (task: any) => {
    try {
        // Mock data disabled - returning task
        toast.success("Task Updated Successfully", { autoClose: 3000 });
        return task;
    } catch (error) {
        toast.error("Task Updated Failed", { autoClose: 3000 });
        return error;
    }
});
export const deleteTask = createAsyncThunk("tasks/deleteTask", async (task: any) => {
    try {
        // Mock data disabled - returning task for state update
        toast.success("Task Updated Successfully", { autoClose: 3000 });
        return { task };
    } catch (error) {
        toast.error("Task Updated Failed", { autoClose: 3000 });
        return error;
    }
});
// Kanban Board
export const getTasks = createAsyncThunk("tasks/getTasks", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});
export const addCardData = createAsyncThunk("tasks/addCardData", async (card: any) => {
    try {
        // Mock data disabled - returning card
        toast.success("Card Add Successfully", { autoClose: 2000 })
        return card;
    } catch (error) {
        toast.error("Card Add Failded", { autoClose: 2000 })
        return error;
    }
})
export const updateCardData = createAsyncThunk("tasks/updateCardData", async (card: any) => {
    try {
        // Mock data disabled - returning card
        toast.success("Card Update Successfully", { autoClose: 2000 })
        return card;
    } catch (error) {
        toast.error("Card Update Failded", { autoClose: 2000 })
        return error
    }
})
export const deleteKanban = createAsyncThunk("tasks/deleteKanban", async (card: any) => {
    try {
        // Mock data disabled - returning card for state update
        toast.success("Card Delete Successfully", { autoClose: 2000 })
        return { card };
    } catch (error) {
        toast.error("Card Delete Failded", { autoClose: 2000 })
        return error;
    }
})