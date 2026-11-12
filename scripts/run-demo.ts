import { createServer, type InlineConfig } from 'vite';
import configFactory from '../vite.config';

// Separate process and loopback listener; never changes managed preview configuration or .env.
process.env['ITALIA_LOCAL_DEMO'] = '1';
const config = await configFactory({ command: 'serve', mode: 'development' });
const server = await createServer({ ...config, configFile: false, mode: 'development', server: { ...config.server, host: '127.0.0.1', port: 8081, strictPort: true, allowedHosts: ['localhost', '127.0.0.1'], hmr: { host: 'localhost', port: 8081 } } } as InlineConfig);
await server.listen();
console.log('Italia Explorer DEMO: http://localhost:8081 — dati sintetici, nessuna connessione reale');