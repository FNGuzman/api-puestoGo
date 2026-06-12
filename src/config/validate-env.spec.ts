import { validateProductionEnv, validateRequiredAuthEnv } from './validate-env';

describe('validateRequiredAuthEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    delete process.env.JEST_WORKER_ID;
    delete process.env.SKIP_AUTH_ENV_VALIDATION;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('omite validación en NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ACCESS_TOKEN_SECRET;
    expect(() => validateRequiredAuthEnv()).not.toThrow();
  });

  it('falla si faltan secretos JWT', () => {
    delete process.env.ACCESS_TOKEN_SECRET;
    delete process.env.ACCESS_TOKEN_REFRESH_SECRET;
    expect(() => validateRequiredAuthEnv()).toThrow(/ACCESS_TOKEN_SECRET/);
  });

  it('falla si los secretos son demasiado cortos', () => {
    process.env.ACCESS_TOKEN_SECRET = 'short';
    process.env.ACCESS_TOKEN_REFRESH_SECRET = 'short-too';
    expect(() => validateRequiredAuthEnv()).toThrow(/16 caracteres/);
  });
});

describe('validateProductionEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
    process.env.ACCESS_TOKEN_SECRET = 'prod-access-token-16';
    process.env.ACCESS_TOKEN_REFRESH_SECRET = 'prod-refresh-token-16';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exige variables críticas de producción', () => {
    delete process.env.DB_HOST;
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    expect(() => validateProductionEnv()).toThrow(/Producción/);
  });

  it('rechaza DB_SYNCHRONIZE=true en producción', () => {
    Object.assign(process.env, {
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'secret',
      DB_NAME: 'app',
      MERCADOPAGO_ACCESS_TOKEN: 'mp-token',
      MERCADOPAGO_WEBHOOK_SECRET: 'mp-webhook-secret',
      PUBLIC_API_BASE_URL: 'https://api.example.com',
      LANDING_BASE_URL: 'https://landing.example.com',
      CORS_ORIGIN: 'https://landing.example.com',
      DB_SYNCHRONIZE: 'true',
    });
    expect(() => validateProductionEnv()).toThrow(/DB_SYNCHRONIZE/);
  });

  it('rechaza mock checkout en producción', () => {
    Object.assign(process.env, {
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'secret',
      DB_NAME: 'app',
      MERCADOPAGO_ACCESS_TOKEN: 'mp-token',
      MERCADOPAGO_WEBHOOK_SECRET: 'mp-webhook-secret',
      PUBLIC_API_BASE_URL: 'https://api.example.com',
      LANDING_BASE_URL: 'https://landing.example.com',
      CORS_ORIGIN: 'https://landing.example.com',
      ALLOW_SUBSCRIPTION_MOCK_CHECKOUT: 'true',
    });
    expect(() => validateProductionEnv()).toThrow(
      /ALLOW_SUBSCRIPTION_MOCK_CHECKOUT/,
    );
  });
});
