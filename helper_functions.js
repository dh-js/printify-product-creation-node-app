const axios = require('axios');

async function fetchAllListings(page, retries = 3) {
    try {
        const response = await axios.get(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json/?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch products for page ${page}: ${error}`);
        if (retries > 0) {
            console.log(`Retrying fetchAllListings for page ${page}, (${retries} attempts left)...`);
            return fetchAllListings(page, retries - 1);
        } else {
            console.error(`No more retries left for fetchAllListings page ${page}`);
            throw error;
        }
    }
}


async function updateCanadaSkus(listing, retries = 3) {
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

    try {
        await axios.put(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${listing.listing_id}.json`, putObject, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        return true;

    } catch (error) {
        console.error(error);
        if (retries > 0) {
            console.log(`updateCanadaSkus attempt failed. ${retries} retries left. Retrying...`);
            return updateCanadaSkus(listing, retries - 1);
        } else {
            return false;
        }
    }
}


async function createNewCountryListing(newProductTemplate, retries = 3) {

    try {
        const newProductResponse = await axios.post(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, newProductTemplate, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
            }
        });

        return newProductResponse.data.id;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
            console.log(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
        if (retries > 0) {
            console.log(`createNewCountryListing attempt failed. ${retries} retries left. Retrying...`);
            return createNewCountryListing(newProductTemplate, retries - 1);
        } else {
            return null;
        }
    }
        
}


module.exports = {
    fetchAllListings,
    updateCanadaSkus,
    createNewCountryListing
};