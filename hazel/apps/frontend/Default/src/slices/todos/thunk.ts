import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data disabled - returning empty data
// TODO: Replace with real API calls using api-client

export const getTodos = createAsyncThunk("todos/getTodos", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const addNewTodo = createAsyncThunk("todos/addNewTodo", async (todo:any) => {
  try {
    // Mock data disabled - returning todo
    toast.success("Todo Added Successfully", { autoClose: 3000 });
    return todo;
  } catch (error) {
    toast.error("Todo Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateTodo = createAsyncThunk("todos/updateTodo", async (todo:any) => {
  try {
    // Mock data disabled - returning todo
    toast.success("Todo Updated Successfully", { autoClose: 3000 });
    return todo;
  } catch (error) {
    toast.error("Todo Updated Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteTodo = createAsyncThunk("todos/deleteTodo", async (todo:any) => {
  
  try {
    // Mock data disabled - returning todo for state update
    toast.success("Todo Delete Successfully", { autoClose: 3000 });
    return { todo };
  } catch (error) {
    toast.error("Todo Delete Failed", { autoClose: 3000 });
    return error;
  }
});

export const getProjects = createAsyncThunk("todos/getProjects", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const addNewProject = createAsyncThunk("todos/addNewProject", async (project:any) => {
  try {
    // Mock data disabled - returning project
    toast.success("Project Added Successfully", { autoClose: 3000 });
    return project;
  } catch (error) {
    toast.error("Project Added Failed", { autoClose: 3000 });
    return error;
  }
});