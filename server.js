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

// IMPORT TEMPLATES
const newProductData = require('./create_new_product.json');


app.get('/', (req, res) => {
    res.send('App is Running!');
});

app.get('/getAllProductsPrintify', async (req, res) => {
    try {
        const response = await axios.get(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        let currentPage = response.data.current_page;
        let data = response.data.data;

        let eligibleListings = [];

        for (const listing of data) {
            let hasOnlyOneSKUPerSize = true;
            let hasAtLeastOneSKU = false;

            if (listing.variants) {
                let newListing = {
                    listing_id: listing.id,
                    listing_title: listing.title,
                    listing_variants: {}
                };

                for (const variant of listing.variants) {
                    let [color, size] = variant.title.split(' / ');

                    if (!newListing.listing_variants[color]) {
                        newListing.listing_variants[color] = {};
                    }

                    newListing.listing_variants[color][size] = variant;
                }

                // Now check if the listing only has small SKUs
                for (const color in newListing.listing_variants) {
                    let counter = 0;
                    for (const size in newListing.listing_variants[color]) {
                        let sku = newListing.listing_variants[color][size].sku;
                        if (isNaN(sku)) {
                            counter++
                        }
                    }
                    if (counter > 1) {
                        hasOnlyOneSKUPerSize = false;
                    }
                    if (counter > 0) {
                        hasAtLeastOneSKU = true;
                    }
                }

                if (hasOnlyOneSKUPerSize && hasAtLeastOneSKU) {
                    eligibleListings.push(newListing);
                }
            }
        }

        console.log(eligibleListings);

        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data from Printify');
    }
});

app.get('/getPrintifyShops', async (req, res) => {
    try {
        const response = await axios.get(`https://api.printify.com/v1/shops.json`, {
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

app.get('/getBlueprintId', async (req, res) => {
    try {
        const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/6/print_providers/27/variants.json`, {
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

app.get('/createNewProduct', async (req, res) => {
    try {

        const response = await axios.post(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, newProductData, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while creating a product in Printify');
    }
});


// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// Remove the below .listen for Render deployemtn & use the above instead
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    exec(`start http://localhost:${PORT}/getAllProductsPrintify`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
    });
});