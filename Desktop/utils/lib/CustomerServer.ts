import React, {useState, useEffect} from 'react'
import axios from 'axios'
import type { Customer } from './Customer'

const url = 'http://localhost:3002/'

export const fetchCustomers = async (): Promise<Customer[]> => {
    try{
        const res = await axios.get<Customer[]>(`${url}customers`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch customers", err)
        return [];
    }
}