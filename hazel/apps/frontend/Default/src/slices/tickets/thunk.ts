import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getTicketsList = createAsyncThunk("tickets/getTicketsList", async () => {
    try {
        // Mock data disabled - returning empty array
        return [];
    } catch (error) {
        return error;
    }
});

export const addNewTicket = createAsyncThunk("tickets/addNewTicket", async (ticket:any) => {
    try {
        // Mock data disabled - returning ticket
        toast.success("Ticket Added Successfully", { autoClose: 3000 });
        return ticket;
    } catch (error) {
        return error;
    }
});

export const updateTicket = createAsyncThunk("tickets/updateTicket", async (ticket:any) => {
    try {
        // Mock data disabled - returning ticket
        toast.success("Ticket Updated Successfully", { autoClose: 3000 });
        return ticket;
    } catch (error) {
        toast.error("Ticket Updated Failed", { autoClose: 3000 });
        return error;
    }
});

export const deleteTicket = createAsyncThunk("tickets/deleteTicket", async (ticket:any) => {
    try {
        // Mock data disabled - returning ticket for state update
        toast.success("Ticket Delete Successfully", { autoClose: 3000 });
        return { ticket };
    } catch (error) {
        toast.error("Ticket Delete Failed", { autoClose: 3000 });
        return error;
    }
});