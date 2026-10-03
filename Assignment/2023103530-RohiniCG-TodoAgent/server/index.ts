import app from '../server';

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  console.log(`[Enterprise Server Module] Running on port ${PORT}`);
}

export default app;
