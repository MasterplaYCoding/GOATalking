const LOCAL_URL = 'http://localhost:3000';
const VM_URL = 'http://192.168.133.129:3000'; 

const USE_VM = false;

export const API_BASE_URL = USE_VM ? VM_URL : LOCAL_URL;
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
export const WS_URL = USE_VM ? `ws://${VM_URL.split('://')[1]}` : 'ws://localhost:3000';