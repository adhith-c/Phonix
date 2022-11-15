if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const Admin = require('./model/admin');
const User = require('./model/user');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
// const brandRoutes = require('./routes/brandRoutes');

mongoose.connect('mongodb://0.0.0.0:27017/ecommerce');
const db = mongoose.connection;
db.on('error', console.error.bind(console, "conection error"));
db.once('open', () => {
    console.log("Database connected successfully");
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/user/')));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(cookieParser());

const sessionConfig = {
    secret: 'ecom',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://0.0.0.0:27017/ecommerce'
    }),
    cookie: {
        path: '/',
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use(express.urlencoded({
//     extended: true
// }));


passport.use(new LocalStrategy(User.authenticate()));
//passport.use(new LocalStrategy(Admin.authenticate()));


app.use((req, res, next) => {
    res.locals.login = req.isAuthenticated();
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.adminAvailable = req.session.isAdmin;
    res.locals.currentUser = req.user;
    res.locals.session = req.session;
    next();
})

app.use(function (req, res, next) {
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    next();
});


// app.use(csrfProtection);
// app.use(function (req, res, next) {
//     var token = req.csrfToken();
//     res.cookie('XSRF-TOKEN', token);
//     res.locals.csrfToken = token;
//     next();
// });
app.use('/', userRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
// app.use('/brand', brandRoutes);



app.get('/', (req, res) => {

    res.send('Hello world')
})

// app.all('/admin/*', (req, res, next) => {
//     //res.status(404).send("Not found");
//     res.render('admin/404');
//     //next(new ExpressError('page not Found', 404));
// })
app.all('*', (req, res, next) => {
    //res.status(404).send("Not found");
    res.render('user/404');
    //next(new ExpressError('page not Found', 404));
})

app.use((err, req, res, next) => {
    const {
        status = 500
    } = err;
    console.log(err);
    if (!err.message) err.message = "Ooops!"
    res.status(status).render('error', {
        err
    })
    // res.status(status).send(message);

})

app.listen(3000, (req, res) => {
    console.log(`http://localhost:7000`)
})