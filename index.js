const express = require("express");
const path = require("path");
const bcrypt = require('bcrypt');
const collection = require("./config");
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Nodemailer setup (replace with your email service details)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gjmouen@gmail.com', // Replace with your email
        pass: 'Albus1996$' // Replace with your email password
    }
});

// Helper function to generate a random verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

// Define routes
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    try {
        const data = {
            name: req.body.fullname,
            password: req.body.password,
            email: req.body.email // Add an email field to your signup form
        };

        // Check if the username or email already exists in the database
        const existingUser = await collection.findOne({
            $or: [
                { name: data.name },
                { email: data.email }
            ]
        });

        if (existingUser) {
            return res.send('User with the same username or email already exists. Please choose different credentials.');
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        // Insert the new user into the database
        const newUser = await collection.create(data);

        // Generate and send email verification code
        const verificationCode = generateVerificationCode();

        const mailOptions = {
            from: 'gjmouen@gmail.com',
            to: data.email,
            subject: 'FairwayFunds Email Verification',
            text: `Your verification code is: ${verificationCode}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Failed to send verification email.');
            }

            console.log('Email sent: ' + info.response);
            res.redirect('/'); // Redirect to login page or another page after successful signup
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
