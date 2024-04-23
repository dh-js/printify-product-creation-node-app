const {
  fetchAllListings,
  updateCanadaSkus,
  createNewCountryListing,
} = require("./helper_functions");

async function executeMainLogic() {
  // First, fetch the first 6 pages (600) listings from Printify and store them in allProductsData array
  let allProductsData = [];
  for (let i = 1; i <= 6; i++) {
    const products = await fetchAllListings(i);
    allProductsData.push(...products);
  }

  // console.log(allProductsData.length);
  // return allProductsData;

  //console.log('All listings fetched from Printify');

  let eligibleListings = [];
  // Loop through all listings and find the ones that have only the 'small SKU' set up, push them to eligibleListings
  for (const listing of allProductsData) {
    try {
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
          listing_variants: {},
        };

        for (const variant of listing.variants) {
          // If the listing is a sweater (49), the color/size are reversed in the title
          let color, size;
          if (listing.blueprint_id === 49) {
            [size, color] = variant.title.split(" / ");
          } else {
            [color, size] = variant.title.split(" / ");
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
            let sku =
              myVersionOfTheListing.listing_variants[color][size].sku.trim();
            if (sku.toUpperCase().endsWith("-CAN")) {
              counter++;
            }
          }
          if (counter > 1) {
            hasOnlyOneSKUPerSize = false;
          }
          if (counter > 0) {
            hasAtLeastOneSKU = true;
          }
        }

        if (
          hasOnlyOneSKUPerSize &&
          hasAtLeastOneSKU &&
          listing.print_provider_id === 27
        ) {
          eligibleListings.push(myVersionOfTheListing);
        }
      }
    } catch (error) {
      console.error(
        `Error processing listing '${listing.title}': ${error.message}`
      );
    }
  }

  if (eligibleListings.length === 0) {
    console.log("No eligible listings found");
    return;
  }

  console.log(`Found ${eligibleListings.length} eligible listings`);

  // return eligibleListings;

  //So eligibleListings will now contain any 'STARTER (CANADA SMALL SKU)' listings
  //Now we need to loop through each listing to update the SKUs
  for (const listing of eligibleListings) {
    try {
      // For each color of the listing
      for (const color in listing.listing_variants) {
        // If this color has a custom small SKU
        if (isNaN(listing.listing_variants[color]["S"].sku)) {
          // Clean the starter SKU by removing all spaces
          let smallSKU = listing.listing_variants[color]["S"].sku.replace(
            / /g,
            ""
          );
          let baseSKU;
          if (smallSKU.toUpperCase().endsWith("-S-CAN")) {
            baseSKU = smallSKU.slice(0, -6);
            // Loop through each size and set the SKU to the baseSKU + the size
            //(Also reset the small SKU value in case it contained spaces)
            for (const size in listing.listing_variants[color]) {
              if (size !== "5XL") {
                listing.listing_variants[color][size].sku =
                  baseSKU + "-" + size + "-CAN";
              }
            }
          } else {
            throw new Error("smallSKU does not end with -S-CAN");
          }
        }
      }
    } catch (error) {
      console.error(
        `Error updating listing object for '${listing.listing_title}': ${error.message}`
      );
    }
  }

  console.log(
    "All eligible listings objects have been updated with the correct Canada SKUs"
  );

  // res.send(`<pre>${JSON.stringify(eligibleListings, null, 2)}</pre>`);
  // return;
  //return eligibleListings;

  // First, create the other country listings
  // Note the available_variant_ids should be taken from the print area variant ids of an existing listing on Printify
  // Key of '6' is the blueprint_id for Gildan 5000 Tee
  // Key of '49' is the blueprint_id for Gildan 18000 Sweater
  // Key of '77' is the blueprint_id for Gildan 18500 Hoodie
  // 'id' is the print_provider_id
  // UK is the only country that has a different print_provider_id for the sweater and hoodie

  const printProviderIds = [
    {
      country: "US",
      id: 29,
      6: [
        11872, 11873, 11874, 11875, 11876, 11877, 11896, 11897, 11898, 11899,
        11900, 11901, 11902, 11903, 11904, 11905, 11906, 11907, 11950, 11951,
        11952, 11953, 11954, 11955, 11956, 11957, 11958, 11959, 11960, 11961,
        11962, 11963, 11964, 11965, 11966, 11967, 11974, 11975, 11976, 11977,
        11978, 11979, 11986, 11987, 11988, 11989, 11990, 11991, 12010, 12011,
        12012, 12013, 12014, 12015, 12016, 12017, 12018, 12019, 12020, 12021,
        12022, 12023, 12024, 12025, 12026, 12027, 12028, 12029, 12030, 12031,
        12032, 12033, 12052, 12053, 12054, 12055, 12056, 12057, 12070, 12071,
        12072, 12073, 12074, 12075, 12082, 12083, 12084, 12085, 12086, 12087,
        12100, 12101, 12102, 12103, 12104, 12105, 12106, 12107, 12108, 12109,
        12110, 12111, 12124, 12125, 12126, 12127, 12128, 12129, 12142, 12143,
        12144, 12145, 12146, 12147, 12148, 12149, 12150, 12151, 12152, 12153,
        12160, 12161, 12162, 12163, 12164, 12165, 12172, 12173, 12174, 12175,
        12176, 12177, 12190, 12191, 12192, 12193, 12194, 12195, 12214, 12215,
        12216, 12217, 12218, 12219, 23955, 23963, 23965, 23981, 23983, 23985,
        23989, 23993, 24001, 24003, 24005, 24007, 24015, 24021, 24024, 24031,
        24033, 24039, 24045, 24046, 24050, 24055, 24060, 24088, 24097, 24099,
        24114, 24116, 24118, 24122, 24126, 24134, 24136, 24138, 24140, 24147,
        24153, 24157, 24164, 24166, 24171, 24178, 24180, 24194, 42716, 42717,
        42718, 42719, 42720, 42721, 42722, 42723, 24069, 24184, 24202,
      ],
      49: [
        25381, 25384, 25388, 25391, 25394, 25395, 25396, 25397, 25412, 25415,
        25419, 25422, 25425, 25426, 25427, 25428, 25443, 25446, 25450, 25453,
        25456, 25457, 25458, 25459, 25474, 25477, 25481, 25484, 25487, 25488,
        25489, 25490, 25505, 25508, 25512, 25515, 25518, 25519, 25520, 25521,
        25536, 25539, 25543, 25546, 25549, 25550, 25551, 25552, 25623, 25624,
        25625, 25626, 25627, 25628, 64659, 64662, 64665, 64668, 64671, 64674,
      ],
      77: [
        32878, 32879, 32880, 32881, 32882, 32883, 32884, 32885, 32886, 32887,
        32888, 32889, 32890, 32891, 32892, 32893, 32894, 32895, 32896, 32897,
        32898, 32899, 32900, 32901, 32902, 32903, 32904, 32905, 32906, 32907,
        32908, 32909, 32910, 32911, 32912, 32913, 32914, 32915, 32916, 32917,
        32918, 32919, 32920, 32921, 32922, 32923, 32924, 32925, 33369, 33370,
        33371, 33372, 33373, 33374, 33375, 33376, 33385, 33386, 33387, 33388,
        33389, 33390, 33391, 33392, 33393, 33394, 33395, 33396, 33397, 33398,
        33399, 33400, 33425, 33426, 33427, 33428, 33429, 33430, 33431, 33432,
        42211, 42212, 42213, 42214, 42215, 42216, 42217, 42218, 42235, 42236,
        42237, 42238, 42239, 42240, 42241, 42242, 66363, 66364, 66365, 66366,
        66367, 66368, 66369, 66370,
      ],
    },
    {
      country: "UK",
      id: 72,
      6: [
        11812, 11813, 11814, 11815, 11816, 11818, 11819, 11820, 11821, 11822,
        11830, 11831, 11832, 11833, 11834, 11836, 11837, 11838, 11839, 11840,
        11842, 11843, 11844, 11845, 11846, 11848, 11849, 11850, 11851, 11852,
        11853, 11866, 11867, 11868, 11869, 11870, 11871, 11872, 11873, 11874,
        11875, 11876, 11877, 11884, 11885, 11886, 11887, 11888, 11890, 11891,
        11892, 11893, 11894, 11895, 11896, 11897, 11898, 11899, 11900, 11901,
        11902, 11903, 11904, 11905, 11906, 11907, 11938, 11939, 11940, 11941,
        11942, 11943, 11944, 11945, 11946, 11947, 11948, 11949, 11950, 11951,
        11952, 11953, 11954, 11955, 11956, 11957, 11958, 11959, 11960, 11961,
        11962, 11963, 11964, 11965, 11966, 11967, 11968, 11969, 11970, 11971,
        11972, 11974, 11975, 11976, 11977, 11978, 11979, 11980, 11981, 11982,
        11983, 11984, 11986, 11987, 11988, 11989, 11990, 11991, 12004, 12005,
        12006, 12007, 12008, 12010, 12011, 12012, 12013, 12014, 12016, 12017,
        12018, 12019, 12020, 12021, 12022, 12023, 12024, 12025, 12026, 12027,
        12028, 12029, 12030, 12031, 12032, 12033, 12034, 12035, 12036, 12037,
        12038, 12046, 12047, 12048, 12049, 12050, 12052, 12053, 12054, 12055,
        12056, 12057, 12058, 12059, 12060, 12061, 12062, 12064, 12065, 12066,
        12067, 12068, 12070, 12071, 12072, 12073, 12074, 12075, 12088, 12089,
        12090, 12091, 12092, 12094, 12095, 12096, 12097, 12098, 12100, 12101,
        12102, 12103, 12104, 12105, 12106, 12107, 12108, 12109, 12110, 12111,
        12112, 12113, 12114, 12115, 12116, 12118, 12119, 12120, 12121, 12122,
        12123, 12124, 12125, 12126, 12127, 12128, 12129, 12130, 12131, 12132,
        12133, 12134, 12136, 12137, 12138, 12139, 12140, 12141, 12142, 12143,
        12144, 12145, 12146, 12147, 12148, 12149, 12150, 12151, 12152, 12154,
        12155, 12156, 12157, 12158, 12166, 12167, 12168, 12169, 12170, 12172,
        12173, 12174, 12175, 12176, 12178, 12179, 12180, 12181, 12182, 12184,
        12185, 12186, 12187, 12188, 12190, 12191, 12192, 12193, 12194, 12195,
        12196, 12197, 12198, 12199, 12200, 12208, 12209, 12210, 12211, 12212,
        23947, 23955, 23963, 23965, 23981, 23983, 23985, 23989, 23993, 24003,
        24005, 24007, 24015, 24021, 24031, 24039, 24045, 24060, 24081, 24088,
        24097, 24099, 24114, 24116, 24118, 24122, 24126, 24136, 24138, 24140,
        24147, 24153, 24164, 24171, 24178, 24194,
      ],
      49: [
        25375, 25376, 25377, 25378, 25379, 25380, 25381, 25382, 25383, 25384,
        25385, 25386, 25387, 25388, 25389, 25390, 25391, 25392, 25394, 25395,
        25396, 25397, 25399, 25400, 25401, 25402, 25404, 25405, 25406, 25407,
        25408, 25409, 25410, 25411, 25412, 25413, 25414, 25415, 25416, 25417,
        25418, 25419, 25420, 25421, 25422, 25423, 25425, 25426, 25427, 25428,
        25430, 25431, 25432, 25433, 25435, 25436, 25437, 25438, 25439, 25440,
        25441, 25442, 25443, 25444, 25445, 25446, 25447, 25448, 25449, 25450,
        25451, 25452, 25453, 25454, 25456, 25457, 25458, 25459, 25461, 25462,
        25463, 25464, 25466, 25467, 25468, 25469, 25470, 25471, 25472, 25473,
        25474, 25475, 25476, 25477, 25478, 25479, 25480, 25481, 25482, 25483,
        25484, 25485, 25487, 25488, 25489, 25490, 25492, 25493, 25494, 25495,
        25497, 25498, 25499, 25500, 25501, 25502, 25503, 25504, 25505, 25506,
        25507, 25508, 25509, 25510, 25511, 25512, 25513, 25514, 25515, 25516,
        25518, 25519, 25520, 25521, 25523, 25524, 25525, 25526, 25528, 25529,
        25534, 25543, 25546, 25550, 25551, 25552, 25559, 25565, 25574, 25577,
        25581, 25582, 25583, 25590, 25623, 25624, 25625, 25626, 25627, 25628,
        25629, 64657, 64659, 64660, 64662, 64663, 64665, 64666, 64668, 64669,
        64671, 81938, 81939, 81940, 81941, 81942, 81943, 81944, 81946, 81947,
        81948, 81949, 81950, 81951, 81952, 81953, 81954, 81955, 81956, 81957,
        81958, 81959, 81993, 81994, 81995, 81996, 81997, 81998, 81999, 82000,
        82001, 82002, 82003, 82004, 82005, 82006, 82007,
      ],
      77: [
        32870, 32871, 32872, 32873, 32874, 32878, 32879, 32880, 32881, 32882,
        32886, 32887, 32888, 32889, 32890, 32891, 32892, 32893, 32894, 32895,
        32896, 32897, 32898, 32899, 32900, 32901, 32902, 32903, 32904, 32905,
        32906, 32907, 32908, 32909, 32910, 32911, 32912, 32913, 32914, 32915,
        32916, 32917, 32918, 32919, 32920, 32921, 32922, 32923, 32924, 32925,
        33345, 33346, 33347, 33348, 33349, 33353, 33354, 33355, 33356, 33357,
        33361, 33362, 33363, 33364, 33365, 33369, 33370, 33371, 33372, 33373,
        33377, 33378, 33379, 33380, 33381, 33385, 33386, 33387, 33388, 33389,
        33390, 33391, 33392, 33393, 33394, 33395, 33396, 33397, 33398, 33399,
        33400, 33401, 33402, 33403, 33404, 33405, 33417, 33418, 33419, 33420,
        33421, 33425, 33426, 33427, 33428, 33429, 33430, 33431, 33432, 42148,
        42149, 42150, 42151, 42152, 42156, 42157, 42158, 42159, 42160, 42164,
        42165, 42166, 42167, 42168, 42195, 42196, 42197, 42198, 42199, 42203,
        42204, 42205, 42206, 42207, 42211, 42212, 42213, 42214, 42215, 42216,
        42219, 42220, 42221, 42222, 42223, 42227, 42228, 42229, 42230, 42231,
        42235, 42236, 42237, 42238, 42239, 42243, 42244, 42245, 42246, 42247,
        42251, 42252, 42253, 42254, 42255, 42259, 42260, 42261, 42262, 42263,
        42267, 42268, 42269, 42270, 42271, 42275, 42276, 42277, 42278, 42279,
        64681, 64682, 64683, 64684, 64685, 64689, 64690, 64691, 64692, 64693,
        64697, 64698, 64699, 64700, 64701, 81503, 81504, 81505, 81506, 81507,
        81511, 81512, 81513, 81514, 81515, 81519, 81520, 81521, 81522, 81523,
      ],
    },
    {
      country: "AUS",
      id: 66,
      6: [
        11956, 11957, 11958, 11959, 11960, 12070, 12071, 12072, 12073, 12074,
        12100, 12101, 12102, 12103, 12104, 12124, 12125, 12126, 12127, 12128,
      ],
      49: [
        25388, 25395, 25396, 25397, 25419, 25426, 25427, 25428, 25450, 25457,
        25458, 25459, 25481, 25488, 25489, 25490, 25512, 25519, 25520, 25521,
      ],
      77: [
        32894, 32895, 32896, 32897, 32898, 32899, 32902, 32903, 32904, 32905,
        32906, 32907, 32910, 32911, 32912, 32913, 32914, 32915, 32918, 32919,
        32920, 32921, 32922, 32923,
      ],
    },
    {
      country: "EU",
      id: 30,
      id_sweater_hoodie: 26,
      6: [
        11872, 11873, 11874, 11875, 11876, 11896, 11897, 11898, 11899, 11900,
        11902, 11903, 11904, 11905, 11906, 11907, 11950, 11951, 11952, 11953,
        11954, 11956, 11957, 11958, 11959, 11960, 11962, 11963, 11964, 11965,
        11966, 11974, 11975, 11976, 11977, 11978, 11979, 11980, 11981, 11982,
        11983, 11984, 11986, 11987, 11988, 11989, 11990, 11991, 12010, 12011,
        12012, 12013, 12014, 12016, 12017, 12018, 12019, 12020, 12021, 12022,
        12023, 12024, 12025, 12026, 12027, 12028, 12029, 12030, 12031, 12032,
        12033, 12052, 12053, 12054, 12055, 12056, 12057, 12070, 12071, 12072,
        12073, 12074, 12100, 12101, 12102, 12103, 12104, 12105, 12124, 12125,
        12126, 12127, 12128, 12129, 12142, 12143, 12144, 12145, 12146, 12148,
        12149, 12150, 12151, 12152, 12190, 12191, 12192, 12193, 12194, 12195,
        23993, 24005, 24007, 24031, 24039, 24126, 24138, 24140, 24164, 24171,
        42716, 42717, 42718, 42719, 42720, 42721,
      ],
      49: [
        25381, 25388, 25391, 25394, 25395, 25396, 25397, 25404, 25412, 25419,
        25422, 25425, 25426, 25427, 25428, 25435, 25443, 25450, 25453, 25456,
        25457, 25458, 25459, 25466, 25474, 25481, 25484, 25487, 25488, 25489,
        25490, 25497, 25505, 25512, 25515, 25518, 25519, 25520, 25521, 25528,
        25543, 25546, 25550, 25551, 25552, 25574, 25577, 25581, 25582, 25583,
        25605, 25608, 25612, 25613, 25614,
      ],
      77: [
        32878, 32879, 32880, 32881, 32882, 32886, 32887, 32888, 32889, 32890,
        32894, 32895, 32896, 32897, 32898, 32899, 32900, 32901, 32902, 32903,
        32904, 32905, 32906, 32907, 32908, 32909, 32910, 32911, 32912, 32913,
        32914, 32915, 32916, 32917, 32918, 32919, 32920, 32921, 32922, 32923,
        32924, 32925, 33369, 33370, 33371, 33372, 33373, 33385, 33386, 33387,
        33388, 33389, 33390, 33391, 33392, 33393, 33394, 33395, 33396, 33397,
        33398, 33399, 33400, 33425, 33426, 33427, 33428, 33429, 42148, 42149,
        42150, 42151, 42152, 42156, 42157, 42158, 42159, 42160, 42235, 42236,
        42237, 42238, 42239,
      ],
    },
  ];

  //Remove test: Below array is to store new product templates to return during testing
  //let newProductTemplatesArray = [];

  for (listing of eligibleListings) {
    for (const printProvider of printProviderIds) {
      let variantsArray = [];
      let allVariantIDs = [];
      for (const color in listing.listing_variants) {
        for (const size in listing.listing_variants[color]) {
          let variantId = listing.listing_variants[color][size].id;
          if (printProvider[listing.listing_blueprint_id].includes(variantId)) {
            let newSKU;
            if (listing.listing_variants[color][size].sku.endsWith("CAN")) {
              newSKU =
                listing.listing_variants[color][size].sku.slice(0, -3) +
                printProvider.country;
            }
            let variant = {
              id: variantId,
              price: listing.listing_variants[color][size].price,
              is_enabled: listing.listing_variants[color][size].is_enabled,
            };
            if (newSKU) {
              variant.sku = newSKU;
            }
            variantsArray.push(variant);
            allVariantIDs.push(variantId);
          }
        }
      }

      // So now we have variantsArray which contains all the variants from CAN that are needed & that are available with this country's print provider
      // And allVariantIDs which contains all the variant IDs from CAN that are needed & that are available with this country's print provider

      let print_provider_title = listing.listing_title;
      if (printProvider.country !== "US") {
        print_provider_title += " " + printProvider.country; // Title was previously trim()ed
      }

      // Create a new array of only the placeholders that have images, empty placeholders will cause an 400 error
      // Note that the below is based on the assumption there is onyl 1 print area item(listing_print_areas[0])
      let newPrintAreas = listing.listing_print_areas.map((printArea) => {
        let newPlaceholders = printArea.placeholders
          .filter((placeholder) => placeholder.images.length > 0)
          .map((placeholder) => {
            // Create a deep copy of the placeholder
            return JSON.parse(JSON.stringify(placeholder));
          });

        // Need to check if the variant_ids are in allVariantIDs
        // And only if they are, then add them to the newPrintAreas.variant_ids
        let eligible_variant_ids = [];
        for (const variant_id of printArea.variant_ids) {
          if (allVariantIDs.includes(variant_id)) {
            eligible_variant_ids.push(variant_id);
          }
        }

        return {
          variant_ids: eligible_variant_ids,
          placeholders: newPlaceholders,
        };
      });

      let productType;
      listing.listing_blueprint_id === 6
        ? (productType = "tee")
        : listing.listing_blueprint_id === 49
        ? (productType = "sweater")
        : listing.listing_blueprint_id === 77
        ? (productType = "hoodie")
        : (productType = "unknown");
      // 3 options for productType: tee, sweater, hoodie
      let canPrintAreaWidth;
      let canPrintAreaHeight;
      let canCollarDistance;
      if (productType === "tee") {
        canPrintAreaWidth = 3600;
        canPrintAreaHeight = 4800;
        canCollarDistance = 570;
      } else if (productType === "sweater") {
        canPrintAreaWidth = 4200;
        canPrintAreaHeight = 4800;
        canCollarDistance = 651;
      } else if (productType === "hoodie") {
        canPrintAreaWidth = 4200;
        canPrintAreaHeight = 2799;
        canCollarDistance = 617;
      }

      // Setting the scale/y/x values for each country
      // The collar distance below was calculated in the Printify dashboard, by manually lining up the top of the
      //image with the bottom of the t-shirt collar and then using the % offset from the print area to calculate
      //the number of pixels from top of print area to bottom of collar
      for (printArea of newPrintAreas) {
        if (printProvider.country === "US") {
          for (const placeholder of printArea.placeholders) {
            if (placeholder.images.length > 0) {
              let printAreaWidth;
              let printAreaHeight;
              let thisCollarDistance;
              if (productType === "tee") {
                printAreaWidth = 4500;
                printAreaHeight = 5100;
                thisCollarDistance = 571;
              } else if (productType === "sweater") {
                printAreaWidth = 4500;
                printAreaHeight = 5100;
                thisCollarDistance = 649;
              } else if (productType === "hoodie") {
                printAreaWidth = 4500;
                printAreaHeight = 3000;
                thisCollarDistance = 627;
              }
              ///////////////////////////
              let canadaScale = placeholder.images[0].scale;
              let targetWidthInPixels = canPrintAreaWidth * canadaScale;
              let newScale = targetWidthInPixels / printAreaWidth;
              //console.log(`US: Scale changed from ${canadaScale} to ${newScale} based on ${targetWidthInPixels} / ${printAreaWidth}`);
              placeholder.images[0].scale = newScale;
              // Now calculate Y co-ordinate
              //Calculate Canada positioning
              let canValueY = placeholder.images[0].y;
              let canPixelsFromTopOfPrintArea = canPrintAreaHeight * canValueY;
              let canPixelsFromBottomOfCollar =
                canPixelsFromTopOfPrintArea + canCollarDistance;
              // Now work out what the US positioning should be
              let pixelsFromTopOfPrintArea =
                canPixelsFromBottomOfCollar - thisCollarDistance;
              let valueY = pixelsFromTopOfPrintArea / printAreaHeight;
              placeholder.images[0].y = valueY;
              //console.log(`US: Y Scale changed from ${canValueY} to ${placeholder.images[0].y}`);
            }
          }
        } else if (printProvider.country === "UK") {
          for (const placeholder of printArea.placeholders) {
            if (placeholder.images.length > 0) {
              let printAreaWidth;
              let printAreaHeight;
              let thisCollarDistance;
              if (productType === "tee") {
                printAreaWidth = 4500;
                printAreaHeight = 5100;
                thisCollarDistance = 585;
              } else if (productType === "sweater") {
                printAreaWidth = 4500;
                printAreaHeight = 5100;
                thisCollarDistance = 651;
              } else if (productType === "hoodie") {
                printAreaWidth = 4500;
                printAreaHeight = 3000;
                thisCollarDistance = 632;
              }
              ////////////////////
              let canadaScale = placeholder.images[0].scale;
              let targetWidthInPixels = canPrintAreaWidth * canadaScale;
              let newScale = targetWidthInPixels / printAreaWidth;
              //console.log(`UK: Scale changed from ${canadaScale} to ${newScale} based on ${targetWidthInPixels} / ${printAreaWidth}`);
              placeholder.images[0].scale = newScale;
              // Now calculate Y co-ordinate
              //Calculate Canada positioning
              let canValueY = placeholder.images[0].y;
              let canPixelsFromTopOfPrintArea = canPrintAreaHeight * canValueY;
              let canPixelsFromBottomOfCollar =
                canPixelsFromTopOfPrintArea + canCollarDistance;
              // Now work out what the UK positioning should be
              let pixelsFromTopOfPrintArea =
                canPixelsFromBottomOfCollar - thisCollarDistance;
              let valueY = pixelsFromTopOfPrintArea / printAreaHeight;
              placeholder.images[0].y = valueY;
              //console.log(`UK: Y Scale changed from ${canValueY} to ${placeholder.images[0].y}`);
            }
          }
        } else if (printProvider.country === "EU") {
          for (const placeholder of printArea.placeholders) {
            if (placeholder.images.length > 0) {
              let printAreaWidth;
              let printAreaHeight;
              let thisCollarDistance;
              if (productType === "tee") {
                printAreaWidth = 4200;
                printAreaHeight = 4800;
                thisCollarDistance = 586;
              } else if (productType === "sweater") {
                printAreaWidth = 4500;
                printAreaHeight = 5100;
                thisCollarDistance = 200;
              } else if (productType === "hoodie") {
                printAreaWidth = 4016;
                printAreaHeight = 3307;
                thisCollarDistance = 181;
              }
              //////////////////////
              let canadaScale = placeholder.images[0].scale;
              let targetWidthInPixels = canPrintAreaWidth * canadaScale;
              let newScale = targetWidthInPixels / printAreaWidth;
              //console.log(`EU: Scale changed from ${canadaScale} to ${newScale} based on ${targetWidthInPixels} / ${printAreaWidth}`);
              placeholder.images[0].scale = newScale;
              // Now calculate Y co-ordinate
              //Calculate Canada positioning
              let canValueY = placeholder.images[0].y;
              let canPixelsFromTopOfPrintArea = canPrintAreaHeight * canValueY;
              let canPixelsFromBottomOfCollar =
                canPixelsFromTopOfPrintArea + canCollarDistance;
              // Now work out what the EU positioning should be
              let pixelsFromTopOfPrintArea =
                canPixelsFromBottomOfCollar - thisCollarDistance;
              let valueY = pixelsFromTopOfPrintArea / printAreaHeight;
              placeholder.images[0].y = valueY;
              //console.log(`EU: Y Scale changed from ${canValueY} to ${placeholder.images[0].y}`);
            }
          }
        } else if (printProvider.country === "AUS") {
          for (const placeholder of printArea.placeholders) {
            if (placeholder.images.length > 0) {
              let printAreaWidth;
              let printAreaHeight;
              let thisCollarDistance;
              if (productType === "tee") {
                printAreaWidth = 4200;
                printAreaHeight = 4800;
                thisCollarDistance = 574;
              } else if (productType === "sweater") {
                printAreaWidth = 4200;
                printAreaHeight = 4800;
                thisCollarDistance = 649;
              } else if (productType === "hoodie") {
                printAreaWidth = 4200;
                printAreaHeight = 2799;
                thisCollarDistance = 631;
              }
              ////////////////////
              let canadaScale = placeholder.images[0].scale;
              let targetWidthInPixels = canPrintAreaWidth * canadaScale;
              let newScale = targetWidthInPixels / printAreaWidth;
              //console.log(`AUS: Scale changed from ${canadaScale} to ${newScale} based on ${targetWidthInPixels} / ${printAreaWidth}`);
              placeholder.images[0].scale = newScale;
              // Now calculate Y co-ordinate
              //Calculate Canada positioning
              let canValueY = placeholder.images[0].y;
              let canPixelsFromTopOfPrintArea = canPrintAreaHeight * canValueY;
              let canPixelsFromBottomOfCollar =
                canPixelsFromTopOfPrintArea + canCollarDistance;
              // Now work out what the EU positioning should be
              let pixelsFromTopOfPrintArea =
                canPixelsFromBottomOfCollar - thisCollarDistance;
              let valueY = pixelsFromTopOfPrintArea / printAreaHeight;
              placeholder.images[0].y = valueY;
              //console.log(`AUS: Y Scale changed from ${canValueY} to ${placeholder.images[0].y}`);
            }
          }
        }
      }

      // Setting the UK print provider ID depending on whether the listing is a tee or sweater/hoodie
      let printProviderID;
      if (printProvider.country === "EU") {
        listing.listing_blueprint_id === 6
          ? (printProviderID = printProvider.id)
          : (printProviderID = printProvider.id_sweater_hoodie);
      } else {
        printProviderID = printProvider.id;
      }

      let newProductTemplate = {
        title: print_provider_title,
        description: listing.listing_description,
        blueprint_id: listing.listing_blueprint_id,
        print_provider_id: printProviderID,
        variants: variantsArray,
        print_areas: newPrintAreas,
      };

      // Remove test: Push the new product template to the array
      // newProductTemplatesArray.push(newProductTemplate);

      try {
        let createdProductID = await createNewCountryListing(
          newProductTemplate
        );
        console.log(
          `Creation of listing ${print_provider_title} was ${
            createdProductID ? "successful" : "unsuccessful"
          }`
        );
      } catch (error) {
        console.error(error);
        console.error(
          `Error in catch block when creating ${print_provider_title}`
        );
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
      console.log(
        `Canada API SKU update for listing ${listing.listing_title} was ${
          success ? "successful" : "unsuccessful"
        }`
      );
    } catch (error) {
      console.error(error);
      console.error(
        `Error in catch block when updating API Canada SKUs for ${listing.listing_title}`
      );
    }
  }

  console.log("Completed main process");

  // Remove test: The below return is only used during testing
  // return newProductTemplatesArray;
  //res.send(`<pre>${JSON.stringify(responseAllProducts.data, null, 2)}</pre>`);
}

module.exports = executeMainLogic;
