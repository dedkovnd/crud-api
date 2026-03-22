import cluster from 'cluster';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const numCPUs: number = os.cpus().length;
const BASE_PORT: number = parseInt(process.env.PORT || '4000', 10);
const WORKER_COUNT: number = Math.max(1, numCPUs - 1); // Leave one core for load balancer

interface WorkerInfo {
  pid: number;
  port: number;
}

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${WORKER_COUNT} worker processes...`);
  
  const workers: cluster.Worker[] = [];
  const workerInfo: Map<number, WorkerInfo> = new Map();
  
  for (let i = 0; i < WORKER_COUNT; i++) {
    const workerPort = BASE_PORT + 1 + i;
    const worker = cluster.fork({ WORKER_PORT: workerPort.toString() });
    workers.push(worker);
    workerInfo.set(worker.id, { pid: worker.process.pid!, port: workerPort });
    console.log(`Worker ${worker.process.pid} started on port ${workerPort}`);
  }
  
  const loadBalancer = http.createServer((req, res) => {
    const workerIndex = ((loadBalancer as any).counter || 0) % WORKER_COUNT;
    const worker = workers[workerIndex];
    const workerPort = BASE_PORT + 1 + workerIndex;
    
    (loadBalancer as any).counter = ((loadBalancer as any).counter || 0) + 1;
    
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: workerPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error(`Proxy error: ${err.message}`);
      res.writeHead(500);
      res.end('Internal Server Error');
    });
    
    req.pipe(proxyReq);
    
    console.log(`Request ${req.method} ${req.url} -> Worker ${workerIndex + 1} (PID: ${worker.process.pid}, port: ${workerPort})`);
  });
  
  loadBalancer.listen(BASE_PORT, () => {
    console.log(`\n Load balancer listening on port ${BASE_PORT}`);
    console.log(`API available at: http://localhost:${BASE_PORT}/api/products`);
    console.log('\n Workers:');
    workers.forEach((worker, index) => {
      const info = workerInfo.get(worker.id);
      console.log(`   Worker ${index + 1}: PID ${info?.pid} | http://localhost:${BASE_PORT + 1 + index}/api/products`);
    });
    console.log('\n Round-robin algorithm will distribute requests evenly across workers\n');
  });
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
    console.log('Starting a new worker...');
    
    const index = workers.findIndex(w => w.id === worker.id);
    if (index !== -1) {
      const workerPort = BASE_PORT + 1 + index;
      const newWorker = cluster.fork({ WORKER_PORT: workerPort.toString() });
      workers[index] = newWorker;
      workerInfo.set(newWorker.id, { pid: newWorker.process.pid!, port: workerPort });
      console.log(`New worker ${newWorker.process.pid} started on port ${workerPort}`);
    }
  });
  
} else {
  const workerPort: number = parseInt(process.env.WORKER_PORT || (BASE_PORT + 1).toString(), 10);
  process.env.PORT = workerPort.toString();
  
  import('./server.js').then(({ startServer }) => {
    startServer();
    console.log(`Worker ${process.pid} started on port ${workerPort}`);
  });
}
