const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma   = new PrismaClient();

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { title: 'Login' });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Email ou senha incorretos.');
      return res.redirect('/auth/login');
    }
    req.session.userId    = user.id;
    req.session.userName  = user.name;
    req.session.userEmail = user.email;
    req.session.userRole  = user.role;
    req.flash('success', `Bem-vindo(a), ${user.name}! 🍴`);
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Erro ao fazer login.');
    res.redirect('/auth/login');
  }
});

// GET /auth/register
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { title: 'Criar Conta' });
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword, bio } = req.body;
  if (password !== confirmPassword) {
    req.flash('error', 'As senhas não coincidem.');
    return res.redirect('/auth/register');
  }
  if (password.length < 6) {
    req.flash('error', 'A senha deve ter pelo menos 6 caracteres.');
    return res.redirect('/auth/register');
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      req.flash('error', 'Este email já está em uso.');
      return res.redirect('/auth/register');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, bio: bio || null }
    });
    req.session.userId    = user.id;
    req.session.userName  = user.name;
    req.session.userEmail = user.email;
    req.session.userRole  = user.role;
    req.flash('success', `Conta criada com sucesso! Bem-vindo(a), ${user.name}! 🎉`);
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Erro ao criar conta.');
    res.redirect('/auth/register');
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;