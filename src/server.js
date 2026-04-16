require('dotenv').config();
const express        = require('express');
const expressLayouts = require('express-ejs-layouts');
const session        = require('express-session');
const flash          = require('connect-flash');
const methodOverride = require('method-override');
const path           = require('path');

const indexRoutes  = require('./routes/index');
const authRoutes   = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const adminRoutes  = require('./routes/admin');

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layout');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));


app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));


app.use(flash());


app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? {
    id:    req.session.userId,
    name:  req.session.userName,
    email: req.session.userEmail,
    role:  req.session.userRole
  } : null;
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});


app.use('/',        indexRoutes);
app.use('/auth',    authRoutes);
app.use('/recipes', recipeRoutes);
app.use('/admin',   adminRoutes);


app.use((req, res) => {
  res.status(404).render('404', { title: 'Página não encontrada' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Erro interno', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍴 Forkable Recipes rodando em http://localhost:${PORT}`);
});