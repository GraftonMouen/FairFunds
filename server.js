// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://gjmouen:sv4pvcrpk@cluster0.v9yjtkz.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create a User model using the schema
const User = mongoose.model('User', userSchema);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'fd4305ac6e02e793abecf2f61a32f16c01b1a9c597c288a5',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

// Middleware to set user in locals for EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send('User with the same email already exists. Please choose a different email.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the MongoDB database
        const newUser = await User.create({ name, email, password: hashedPassword });

        req.session.user = newUser; // Set the user in the session
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email in the MongoDB database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send('Invalid credentials');
        }

        req.session.user = user; // Set the user in the session
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// '/profile' route is authenticated
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
