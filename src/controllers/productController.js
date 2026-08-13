const { Product, Category } = require('../models');

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isDeleted: false },
      include: [{ model: Category, as: 'category' }],
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isDeleted: false },
      include: [{ model: Category, as: 'category' }],
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const product = await Product.create({ name, description, categoryId });
    return res.status(201).json(product);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, categoryId } = req.body;

    if (name !== undefined) {
      product.name = name;
    }
    if (description !== undefined) {
      product.description = description;
    }
    if (categoryId !== undefined) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
      product.categoryId = categoryId;
    }

    await product.save();
    return res.json(product);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isDeleted = true;
    await product.save();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
