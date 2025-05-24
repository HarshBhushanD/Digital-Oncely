const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Add login route handler
app.post('/api/login', async (req, res) => {
    console.log('Login request received:', req.body);
    try {
        const { email, password } = req.body;
        
        console.log('Sending request to Lambda:', {
            task: 'auth',
            action: 'login',
            email,
            website: req.headers.host || 'digital-oncely.com'
        });

        const response = await fetch('https://rh5f3cc2p0.execute-api.us-east-1.amazonaws.com/prod/backend_function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                task: 'auth',
                action: 'login',
                email: email,
                password: password,
                website: req.headers.host || 'digital-oncely.com'
            })
        });

        console.log('Lambda response status:', response.status);
        const data = await response.json();
        console.log('Lambda response:', data);

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Add verify route handler
app.post('/api/verify', async (req, res) => {
    console.log('Verify request received');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const response = await fetch('https://rh5f3cc2p0.execute-api.us-east-1.amazonaws.com/prod/backend_function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                task: 'verify'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Add fetch route handler
app.post('/api/fetch', async (req, res) => {
    console.log('Fetch request received');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const response = await fetch('https://rh5f3cc2p0.execute-api.us-east-1.amazonaws.com/prod/backend_function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                task: 'fetch',
                projectType: 'digital-oncely',
                limit: 10,
                page: 1
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Add signup route handler
app.post('/api/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    try {
        const { name, email, password } = req.body;
        
        const response = await fetch('https://rh5f3cc2p0.execute-api.us-east-1.amazonaws.com/prod/backend_function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                task: 'auth',
                action: 'signup',
                name: name,
                email: email,
                password: password,
                website: req.headers.host || 'digital-oncely.com'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Define subscriber schema and model (only once)
const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    discountCode: {
        type: String,
        default: null
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    codeUsed: {
        type: Boolean,
        default: false
    }
});

let Subscriber;
try {
    Subscriber = mongoose.model('Subscriber');
} catch (e) {
    Subscriber = mongoose.model('Subscriber', subscriberSchema);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_subscribers')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Product routes
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/products/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// API route to subscribe user
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ success: false, message: 'Email already subscribed' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ success: true, message: 'Subscription successful' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API route to get subscriber count
app.get('/api/subscribers/count', async (req, res) => {
    try {
        const count = await Subscriber.countDocuments();
        res.json({ count: count + 1189873 });
    } catch (error) {
        console.error('Count error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API route to save discount code
app.post('/api/save-discount', async (req, res) => {
    try {
        const { email, discountCode } = req.body;

        await Subscriber.findOneAndUpdate(
            { email },
            { discountCode },
            { new: true }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving discount code:', error);
        res.status(500).json({ success: false });
    }
});

// API route to validate discount code
app.post('/api/validate-discount', async (req, res) => {
    try {
        const { email, discountCode } = req.body;

        const subscriber = await Subscriber.findOne({
            email,
            discountCode,
            codeUsed: false
        });

        if (subscriber) {
            res.status(200).json({ valid: true });
        } else {
            res.status(200).json({ valid: false });
        }
    } catch (error) {
        console.error('Error validating discount code:', error);
        res.status(500).json({ valid: false });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- POST /api/login');
    console.log('- POST /api/verify');
    console.log('- POST /api/fetch');
    console.log('- POST /api/signup');
});
