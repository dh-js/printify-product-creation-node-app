// Useful endpoints for testing and debugging

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

    let printProviderId = 26;
    let blueprintId = 49;

    try {
        const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
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

    let productId = "";

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

app.get('/compareArrays', (req, res) => {
    let diff1 = current_array.filter(x => !print_variants_array.includes(x));
    let diff2 = print_variants_array.filter(x => !current_array.includes(x));

    res.send({
        'In_current_array_not_in_print_variants_array': diff1,
        'In_print_variants_array_not_in_current_array': diff2
    });
});

let current_array = [42148,42149,42150,42151,42152,42235,42236,42237,42238,42239,33425,32878,33369,32886,32894,33385,33393,32910,32902,33426,32879,33370,32887,32895,33386,33394,32911,32903,42156,42157,42158,42159,42160,33427,32880,33371,32888,32896,33387,33395,32912,32904,33428,32881,33372,32889,32897,33388,33396,32913,32905,33429,32882,33373,32890,32898,33389,33397,32914,32906,32899,33390,33398,32915,32907,32900,33391,33399,32916,32908,32901,33392,33400,32917,32909]

let print_variants_array = [
    42148,
    42149,
    42150,
    42151,
    42152,
    42235,
    42236,
    42237,
    42238,
    42239,
    33425,
    32878,
    33369,
    32886,
    32894,
    33385,
    33393,
    32910,
    32902,
    33426,
    32879,
    33370,
    32887,
    32895,
    33386,
    33394,
    32911,
    32903,
    42156,
    42157,
    42158,
    42159,
    42160,
    33427,
    32880,
    33371,
    32888,
    32896,
    33387,
    33395,
    32912,
    32904,
    33428,
    32881,
    33372,
    32889,
    32897,
    33388,
    33396,
    32913,
    32905,
    33429,
    32882,
    33373,
    32890,
    32898,
    33389,
    33397,
    32914,
    32906,
    32899,
    33390,
    33398,
    32915,
    32907,
    32900,
    33391,
    33399,
    32916,
    32908,
    32901,
    33392,
    33400,
    32917,
    32909
  ]