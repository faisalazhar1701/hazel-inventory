import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getMailDetails = createAsyncThunk("mailbox/getMailDetails", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const unreadMail = createAsyncThunk("mailbox/unreadMail", async (mail: any) => {
  try {
    // Mock data disabled - returning mail
    return mail;
  } catch (error) {
    return error;
  }
});

export const staredMail = createAsyncThunk("mailbox/staredMail", async (mail: any) => {
  try {
    // Mock data disabled - returning mail
    return mail;
  } catch (error) {
    return error;
  }
});

export const trashMail = createAsyncThunk("mailbox/trashMail", async (mail: any) => {
  try {
    // Mock data disabled - returning mail
    toast.success("Mail Moved Trash Successfully", { autoClose: 3000 });
    return mail;
  } catch (error) {
    toast.error("Mail Moved Trash Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteMail = createAsyncThunk("mailbox/deleteMail", async (mail: any) => {
  try {
    // Mock data disabled - returning mail for state update
    toast.success("Mail Delete Successfully", { autoClose: 3000 });
    return { mail };
  } catch (error) {
    toast.error("Mail Delete Failed", { autoClose: 3000 });
    return error;
  }
});

export const labelMail = createAsyncThunk("mailbox/labelMail", async (mail: any) => {
  try {
    // Mock data disabled - returning mail with label
    return { response: mail, label: mail.e };
  } catch (error) {
    return error;
  }
});