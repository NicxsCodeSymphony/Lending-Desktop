import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Loan, Receipt } from './lib/Loan';

const url = 'http://localhost:3002/';

export const fetchLoans = async (): Promise<Loan[]> => {
  try {
    const res = await axios.get<Loan[]>(`${url}loan`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch loans", err);
    return []; // <- default fallback
  }
}

export const fetchReceipts = async(id: number) => {
  try{
    const res = await axios.get<Receipt>(`${url}loan/getReceipt/${id}`)
    return res.data
  }
  catch(err){
    return err
  }
}