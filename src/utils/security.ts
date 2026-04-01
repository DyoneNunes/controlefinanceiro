// LIMITAÇÃO DE SEGURANÇA CONHECIDA:
// O token JWT é armazenado em localStorage, que é acessível a qualquer script na página.
// Isso significa que um ataque XSS pode roubar o token. Para maior segurança,
// considere migrar para httpOnly cookies no futuro.
// Para o escopo atual do projeto (uso doméstico/familiar), esse risco é aceitável.

export const getToken = () => localStorage.getItem('finance_token');
export const setToken = (token: string) => localStorage.setItem('finance_token', token);
export const removeToken = () => localStorage.removeItem('finance_token');