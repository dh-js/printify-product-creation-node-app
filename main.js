const { fetchAllListings, updateCanadaSkus, createNewCountryListing } = require('./helper_functions');

async function executeMainLogic() {

    // First, fetch the first 2 pages (200) listings from Printify store and store them in allProductsData array
    let allProductsData = [];
    for (let i = 1; i <= 6; i++) {
        const products = await fetchAllListings(i);
        allProductsData.push(...products);
    }

    // console.log(allProductsData.length);
    // res.send(`<pre>${JSON.stringify(allProductsData, null, 2)}</pre>`);
    // return;

    //console.log('All listings fetched from Printify');

    let eligibleListings = [];
    // Loop through all listings and find the ones that have only the 'small SKU' set up, push them to eligibleListings
    for (const listing of allProductsData) {
        try{
            // Only push listings that are either a tee, sweater or hoodie (id values)
            if (![49, 6, 77].includes(listing.blueprint_id)) {
                continue;
            }

            let hasOnlyOneSKUPerSize = true;
            let hasAtLeastOneSKU = false;

            if (listing.variants) {
                let myVersionOfTheListing = {
                    listing_id: listing.id,
                    listing_title: listing.title.trim(),
                    listing_description: listing.description,
                    listing_blueprint_id: listing.blueprint_id,
                    listing_print_areas: listing.print_areas,
                    listing_variants: {}
                };

                for (const variant of listing.variants) {

                    // If the listing is a sweater (49), the color/size are reversed in the title
                    let color, size;
                    if (listing.blueprint_id === 49) {
                        [size, color] = variant.title.split(' / ');
                    } else {
                        [color, size] = variant.title.split(' / ');
                    }

                    if (!myVersionOfTheListing.listing_variants[color]) {
                        myVersionOfTheListing.listing_variants[color] = {};
                    }

                    myVersionOfTheListing.listing_variants[color][size] = variant;
                }

                // Now check if the listing only has small SKUs
                for (const color in myVersionOfTheListing.listing_variants) {
                    let counter = 0;
                    for (const size in myVersionOfTheListing.listing_variants[color]) {
                        let sku = myVersionOfTheListing.listing_variants[color][size].sku.trim();
                        if (sku.toUpperCase().endsWith('-CAN')) {
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
                    eligibleListings.push(myVersionOfTheListing);
                }
            }
        } catch (error) {
            console.error(`Error processing listing '${listing.title}': ${error.message}`);
        }
    }

    if (eligibleListings.length === 0) {
        //console.log('No eligible listings found');
        return;
    }

    console.log(`Found ${eligibleListings.length} eligible listings`)

    // res.send(`<pre>${JSON.stringify(eligibleListings, null, 2)}</pre>`);
    // return;

    //So eligibleListings will now contain any 'STARTER (CANADA SMALL SKU)' listings
    //Now we need to loop through each listing to update the SKUs
    for (const listing of eligibleListings) {
        try {
            // For each color of the listing
            for (const color in listing.listing_variants) {
                // If this color has a custom small SKU
                if (isNaN(listing.listing_variants[color]['S'].sku)) {
                    // Clean the starter SKU by removing all spaces
                    let smallSKU = listing.listing_variants[color]['S'].sku.replace(/ /g, '');
                    let baseSKU;
                    if (smallSKU.toUpperCase().endsWith('-S-CAN')) {
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
        } catch (error) {
            console.error(`Error updating listing object for '${listing.listing_title}': ${error.message}`);
        }
    }

    console.log('All eligible listings objects have been updated with the correct Canada SKUs');

    // res.send(`<pre>${JSON.stringify(eligibleListings, null, 2)}</pre>`);
    // return;

    // First, create the other country listings
    // Note the available_variant_ids should be taken from the print area variant ids of an existing listing on Printify
    // Key of '6' is the blueprint_id for Gildan 5000 Tee
    // Key of '49' is the blueprint_id for Gildan 18000 Sweater
    // Key of '77' is the blueprint_id for Gildan 18500 Hoodie
    // 'id' is the print_provider_id
    // UK is the only country that has a different print_provider_id for the sweater and hoodie

    const printProviderIds = [
        {
            country: 'US',
            id: 29,
            '6': [11872,11873,11874,11875,11876,11877,11896,11897,11898,11899,11900,11901,11902,11903,11904,11905,11906,11907,11950,11951,11952,11953,11954,11955,11956,11957,11958,11959,11960,11961,11962,11963,11964,11965,11966,11967,11974,11975,11976,11977,11978,11979,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12052,12053,12054,12055,12056,12057,12070,12071,12072,12073,12074,12075,12082,12083,12084,12085,12086,12087,12100,12101,12102,12103,12104,12105,12106,12107,12108,12109,12110,12111,12124,12125,12126,12127,12128,12129,12142,12143,12144,12145,12146,12147,12148,12149,12150,12151,12152,12153,12160,12161,12162,12163,12164,12165,12172,12173,12174,12175,12176,12177,12190,12191,12192,12193,12194,12195,12214,12215,12216,12217,12218,12219,23955,23963,23965,23981,23983,23985,23989,23993,24001,24003,24005,24007,24015,24021,24024,24031,24033,24039,24045,24046,24050,24055,24060,24088,24097,24099,24114,24116,24118,24122,24126,24134,24136,24138,24140,24147,24153,24157,24164,24166,24171,24178,24180,24194,42716,42717,42718,42719,42720,42721,42722,42723,24069,24184,24202],
            '49': [25381,25384,25388,25391,25394,25395,25396,25397,25412,25415,25419,25422,25425,25426,25427,25428,25443,25446,25450,25453,25456,25457,25458,25459,25474,25477,25481,25484,25487,25488,25489,25490,25505,25508,25512,25515,25518,25519,25520,25521,25536,25539,25543,25546,25549,25550,25551,25552,25623,25624,25625,25626,25627,25628,64659,64662,64665,64668,64671,64674],
            '77': [42211,42212,42213,42214,42215,42216,42217,42218,66363,66364,66365,66366,66367,66368,66369,66370,42235,42236,42237,42238,42239,42240,42241,42242,33425,32878,33369,32886,32894,33385,33393,32910,32902,33426,32879,33370,32887,32895,33386,33394,32911,32903,33427,32880,33371,32888,32896,33387,33395,32912,32904,33428,32881,33372,32889,32897,33388,33396,32913,32905,33429,32882,33373,32890,32898,33389,33397,32914,32906,33430,32883,33374,32891,32899,33390,33398,32915,32907,33431,32884,33375,32892,32900,33391,33399,32916,32908,33432,32885,33376,32893,32901,33392,33400,32917,32909]
        },
        {
            country: 'UK',
            id: 6,
            id_sweater_hoodie: 72,
            '6': [11872,11873,11874,11875,11876,11896,11897,11898,11899,11900,11902,11903,11904,11905,11906,11950,11951,11952,11953,11954,11956,11957,11958,11959,11960,11962,11963,11964,11965,11966,11980,11981,11982,11983,11984,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12016,12017,12018,12019,12020,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12052,12053,12054,12055,12056,12057,12070,12071,12072,12073,12074,12100,12101,12102,12103,12104,12105,12119,12120,12121,12124,12125,12126,12127,12128,12129,12130,12131,12132,12133,12134,12148,12149,12150,12151,12152,12190,12191,12192,12193,12194,23993,24005,24007,24031,24039,24126,24138,24140,24164,24171,12118,12122],
            '49': [25375,25376,25377,25378,25379,25380,25381,25382,25383,25384,25385,25386,25387,25388,25389,25390,25391,25392,25394,25395,25396,25397,25399,25400,25401,25402,25404,25405,25406,25407,25408,25409,25410,25411,25412,25413,25414,25415,25416,25417,25418,25419,25420,25421,25422,25423,25425,25426,25427,25428,25430,25431,25432,25433,25435,25436,25437,25438,25439,25440,25441,25442,25443,25444,25445,25446,25447,25448,25449,25450,25451,25452,25453,25454,25456,25457,25458,25459,25461,25462,25463,25464,25466,25467,25468,25469,25470,25471,25472,25473,25474,25475,25476,25477,25478,25479,25480,25481,25482,25483,25484,25485,25487,25488,25489,25490,25492,25493,25494,25495,25497,25498,25499,25500,25501,25502,25503,25504,25505,25506,25507,25508,25509,25510,25511,25512,25513,25514,25515,25516,25518,25519,25520,25521,25523,25524,25525,25526,25528,25529,25534,25543,25546,25550,25551,25552,25559,25565,25574,25577,25581,25582,25583,25590,25623,25624,25625,25626,25627,25628,25629,64657,64659,64660,64662,64663,64665,64666,64668,64669,64671,81938,81939,81940,81941,81942,81943,81944,81946,81947,81948,81949,81950,81951,81952,81953,81954,81955,81956,81957,81958,81959,81993,81994,81995,81996,81997,81998,81999,82000,82001,82002,82003,82004,82005,82006,82007],
            '77': [42195,42196,42197,42198,42199,64689,64690,64691,64692,64693,42251,42252,42253,42254,42255,42259,42260,42261,42262,42263,64697,64698,64699,64700,64701,42267,42268,42269,42270,42271,42148,42149,42150,42151,42152,81503,81504,81505,81506,81507,81519,81520,81521,81522,81523,42275,42276,42277,42278,42279,42203,42204,42205,42206,42207,42211,42212,42213,42214,42215,42216,42219,42220,42221,42222,42223,42227,42228,42229,42230,42231,42235,42236,42237,42238,42239,33417,33425,33345,32870,33353,32878,33361,33369,32886,32894,33377,33385,33393,33401,32910,32902,33418,33426,33346,32871,33354,32879,33362,33370,32887,32895,81511,81512,81513,81514,33378,33386,81515,33394,33402,32911,32903,42156,42157,42158,42159,42160,33419,33427,33347,32872,33355,32880,33363,33371,32888,32896,33379,33387,33395,33403,32912,32904,33420,33428,33348,32873,33356,32881,33364,33372,32889,32897,33380,33388,33396,33404,32913,32905,33421,33429,33349,32874,33357,32882,33365,33373,32890,32898,33381,33389,33397,33405,32914,32906,33430,32891,32899,33390,33398,32915,32907,33431,32892,32900,33391,33399,32916,32908,33432,32893,32901,33392,33400,32917,32909,42164,42165,42166,42167,42168,64681,64682,64683,64684,64685,42243,42244,42245,42246,42247]
        },
        {
            country: 'AUS',
            id: 66,
            '6': [11956,11957,11958,11959,11960,12070,12071,12072,12073,12074,12100,12101,12102,12103,12104,12124,12125,12126,12127,12128],
            '49': [25388,25395,25396,25397,25419,25426,25427,25428,25450,25457,25458,25459,25481,25488,25489,25490,25512,25519,25520,25521],
            '77': [32894,32910,32902,32895,32911,32903,32896,32912,32904,32897,32913,32905,32898,32914,32906,32899,32915,32907]
        },
        {
            country: 'EU',
            id: 26,
            '6': [11848,11849,11850,11851,11852,11853,11866,11867,11868,11869,11870,11872,11873,11874,11875,11876,11896,11897,11898,11899,11900,11901,11904,11906,11944,11945,11946,11947,11948,11950,11951,11952,11953,11954,11955,11956,11957,11958,11959,11960,11962,11963,11964,11965,11966,11974,11975,11977,11978,11979,11986,11987,11988,11989,11990,11991,12010,12011,12012,12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12053,12054,12055,12056,12070,12071,12072,12073,12074,12075,12100,12101,12102,12103,12104,12105,12124,12125,12126,12127,12128,12129,12130,12131,12132,12133,12134,12142,12143,12144,12145,12146,12148,12149,12150,12151,12152,12172,12173,12174,12175,12176,12190,12191,12192,12193,12194,12195,23993,24005,24007,24021,24031,24039,24126,24138,24153,24164,24171,42716,42717,42718,42719,42720,42721,11902,11903,11905,11976,12052,12057,24140],
            '49': [25381,25388,25391,25394,25395,25396,25397,25404,25412,25419,25422,25425,25426,25427,25428,25435,25443,25450,25453,25456,25457,25458,25459,25466,25474,25481,25484,25487,25488,25489,25490,25497,25505,25512,25515,25518,25519,25520,25521,25528,25543,25546,25550,25551,25552,25574,25577,25581,25582,25583,25605,25608,25612,25613,25614],
            '77': [42148,42149,42150,42151,42152,42235,42236,42237,42238,42239,33425,32878,33369,32886,32894,33385,33393,32910,32902,33426,32879,33370,32887,32895,33386,33394,32911,32903,42156,42157,42158,42159,42160,33427,32880,33371,32888,32896,33387,33395,32912,32904,33428,32881,33372,32889,32897,33388,33396,32913,32905,33429,32882,33373,32890,32898,33389,33397,32914,32906,32899,33390,33398,32915,32907,32900,33391,33399,32916,32908,32901,33392,33400,32917,32909]
        }
    ];


    for (listing of eligibleListings) {
        
        for (const printProvider of printProviderIds) {

            let variantsArray = [];
            let allVariantIDs = [];
            for (const color in listing.listing_variants) {
                for (const size in listing.listing_variants[color]) {

                    let variantId = listing.listing_variants[color][size].id;
                    if (printProvider[listing.listing_blueprint_id].includes(variantId)) {

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
                print_provider_title += ' ' + printProvider.country; // Title was previously trim()ed
            }

            // Create a new array of only the placeholders that have images, empty placeholders will cause an 400 error
            // Note that the below is based on the assumption there is onyl 1 print area item(listing_print_areas[0])
            let newPlaceholders = [];
            for (const placeholder of listing.listing_print_areas[0].placeholders) {
                if (placeholder.images.length > 0) {
                    newPlaceholders.push(placeholder);
                }
            }

            // Setting the UK print provider ID depending on whether the listing is a tee or sweater/hoodie
            let printProviderID;
            if (printProvider.country === 'UK') {
                listing.listing_blueprint_id === 6 ? printProviderID = printProvider.id : printProviderID = printProvider.id_sweater_hoodie;
            } else {
                printProviderID = printProvider.id;
            }

            let newProductTemplate = {
                "title": print_provider_title,
                "description": listing.listing_description,
                "blueprint_id": listing.listing_blueprint_id,
                "print_provider_id": printProviderID,
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

            try {
                let createdProductID = await createNewCountryListing(newProductTemplate);
                console.log(`Creation of listing ${print_provider_title} was ${createdProductID ? 'successful' : 'unsuccessful'}`);
            } catch (error) {
                console.error(error);
                console.error(`Error in catch block when creating ${print_provider_title}`);
            }
            
            
            // res.send(`<pre>${JSON.stringify(eligibleListings[0], null, 2)}</pre>`);
            // return;
        // End of for each print provider loop'
        }
    // End of 'for (listing of eligibleListings)'
    }

    // Now PUT request to update the CANADA listing in each eligibleListings item
    // This is done after the new country listings have been created in case there was an error
    for (const listing of eligibleListings) {
        try {
            let success = await updateCanadaSkus(listing);
            console.log(`Canada API SKU update for listing ${listing.listing_title} was ${success ? 'successful' : 'unsuccessful'}`);
        } catch (error) {
            console.error(error);
            console.error(`Error in catch block when updating API Canada SKUs for ${listing.listing_title}`);
        }
    }

    console.log('Completed main process');
    //res.send(`<pre>${JSON.stringify(responseAllProducts.data, null, 2)}</pre>`);
}

module.exports = executeMainLogic;