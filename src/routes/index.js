const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { author: true, forkedFrom: { include: { author: true } }, forks: true, favoritedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 9
    });
    res.render('index', { title: 'Forkable Recipes', recipes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
