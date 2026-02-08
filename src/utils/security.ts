// This file now only handles decoding/storing, but for now we just rely on localStorage
// The heavy lifting is done by the backend.

export const getToken = () => localStorage.getItem('finance_token');
export const setToken = (token: string) => localStorage.setItem('finance_token', token);
export const removeToken = () => localStorage.removeItem('finance_token');