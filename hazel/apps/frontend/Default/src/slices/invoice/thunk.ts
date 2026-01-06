import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getInvoices = createAsyncThunk("invoice/getInvoices", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const addNewInvoice = createAsyncThunk("invoice/addNewInvoice", async (invoice:any) => {
  try {
    // Mock data disabled - returning invoice
    toast.success("Invoice Added Successfully", { autoClose: 3000 });
    return invoice;
  } catch (error) {
    toast.error("Invoice Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateInvoice = createAsyncThunk("invoice/updateInvoice", async (invoice:any) => {
  try {
    // Mock data disabled - returning invoice
    toast.success("Invoice Updated Successfully", { autoClose: 3000 });
    return invoice;
  } catch (error) {
    toast.error("Invoice Updated Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteInvoice = createAsyncThunk("invoice/deleteInvoice", async (invoice:any) => {
  try {
    // Mock data disabled - returning invoice for state update
    toast.success("Invoice Delete Successfully", { autoClose: 3000 });
    return { invoice };
  }
  catch (error) {
    toast.error("Invoice Delete Failed", { autoClose: 3000 });
    return error;
  }
});