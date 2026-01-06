import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';

export const getProducts = createAsyncThunk("ecommerce/getProducts", async () => {
  try {
    const products = await productsApi.getProducts();
    return products;
  } catch (error: any) {
    console.error('Error fetching products:', error);
    toast.error('Failed to fetch products', { autoClose: 3000 });
    return [];
  }
});

export const getOrders = createAsyncThunk("ecommerce/getOrders", async () => {
  try {
    const orders = await ordersApi.getOrders();
    return orders;
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    toast.error('Failed to fetch orders', { autoClose: 3000 });
    return [];
  }
});

export const getSellers = createAsyncThunk("ecommerce/getSellers", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const getCustomers = createAsyncThunk("ecommerce/getCustomers", async () => {
  try {
    // Mock data disabled - returning empty array
    return [];
  } catch (error) {
    return error;
  }
});

export const deleteProducts = createAsyncThunk("ecommerce/deleteProducts", async (product:any) => {
  try {
    // Mock data disabled - returning product for state update
    toast.success("Product Delete Successfully", { autoClose: 3000 });
    return { product };
  } catch (error) {
    toast.error("Product Delete Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateOrder = createAsyncThunk("ecommerce/updateOrder", async (order:any) => {
  try {
    // Mock data disabled - returning order
    toast.success("Order Updateded Successfully", { autoClose: 3000 });
    return order;
  } catch (error) {
    toast.error("Order Updateded Failed", { autoClose: 3000 });
    return error;
  }
});

export const addNewProduct = createAsyncThunk("ecommerce/addNewProduct", async (product:any) => {
  try {
    // Mock data disabled - returning product
    toast.success("Product Added Successfully", { autoClose: 3000 });
    return product;
  } catch (error) {
    toast.error("Product Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateProduct = createAsyncThunk("ecommerce/updateProduct", async (product:any) => {
  try {
    // Mock data disabled - returning product
    toast.success("Product Updateded Successfully", { autoClose: 3000 });
    return product;
  }
  catch (error) {
    toast.error("Product Updateded Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteOrder = createAsyncThunk("ecommerce/deleteOrder", async (order:any) => {
  try {
    // Mock data disabled - returning order for state update
    toast.success("Order Deleted Successfully", { autoClose: 3000 });
    return { order };
  } catch (error) {
    toast.error("Order Deleted Failed", { autoClose: 3000 });
    return error;
  }
});

export const addNewOrder = createAsyncThunk("ecommerce/addNewOrder", async (order:any) => {
  try {
    // Mock data disabled - returning order
    toast.success("Order Added Successfully", { autoClose: 3000 });
    return order;
  } catch (error) {
    toast.error("Order Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateCustomer = createAsyncThunk("ecommerce/updateCustomer", async (customer:any) => {
  try {
    // Mock data disabled - returning customer
    toast.success("Customer Updateded Successfully", { autoClose: 3000 });
    return customer;
  } catch (error) {
    toast.error("Customer Updateded Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteCustomer = createAsyncThunk("ecommerce/deleteCustomer", async (customer:any) => {
  try {
    // Mock data disabled - returning customer for state update
    toast.success("Customer Deleted Successfully", { autoClose: 3000 });
    return { customer };
  } catch (error) {
    toast.error("Customer Deleted Failed", { autoClose: 3000 });
    return error;
  }
});

export const addNewCustomer = createAsyncThunk("ecommerce/addNewCustomer", async (customer:any) => {
  try {
    // Mock data disabled - returning customer
    toast.success("Customer Added Successfully", { autoClose: 3000 });
    return customer;
  } catch (error) {
    toast.error("Customer Added Failed", { autoClose: 3000 });
    return error;
  }
});