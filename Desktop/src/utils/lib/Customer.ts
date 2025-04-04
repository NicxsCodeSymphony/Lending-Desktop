export interface Customer {
    customer_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    address: string;
    birthdate: string;
    status: "Active" | "Inactive";
    created_at: string;
    updated_at: string;
  }