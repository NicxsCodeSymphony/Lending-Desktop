import axios from 'axios'

const url = "http://localhost:45632"

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    message: string;
}

export interface ChangePasswordRequest {
    username: string;
    currentPassword: string;
    newPassword: string;
}

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${url}/login`, data);
        return response.data;
    } catch (err) {
        console.error("Error logging in:", err);
        throw err;
    }
}

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
        await axios.post(`${url}/login/change-password`, data);
    } catch (err) {
        console.error("Error changing password:", err);
        throw err;
    }
} 