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
                listing_title: listing.title.trim(),
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

            if (hasOnlyOneSKUPerSize && hasAtLeastOneSKU && listing.print_provider_id === 27) {
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
                if (smallSKU.toUpperCase().endsWith('-S-CAN')) {
                    baseSKU = smallSKU.slice(0, -6).toUpperCase();
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
    // ***COMMENTED OUT FOR TESTING***
    // for (const listing of eligibleListings) {
    //     //console.log(listing);
    //     let newTitle = listing.listing_title + ' CAN';
    //     let putObject = {
    //         "title": newTitle,
    //         "variants": []
    //     }
    //     for (const color in listing.listing_variants) {
    //         for (const size in listing.listing_variants[color]) {
    //             putObject.variants.push(listing.listing_variants[color][size]);
    //         }
    //     }
    //     console.log(putObject);
    //     let responsePutRequest;

    //     try {
    //         responsePutRequest = await axios.put(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${listing.listing_id}.json`, putObject, {
    //             headers: {
    //                 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
    //             }
    //         });

    //         res.send(`<pre>${JSON.stringify(responsePutRequest.data, null, 2)}</pre>`);
    //         break;

    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).send('An error occurred while fetching all products from Printify');
    //     }
    // }

    // console.log(eligibleListings);
    // console.log('Exapanded listing_print_areas:');
    // console.log(eligibleListings[0].listing_print_areas);
    // console.log('Exapanded size example:');
    // console.log(eligibleListings[0].listing_variants.White);
    // res.send(`<pre>${JSON.stringify(responseAllProducts.data, null, 2)}</pre>`);
    // return;
    

    // So now all Canada listings are correct with the correct SKUs
    // Now we need to create the other country listings
    // Note the available_variant_ids are from using the /getBlueprintId endpoint
    const printProviderIds = [
        {
            country: 'US',
            id: 29,
            available_variant_ids: [11872,11873,11874,11875,11876,11877,11896,11897,11898,11899,11900,11901,11902,11903,11904,11905,11906,11907,11950,11951,11952,11953,11954,11955,11956,11957,11958,11959,11960,11961,11962,11963,11964,11965,11966,11967,11974,11975,11976,11977,11978,11979,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12052,12053,12054,12055,12056,12057,12070,12071,12072,12073,12074,12075,12082,12083,12084,12085,12086,12087,12100,12101,12102,12103,12104,12105,12106,12107,12108,12109,12110,12111,12124,12125,12126,12127,12128,12129,12142,12143,12144,12145,12146,12147,12148,12149,12150,12151,12152,12153,12160,12161,12162,12163,12164,12165,12172,12173,12174,12175,12176,12177,12190,12191,12192,12193,12194,12195,12214,12215,12216,12217,12218,12219,23955,23963,23965,23981,23983,23985,23989,23993,24001,24003,24005,24007,24015,24021,24024,24031,24033,24039,24045,24046,24050,24055,24060,24088,24097,24099,24114,24116,24118,24122,24126,24134,24136,24138,24140,24147,24153,24157,24164,24166,24171,24178,24180,24194,42716,42717,42718,42719,42720,42721,42722,42723]
        },
        {
            country: 'UK',
            id: 6,
            available_variant_ids: [11872,11873,11874,11875,11876,11896,11897,11898,11899,11900,11902,11903,11904,11905,11906,11950,11951,11952,11953,11954,11956,11957,11958,11959,11960,11962,11963,11964,11965,11966,11980,11981,11982,11983,11984,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12016,12017,12018,12019,12020,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12052,12053,12054,12055,12056,12057,12070,12071,12072,12073,12074,12100,12101,12102,12103,12104,12105,12119,12120,12121,12124,12125,12126,12127,12128,12129,12130,12131,12132,12133,12134,12148,12149,12150,12151,12152,12190,12191,12192,12193,12194,23993,24005,24007,24031,24039,24126,24138,24140,24164,24171]
        },
        {
            country: 'AUS',
            id: 66,
            available_variant_ids: [11956,11957,11958,11959,11960,12070,12071,12072,12073,12074,12100,12101,12102,12103,12104,12124,12125,12126,12127,12128]
        },
        {
            country: 'EU',
            id: 26,
            available_variant_ids: [11848,11849,11850,11851,11852,11853,11866,11867,11868,11869,11870,11872,11873,11874,11875,11876,11896,11897,11898,11899,11900,11901,11904,11906,11944,11945,11946,11947,11948,11950,11951,11952,11953,11954,11955,11956,11957,11958,11959,11960,11962,11963,11964,11965,11966,11974,11975,11977,11978,11979,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12053,12054,12055,12056,12070,12071,12072,12073,12074,12075,12100,12101,12102,12103,12104,12105,12124,12125,12126,12127,12128,12129,12130,12131,12132,12133,12134,12142,12143,12144,12145,12146,12148,12149,12150,12151,12152,12172,12173,12174,12175,12176,12190,12191,12192,12193,12194,12195,23993,24005,24007,24021,24031,24039,24126,24138,24153,24164,24171,42716,42717,42718,42719,42720,42721]
        }
    ];


    for (listing of eligibleListings) {
        
        for (const printProvider of printProviderIds) {

            let variantsArray = [];
            let allVariantIDs = [];
            for (const color in listing.listing_variants) {
                for (const size in listing.listing_variants[color]) {

                    let variantId = listing.listing_variants[color][size].id;
                    if (printProvider.available_variant_ids.includes(variantId)) {

                        let newSKU;
                        if (listing.listing_variants[color][size].sku.endsWith('CAN')) {
                            newSKU = listing.listing_variants[color][size].sku.slice(0, -3) + printProvider.country;
                        }
                        let variant = {
                            "id": variantId,
                            "price": listing.listing_variants[color][size].price,
                            "is_enabled": listing.listing_variants[color][size].is_enabled
                        };
                        if (newSKU) {
                            variant.sku = newSKU;
                        }
                        variantsArray.push(variant);
                        allVariantIDs.push(variantId);
                    }

                }
            }

            let print_provider_title = listing.listing_title;
            if (printProvider.country !== 'US') {
                print_provider_title += ' ' + printProvider.country + ' (For Checking 2)'; // Title was previously trim()ed
            } else {
                print_provider_title += ' (For Checking 2)'; //Remove this and the For Checking above after testing
            }

            // Create a new array of only the placeholders that have images, empty placeholders will cause an 400 error
            // Note that the below is based on the assumption there is onyl1 pint area item(listing_print_areas[0])
            let newPlaceholders = [];
            for (const placeholder of listing.listing_print_areas[0].placeholders) {
                if (placeholder.images.length > 0) {
                    newPlaceholders.push(placeholder);
                }
            }

            let newProductTemplate = {
                "title": print_provider_title,
                "description": listing.listing_description,
                "blueprint_id": listing.listing_blueprint_id,
                "print_provider_id": printProvider.id,
                "variants": variantsArray,
                "print_areas": [
                    {
                    "variant_ids": allVariantIDs,
                    "placeholders": newPlaceholders
                  }
                ]
            }

            //res.send(`<pre>${JSON.stringify(newProductTemplate, null, 2)}</pre>`);
            //return;

            let createdProductID;

            try {

                const newProductResponse = await axios.post(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, newProductTemplate, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
                    }
                });
                
                createdProductID = newProductResponse.data.id;
                // res.send(`<pre>${JSON.stringify(newProductResponse.data, null, 2)}</pre>`);
                // return;
            } catch (error) {
                console.error(error);
                // res.status(500).send('An error occurred while creating the product in Printify');
                // return;
            }

            console.log(`Created product ${createdProductID} for ${printProvider.country}`);

            ////////////////////////////////////////////////////////////
            // NOW UPDATE NEWLY CREATED PRODUCT WITH NEW/CORRECT SKUS //
            ////////////////////////////////////////////////////////////
            // let putObjectForUpdate = {
            //     "variants": []
            // }

            // for (const color in listing.listing_variants) {
            //     for (const size in listing.listing_variants[color]) {
            //         let variantCopy = { ...listing.listing_variants[color][size] }; // Creating copy so original object isn't modified
            //         // If SKU ends with 'CAN' then remove it and append printProvider.country instead
            //         if (variantCopy.sku.endsWith('CAN')) {
            //             variantCopy.sku = variantCopy.sku.slice(0, -3) + printProvider.country;
            //         }
            //         putObjectForUpdate.variants.push(variantCopy);
            //     }
            // }
            // console.log(putObjectForUpdate);

            // let responseSkuUpdateRequest;
    
            // try {
            //     responseSkuUpdateRequest = await axios.put(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdProductID}.json`, putObjectForUpdate, {
            //         headers: {
            //             'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            //         }
            //     });
    
            //     res.send(`<pre>${JSON.stringify(responseSkuUpdateRequest.data, null, 2)}</pre>`);
            //     break;
    
            // } catch (error) {
            //     console.error(error);
            //     res.status(500).send('An error occurred while fetching all products from Printify');
            // }
            
            
            
            
            
            
            
            // res.send(`<pre>${JSON.stringify(eligibleListings[0], null, 2)}</pre>`);
            // return;

        // End of for each print provider loop'
        }
    // End of 'for (listing of eligibleListings)'
    }

    res.send('Completed');
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

    let printProviderId = 29;

    try {
        const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/6/print_providers/${printProviderId}/variants.json`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        //Create an array of all the available variant IDs
        let availableVariantIDs = [];
        for (const variant of response.data.variants) {
            availableVariantIDs.push(variant.id);
        }

        res.send(availableVariantIDs);
        //res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
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

app.get('/deleteProduct', async (req, res) => {

    let productId = "659dee45516abeea7f0514f8";

    try {

        const response = await axios.delete(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${productId}.json`, newProductData, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while deleting a product in Printify');
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