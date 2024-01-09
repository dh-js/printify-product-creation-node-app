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

app.get('/productCreationProcess', async (req, res) => {

    let allProductsData;
    let responseAllProducts;

    //************ WILL NEED TO LOOP OVER ALL PAGES

    try {
        responseAllProducts = await axios.get(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        let currentPage = responseAllProducts.data.current_page;
        allProductsData = responseAllProducts.data.data;

        res.send(`<pre>${JSON.stringify(responseAllProducts.data, null, 2)}</pre>`);
        return;

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching all products from Printify');
    }

    let eligibleListings = [];
    // Loop through all listings and find the ones that have only the 'small SKU' set up, push them to eligibleListings
    for (const listing of allProductsData) {
        let hasOnlyOneSKUPerSize = true;
        let hasAtLeastOneSKU = false;

        if (listing.variants) {
            let newListing = {
                listing_id: listing.id,
                listing_title: listing.title,
                listing_description: listing.description,
                listing_blueprint_id: listing.blueprint_id,
                listing_print_areas: listing.print_areas,
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

            if (hasOnlyOneSKUPerSize && hasAtLeastOneSKU && listing.listing.print_provider_id === 27) {
                eligibleListings.push(newListing);
            }
        }
    }

    //So eligibleListings will now contain any 'STARTER (CANADA SMALL SKU)' listings
    //Now we need to loop through each listing to update the SKUs
    for (const listing of eligibleListings) {
        // For each color of the listing
        for (const color in listing.listing_variants) {
            // If this color has a custom small SKU
            if (isNaN(listing.listing_variants[color]['S'].sku)) {
                // Clean the starter SKU by removing all spaces
                let smallSKU = listing.listing_variants[color]['S'].sku.replace(/ /g, '');
                let baseSKU;
                if (smallSKU.endsWith('-S-CAN')) {
                    baseSKU = smallSKU.slice(0, -6);
                    // Loop through each size and set the SKU to the baseSKU + the size 
                    //(Also reset the small SKU value in case it contained spaces)
                    for (const size in listing.listing_variants[color]) {
                        if (size !== '5XL') {
                            listing.listing_variants[color][size].sku = baseSKU + '-' + size + '-CAN';
                        }
                    }
                } else {
                    throw new Error('smallSKU does not end with -S-CAN');
                }
            }
        }
    }

    // So now we have all variant objects with the correct SKUs
    // Now PUT request to update the CANADA listing in each eligibleListings item
    for (const listing of eligibleListings) {
        //console.log(listing);
        let newTitle = listing.listing_title + ' CAN';
        let putObject = {
            "title": newTitle,
            "variants": []
        }
        for (const color in listing.listing_variants) {
            for (const size in listing.listing_variants[color]) {
                putObject.variants.push(listing.listing_variants[color][size]);
            }
        }
        console.log(putObject);
        let responsePutRequest;

        try {
            responsePutRequest = await axios.put(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${listing.listing_id}.json`, putObject, {
                headers: {
                    'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
                }
            });

            res.send(`<pre>${JSON.stringify(responsePutRequest.data, null, 2)}</pre>`);
            break;

        } catch (error) {
            console.error(error);
            res.status(500).send('An error occurred while fetching all products from Printify');
        }
    }


    // So now all Canada listings are correct with the correct SKUs
    // Now we need to create the other country listings
    const printProviderIds = [
        {
            country: 'US',
            id: 29
        },
        {
            country: 'UK',
            id: 6
        },
        {
            country: 'AUS',
            id: 66
        },
        {
            country: 'EU',
            id: 26
        }
    ];

    for (listing of eligibleListings) {

        // Create an array of all of the variants in the format:
        // {
        //     "id": 12100,
        //     "price": 400,
        //     "is_enabled": true
        // },
        // And also create an array of all of the ids like:
        // "variant_ids": [12100,12101,12102,12103,12104],

        let variantsArray = [];
        let allVariantIds = [];

        for (const color in listing.listing_variants) {
            for (const size in listing.listing_variants[color]) {
                variantsArray.push(
                    {
                        "id": listing.listing_variants[color][size].id,
                        "price": listing.listing_variants[color][size].price,
                        "is_enabled": listing.listing_variants[color][size].is_enabled
                    }
                );
                allVariantIds.push(listing.listing_variants[color][size].id);
            }
        }
        
        for (const printProvider of printProviderIds) {

            let newProductTemplate = {
                "title": listing.listing_title,
                "description": listing.listing_description,
                "blueprint_id": listing.listing_blueprint_id,
                "print_provider_id": printProvider.id,
                "variants": variantsArray,
                "print_areas": listing.listing_print_areas
            }

        }
    // End of 'for (listing of eligibleListings)'
    }


    //res.send(`<pre>${JSON.stringify(responseAllProducts.data, null, 2)}</pre>`);
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
    exec(`start http://localhost:${PORT}/productCreationProcess`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
    });
});