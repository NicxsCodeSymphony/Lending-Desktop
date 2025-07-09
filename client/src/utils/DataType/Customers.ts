export interface Customer{
    customer_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    contact: string;
    address: string;
    birthdate: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AddCustomer{
    first_name: string;
    middle_name: string;
    last_name: string;
    contact: string;
    address: string;
    birthdate: string;
}

export interface EditCustomer{
    customer_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    contact: string;
    address: string;
    birthdate: string;
    status: string;
    updated_at: string;
}