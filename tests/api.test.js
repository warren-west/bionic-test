const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Category, Product } = require('../src/models');

let authToken;

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });

  authToken = loginRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Public routes', () => {
  test('GET / returns welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome to the Bionic Test API');
  });

  test('GET /health returns server status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('Server is running');
  });
});

describe('Authentication', () => {
  test('protected routes require authentication', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(401);
  });
});

describe('Categories API', () => {
  let categoryId;

  test('POST /api/categories - add a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Electronics' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Electronics');
    expect(res.body.id).toBeDefined();

    categoryId = res.body.id;
  });

  test('GET /api/categories - fetch all categories', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((c) => c.name === 'Electronics')).toBe(true);
  });

  test('GET /api/categories/:id - fetch category by ID', async () => {
    const res = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(categoryId);
    expect(res.body.name).toBe('Electronics');
  });

  test('PUT /api/categories/:id - update category name', async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Consumer Electronics' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Consumer Electronics');
  });
});

describe('Products API', () => {
  let categoryId;
  let productId;

  beforeAll(async () => {
    const category = await Category.create({ name: 'Books' });
    categoryId = category.id;
  });

  test('POST /api/products - add a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Product',
        description: 'Initial description',
        categoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Product');
    expect(res.body.description).toBe('Initial description');
    expect(res.body.categoryId).toBe(categoryId);
    expect(res.body.isDeleted).toBe(false);

    productId = res.body.id;
  });

  test('GET /api/products - fetch all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((p) => p.name === 'Test Product')).toBe(true);
  });

  test('GET /api/products/:id - fetch product by ID', async () => {
    const res = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(productId);
    expect(res.body.name).toBe('Test Product');
  });

  test('PUT /api/products/:id - update product description', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated description');
  });

  test('DELETE /api/products/:id - soft delete product', async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const deletedProduct = await Product.findByPk(productId);
    expect(deletedProduct.isDeleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(404);
  });
});

describe('Category deletion', () => {
  test('DELETE /api/categories/:id - hard delete category', async () => {
    const category = await Category.create({ name: 'Temporary Category' });

    const res = await request(app)
      .delete(`/api/categories/${category.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const deletedCategory = await Category.findByPk(category.id);
    expect(deletedCategory).toBeNull();
  });
});
