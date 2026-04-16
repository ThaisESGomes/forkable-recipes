const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma   = new PrismaClient();
const { isAuthenticated } = require('../middleware/auth');


async function getForkLineage(recipe) {
  const lineage = [];
  let current = recipe;
  while (current.forkedFromId) {
    const parent = await prisma.recipe.findUnique({
      where: { id: current.forkedFromId },
      include: { author: true }
    });
    if (!parent) break;
    lineage.unshift(parent);
    current = parent;
  }
  return lineage;
}


router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search)   where.OR = [
      { title:       { contains: search } },
      { description: { contains: search } }
    ];

    const recipes = await prisma.recipe.findMany({
      where,
      include: { author: true, forkedFrom: { include: { author: true } }, forks: true, favoritedBy: true },
      orderBy: { createdAt: 'desc' }
    });

    const categories = await prisma.recipe.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.render('recipes/index', {
      title: 'Receitas',
      recipes,
      categories: categories.map(c => c.category),
      search: search || '',
      category: category || ''
    });
  } catch (err) { next(err); }
});


router.get('/new', isAuthenticated, (req, res) => {
  res.render('recipes/new', { title: 'Nova Receita', forkedFrom: null });
});


router.post('/', isAuthenticated, async (req, res, next) => {
  const { title, description, ingredients, instructions, servings, prepTime, category } = req.body;
  try {
    const recipe = await prisma.recipe.create({
      data: {
        title, description, ingredients, instructions,
        servings:  parseInt(servings)  || 2,
        prepTime:  parseInt(prepTime)  || 30,
        category:  category || 'Geral',
        authorId:  req.session.userId
      }
    });
    req.flash('success', 'Receita criada com sucesso! 🎉');
    res.redirect(`/recipes/${recipe.id}`);
  } catch (err) { next(err); }
});


router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        author: true,
        forkedFrom: { include: { author: true } },
        forks: { include: { author: true, forks: true, favoritedBy: true } },
        favoritedBy: true
      }
    });
    if (!recipe) {
      req.flash('error', 'Receita não encontrada.');
      return res.redirect('/recipes');
    }

    const lineage = await getForkLineage(recipe);
    const isFavorited = req.session.userId
      ? recipe.favoritedBy.some(u => u.id === req.session.userId)
      : false;

    res.render('recipes/show', { title: recipe.title, recipe, lineage, isFavorited });
  } catch (err) { next(err); }
});


router.get('/:id/edit', isAuthenticated, async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!recipe) {
      req.flash('error', 'Receita não encontrada.');
      return res.redirect('/recipes');
    }
    if (recipe.authorId !== req.session.userId && req.session.userRole !== 'ADMIN') {
      req.flash('error', 'Você não tem permissão para editar esta receita.');
      return res.redirect(`/recipes/${recipe.id}`);
    }
    res.render('recipes/edit', { title: `Editar: ${recipe.title}`, recipe });
  } catch (err) { next(err); }
});


router.put('/:id', isAuthenticated, async (req, res, next) => {
  const { title, description, ingredients, instructions, servings, prepTime, category } = req.body;
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!recipe) {
      req.flash('error', 'Receita não encontrada.');
      return res.redirect('/recipes');
    }
    if (recipe.authorId !== req.session.userId && req.session.userRole !== 'ADMIN') {
      req.flash('error', 'Sem permissão.');
      return res.redirect(`/recipes/${recipe.id}`);
    }
    await prisma.recipe.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title, description, ingredients, instructions,
        servings: parseInt(servings) || 2,
        prepTime: parseInt(prepTime) || 30,
        category: category || 'Geral'
      }
    });
    req.flash('success', 'Receita atualizada com sucesso! ✅');
    res.redirect(`/recipes/${req.params.id}`);
  } catch (err) { next(err); }
});


router.delete('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!recipe) {
      req.flash('error', 'Receita não encontrada.');
      return res.redirect('/recipes');
    }
    if (recipe.authorId !== req.session.userId && req.session.userRole !== 'ADMIN') {
      req.flash('error', 'Sem permissão.');
      return res.redirect(`/recipes/${recipe.id}`);
    }
    
    await prisma.recipe.updateMany({
      where: { forkedFromId: recipe.id },
      data: { forkedFromId: null }
    });
    await prisma.recipe.delete({ where: { id: parseInt(req.params.id) } });
    req.flash('success', 'Receita excluída.');
    res.redirect('/recipes');
  } catch (err) { next(err); }
});


router.post('/:id/fork', isAuthenticated, async (req, res, next) => {
  try {
    const original = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { author: true }
    });
    if (!original) {
      req.flash('error', 'Receita não encontrada.');
      return res.redirect('/recipes');
    }
    if (original.authorId === req.session.userId) {
      req.flash('error', 'Você não pode forkar sua própria receita.');
      return res.redirect(`/recipes/${original.id}`);
    }

    
    const fork = await prisma.recipe.create({
      data: {
        title:        `Fork de: ${original.title}`,
        description:  original.description,
        ingredients:  original.ingredients,
        instructions: original.instructions,
        servings:     original.servings,
        prepTime:     original.prepTime,
        category:     original.category,
        authorId:     req.session.userId,
        forkedFromId: original.id   
      }
    });

    req.flash('success', `Receita forkada com sucesso! Agora edite sua versão. 🍴`);
    res.redirect(`/recipes/${fork.id}/edit`);
  } catch (err) { next(err); }
});


router.post('/:id/favorite', isAuthenticated, async (req, res, next) => {
  try {
    const recipeId = parseInt(req.params.id);
    const userId   = req.session.userId;
    const user     = await prisma.user.findUnique({
      where: { id: userId },
      include: { favorites: { where: { id: recipeId } } }
    });
    const alreadyFav = user.favorites.length > 0;
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: alreadyFav
          ? { disconnect: { id: recipeId } }
          : { connect:    { id: recipeId } }
      }
    });
    req.flash('success', alreadyFav ? 'Removido dos favoritos.' : 'Adicionado aos favoritos! ⭐');
    res.redirect(`/recipes/${recipeId}`);
  } catch (err) { next(err); }
});

module.exports = router;
