const express = require('express');
const { register, login } = require('../controllers/authController');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Bionic Test API' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);

router.get('/api/categories', authenticate, getAllCategories);
router.get('/api/categories/:id', authenticate, getCategoryById);
router.post('/api/categories', authenticate, createCategory);
router.put('/api/categories/:id', authenticate, updateCategory);
router.delete('/api/categories/:id', authenticate, deleteCategory);

router.get('/api/products', authenticate, getAllProducts);
router.get('/api/products/:id', authenticate, getProductById);
router.post('/api/products', authenticate, createProduct);
router.put('/api/products/:id', authenticate, updateProduct);
router.delete('/api/products/:id', authenticate, deleteProduct);

module.exports = router;
