const express = require('express');
const axios = require('axios');

const app = express();
const { exec } = require('child_process');
//uses the port variable set in Render, or 1008
const PORT = process.env.PORT || 1008;
//the following line is necessary to parse the body of the request
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
//Checking for environment - if the code is running on Render then it will have a NODE_ENV of production
console.log('Running in:', process.env.NODE_ENV || 'no environment specified');


app.get('/', (req, res) => {
    res.send('App is Running!');
});

app.get('/getProductsPrintify', async (req, res) => {
    try {
        const response = await axios.get(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data from Printify');
    }
});


// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// Remove the below .listen for Render deployemtn & use the above instead
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    exec(`start http://localhost:${PORT}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
    });
});