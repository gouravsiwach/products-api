const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());

// Connect to MongoDB

mongoose
  .connect("mongodb://127.0.0.1:27017/products", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.use(bodyParser.json());

// Define your Mongoose Schema for Products
const productSchema = new mongoose.Schema({
  productID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  featured: { type: Boolean },
  rating: { type: Number },
  createdAt: { type: Date, required: true },
  company: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

// Implement Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, "your-secret-key", (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if the token is invalid

    // You can further check user permissions here if needed

    req.user = user;
    next();
  });
}

// Implement endpoints

// 1. Add a product
app.post("/products", authenticateToken, async (req, res) => {
  try {
    const product = new Product(req.body);

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Get all products
app.get("/products", authenticateToken, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// 3. Update a product
app.put("/products/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Delete a product
app.delete("/products/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndRemove(id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Fetch featured products
app.get("/products/featured", async (req, res) => {
  const featuredProducts = await Product.find({ featured: true });
  res.json(featuredProducts);
});

// 6. Fetch products with price less than a certain value
app.get("/products/price/:maxPrice", async (req, res) => {
  const { maxPrice } = req.params;
  const products = await Product.find({ price: { $lt: maxPrice } });
  res.json(products);
});

// 7. Fetch products with rating higher than a certain value
app.get("/products/rating/:minRating", async (req, res) => {
  const { minRating } = req.params;
  const products = await Product.find({ rating: { $gt: minRating } });
  res.json(products);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const axios = require("axios");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Implement User Registration Endpoint
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Generate a salt and hash the password
    const saltRounds = 10; // You can adjust the number of salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new User document
    const user = new User({
      username: username,
      password: hashedPassword,
    });

    // Save the user to the database
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define your user data array (for this example)

// Route to handle registration

const userPassword = "Gourav098";

// Generate a salt and hash the password
bcrypt.hash(userPassword, 10, (err, hashedPassword) => {
  if (err) {
    console.error("Error hashing password:", err);
    return;
  }

  // The hashedPassword contains the securely hashed value
  console.log("Hashed Password:", hashedPassword);
});
// Define the login data
const loginData = {
  username: User.username,
  password: User.password,
};

// Make a POST request to the /login endpoint
axios
  .post("http://localhost:5000/login", loginData)
  .then((response) => {
    const token = response.data.token;
    console.log("JWT Token:", token);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

// Sample user data in your database
const users = [
  {
    username: User.username,
    password: User.password, // Replace with the hashed password
  },
];

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in your database
    const user = await User.findOne({ username });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // If the password matches, generate a JWT token
      const token = jwt.sign({ username: user.username }, "YourSecretKey"); // Replace with your secret key

      res.json({ token });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
