const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma   = new PrismaClient();
const { isAuthenticated, isAdmin } = require('../middleware/auth');


router.get('/', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const [users, recipes, totalForks, totalFavs] = await Promise.all([
      prisma.user.findMany({
        include: { recipes: true, favorites: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.recipe.findMany({
        include: { author: true, forks: true, favoritedBy: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.recipe.count({
        where: { forkedFromId: { not: null } }
      }),
      prisma.recipe.findMany({
        include: { favoritedBy: true }
      }).then(r => r.reduce((acc, rec) => acc + rec.favoritedBy.length, 0))
    ]);
    res.render('admin/dashboard', {
      title: 'Painel Admin',
      users,
      recipes,
      stats: {
        totalUsers:   users.length,
        totalRecipes: recipes.length,
        totalForks,
        totalFavs
      }
    });
  } catch (err) { next(err); }
});


router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const uid = parseInt(req.params.id);
    if (uid === req.session.userId) {
      req.flash('error', 'Você não pode excluir sua própria conta de admin.');
      return res.redirect('/admin');
    }
    
    const userRecipes = await prisma.recipe.findMany({
      where: { authorId: uid }
    });
    for (const r of userRecipes) {
      await prisma.recipe.updateMany({
        where: { forkedFromId: r.id },
        data: { forkedFromId: null }
      });
    }
    await prisma.user.delete({ where: { id: uid } });
    req.flash('success', 'Usuário excluído com sucesso.');
    res.redirect('/admin');
  } catch (err) { next(err); }
});


router.delete('/recipes/:id', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const rid = parseInt(req.params.id);
    await prisma.recipe.updateMany({
      where: { forkedFromId: rid },
      data: { forkedFromId: null }
    });
    await prisma.recipe.delete({ where: { id: rid } });
    req.flash('success', 'Receita excluída com sucesso.');
    res.redirect('/admin');
  } catch (err) { next(err); }
});


router.patch('/users/:id/role', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const uid  = parseInt(req.params.id);
    const { role } = req.body;
    if (!['CHEF', 'ADMIN'].includes(role)) {
      req.flash('error', 'Role inválido.');
      return res.redirect('/admin');
    }
    await prisma.user.update({
      where: { id: uid },
      data: { role }
    });
    req.flash('success', 'Perfil atualizado.');
    res.redirect('/admin');
  } catch (err) { next(err); }
});

module.exports = router;
