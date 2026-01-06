import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getContacts = createAsyncThunk("crm/getContacts" , async () => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
})

export const getCompanies = createAsyncThunk("crm/getCompanies" , async () => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
})

export const addNewCompanies = createAsyncThunk("crm/addNewCompanies" , async (companies:any) => {
  try{
    // Mock data disabled - returning companies
    toast.success("Company Added Successfully", { autoClose: 3000 });
    return companies;
  }catch (error) {
    toast.error("Company Added Failed", { autoClose: 3000 });
    return error;
  }
})

export const updateCompanies = createAsyncThunk("crm/updateCompanies" , async (companies:any) => {
  try{
    // Mock data disabled - returning companies
    toast.success("Company Updated Successfully", { autoClose: 3000 });
    return companies;
  }catch (error) {
    toast.error("Company Updated Failed", { autoClose: 3000 });
    return error;
  }
})

export const deleteCompanies = createAsyncThunk("crm/deleteCompanies" , async (companies:any) => {
  try{
    // Mock data disabled - returning companies for state update
    toast.success("Company Deleted Successfully", { autoClose: 3000 });
    return { companies };
  }catch (error) {
    toast.error("Company Deleted Failed", { autoClose: 3000 });
    return error;
  }
})

export const addNewContact = createAsyncThunk("crm/addNewContact" , async (contact:any) => {
  try{
    // Mock data disabled - returning contact
    toast.success("Contact Added Successfully", { autoClose: 3000 });
    return contact;
  }catch (error) {
    toast.error("Contact Added Failed", { autoClose: 3000 });
    return error;
  }
})

export const updateContact = createAsyncThunk("crm/updateContact" , async (contact:any) => {
  try{
    // Mock data disabled - returning contact
    toast.success("Contact Updated Successfully", { autoClose: 3000 });
    return contact;
  }catch (error) {
    toast.error("Contact Updated Failed", { autoClose: 3000 });
    return error;
  }
})

export const deleteContact = createAsyncThunk("crm/deleteContact" , async (contact:any) => {
  try{
    // Mock data disabled - returning contact for state update
    toast.success("Contact Deleted Successfully", { autoClose: 3000 });
    return { contact };
  }catch (error) {
    toast.error("Contact Deleted Failed", { autoClose: 3000 });
    return error;
  }
})

export const getLeads = createAsyncThunk("crm/getLeads" , async () => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
})

export const addNewLead = createAsyncThunk("crm/addNewLead" , async (lead:any) => {
  try{
    // Mock data disabled - returning lead
    toast.success("Lead Added Successfully", { autoClose: 3000 });
    return lead;
  }catch (error) {
    toast.error("Lead Added Failed", { autoClose: 3000 });
    return error;
  }
})

export const updateLead = createAsyncThunk("crm/updateLead" , async (lead:any) => {
  try{
    // Mock data disabled - returning lead
    toast.success("Lead Updated Successfully", { autoClose: 3000 });
    return lead;
  }catch (error) {
    toast.error("Lead Updated Failed", { autoClose: 3000 });
    return error;
  }
})

export const deleteLead = createAsyncThunk("crm/deleteLead" , async (leads:any) => {
  try{
    // Mock data disabled - returning leads for state update
    toast.success("Lead Deleted Successfully", { autoClose: 3000 });
    return { leads };

  }catch (error) {
    toast.error("Lead Deleted Failed", { autoClose: 3000 });
    return error;
  }
})

export const getDeals = createAsyncThunk("crm/getDeals" , async () => {
  try{
    // Mock data disabled - returning empty array
    return [];
  }catch (error) {
    return error;
  }
})