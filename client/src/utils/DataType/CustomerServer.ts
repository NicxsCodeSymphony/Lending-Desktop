import axios from 'axios'
import type { Customer, AddCustomer, EditCustomer } from './Customers'

const url = "http://localhost:45632"

export const getCustomers = async (): Promise<Customer[]> => {
    try{
        const res = await axios.get(`${url}/customer`)
        return res.data
    }
    catch(err){
        console.error("Error fetching customers:", err)
        throw err
    }
}

export const addCustomer = async (data: AddCustomer): Promise<void> => {
    try {
        await axios.post(`${url}/customer`, data);
    } catch (err) {
        console.error("Error adding customer:", err);
        throw err;
    }
}

export const editCustomer = async (data: EditCustomer): Promise<void> => {
    try {
        await axios.put(`${url}/customer/${data.customer_id}`, data);
    } catch (err) {
        console.error("Error editing customer:", err);
        throw err;
    }
}

export const deleteCustomer = async (customer_id: number): Promise<void> => {
    try {
        await axios.delete(`${url}/customer/${customer_id}`);
    } catch (err) {
        console.error("Error deleting customer:", err);
        throw err;
    }
}