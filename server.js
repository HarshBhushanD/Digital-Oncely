const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();

// Enable CORS for all routes with specific options
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Proxy endpoint for API requests
app.post('/api', async (req, res) => {
    try {
        // Forward all headers from the original request
        const headers = {
            'Content-Type': 'application/json',
            ...req.headers
        };
        delete headers.host; // Remove the host header as it should be set by axios

        const response = await axios.post('https://ltqlisa626.execute-api.us-east-2.amazonaws.com/api', req.body, {
            headers: headers
        });

        // Forward the response headers
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Internal server error'
        });
    }
});

// Proxy endpoint for handling CORS and forwarding requests
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    const response = await axios({
      url,
      method: method || 'POST',
      headers: { ...headers, 'Origin': req.headers.origin },
      data: body
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    const routeMap = {
        '/': 'index.html',
        '/login': 'login.html',
        '/signup': 'signup.html',
        '/products': 'products.html',
        '/addproduct': 'addproduct.html',
        '/product': 'product.html'
    };

    const htmlFile = routeMap[req.path] || 'index.html';
    res.sendFile(path.join(__dirname, 'public', htmlFile));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 