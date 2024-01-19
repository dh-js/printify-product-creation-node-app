const { fetchAllListings, updateCanadaSkus, createNewCountryListing } = require('./helper_functions');

async function testPrintAreas() {

    let allProductsData = [];
    for (let i = 1; i <= 6; i++) {
        const products = await fetchAllListings(i);
        allProductsData.push(...products);
    }

    let printAreas = {};
    for (const listing of allProductsData) {
        // Convert the listing's created_at date to a Date object
        let listingDate = new Date(listing.created_at);
        // Create a Date object for 1st Jan 2024
        let cutOffDate = new Date('2024-01-01T00:00:00Z');
        // Skip this listing if it was created on or after 1st Jan 2024
        // if (listingDate >= cutOffDate) {
        //     continue;
        // }

        //Only get Tees
        if (listing.blueprint_id !== 6) {
            continue;
        }

        let newObject = {
            listing_id: listing.id,
            listing_title: listing.title,
            listing_blueprint_id: listing.blueprint_id,
            listing_print_provider_id: listing.print_provider_id,
        }
        let newPlaceholders = [];
            for (const placeholder of listing.print_areas[0].placeholders) {
                if (placeholder.images.length > 0 && placeholder.position !== "neck") {
                    newPlaceholders.push(placeholder);
                }
            }
        newObject.listing_print_areas = newPlaceholders;

        // Trim the title and remove the country code if it exists
        let originalTitle = listing.title.trim();
        let trimmedTitle = originalTitle.replace('AUS NZ', 'AUS');
        let countryCodeMatch = trimmedTitle.match(/(CAN|UK|EU|AUS)$/);
        let titleWithoutCountryCode = trimmedTitle.replace(/(CAN|UK|EU|AUS)$/, '').trim();

        // Add the country code to the newObject, default to 'US' if no match found
        newObject.country_code = countryCodeMatch ? countryCodeMatch[0] : 'US';

        // If the title doesn't exist in the printAreas object, add it
        if (!printAreas[titleWithoutCountryCode]) {
            printAreas[titleWithoutCountryCode] = [];
        }

        // Push the new object to the corresponding array in the printAreas object
        printAreas[titleWithoutCountryCode].push(newObject);
    }

    return printAreas;

    function calculateScaleRatios(printAreas, valueToTest, comparisonCountryCode) {
        let scaleRatios = {};
    
        for (const key in printAreas) {
            let canScale, comparisonScale;
    
            for (const item of printAreas[key]) {
                if (item.country_code === 'CAN') {
                    canScale = item.listing_print_areas[0].images[0][valueToTest];
                } else if (item.country_code === comparisonCountryCode) {
                    comparisonScale = item.listing_print_areas[0].images[0][valueToTest];
                }
            }
    
            if (canScale && comparisonScale) {
                scaleRatios[key] = comparisonScale / canScale;
            }
        }
    
        return scaleRatios;
    }
    
    let scaleRatios = calculateScaleRatios(printAreas, 'y', 'US');

    function calculateAverageScaleRatio(scaleRatios) {
        let sum = 0;
        let count = 0;
    
        for (const key in scaleRatios) {
            sum += scaleRatios[key];
            count++;
        }
    
        return sum / count;
    }
    
    let averageScaleRatio = calculateAverageScaleRatio(scaleRatios);
    console.log(averageScaleRatio);

    return scaleRatios;

}

module.exports = testPrintAreas;