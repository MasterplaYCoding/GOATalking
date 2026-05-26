const currentHost = window.location.hostname;
const LOCAL_URL = `https://${currentHost}:3000`;
const VM_URL = 'https://localhost:3000'; 

const USE_VM = false;

export const API_BASE_URL = USE_VM ? VM_URL : LOCAL_URL;
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
export const WS_URL = USE_VM ? `wss://${VM_URL.split('://')[1]}` : `wss://${currentHost}:3000`;