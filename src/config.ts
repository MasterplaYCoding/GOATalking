const LOCAL_URL = 'http://localhost:3000';
const VM_URL = 'http://192.168.68.111:3000';

const USE_VM = true;

export const API_BASE_URL = USE_VM ? VM_URL : LOCAL_URL;
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
export const WS_URL = USE_VM ? 'ws://192.168.68.111:3000' : 'ws://localhost:3000';