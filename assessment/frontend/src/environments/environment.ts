


export const environmentQa= {
  production: false,
  apiBase: 'http://localhost:4000/api',
  wsBase: 'ws://localhost:4000/live'
};
export const environmentProduction = {
  production: true,
  apiBase: 'https://fleet-tracking-backend-yrui.onrender.com/api',
  wsBase: 'wss://fleet-tracking-backend-yrui.onrender.com/live'
};


const environmentPath = environmentProduction

export const environment = {
  production: environmentPath.production,
  apiBase: environmentPath.apiBase,
  wsBase: environmentPath.wsBase
};
