import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { config } from 'dotenv';
import productRoutes from './routes/products.js';
import { ApiError } from './types/product.js';

config();

declare const process: {
  env: {
    PORT?: string;
    NODE_ENV?: string;
  };
  argv: string[];
  exit: (code?: number) => never;
};

const PORT: number = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV: string = process.env.NODE_ENV || 'development';

export const buildServer = (options: FastifyServerOptions = {}): FastifyInstance => {
  const fastify = Fastify({
    logger: NODE_ENV === 'development',
    ignoreTrailingSlash: true,
    ...options
  });

  fastify.register(productRoutes, { prefix: '/api' });

  fastify.setNotFoundHandler((request, reply) => {
    const error: ApiError = {
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`
    };
    reply.code(404).send(error);
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    const statusCode = (error as any).statusCode || 500;
    const message = statusCode === 500 
      ? 'Internal Server Error' 
      : (error as Error).message;
    
    const errorResponse: ApiError = {
      error: 'Internal Server Error',
      message: message
    };
    
    reply.code(statusCode).send(errorResponse);
  });

  return fastify;
};

export const startServer = async (): Promise<void> => {
  const fastify = buildServer();
  
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`API available at: http://localhost:${PORT}/api/products`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  startServer();
}
