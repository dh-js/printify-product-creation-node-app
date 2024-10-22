// exec used for automatically opening browser window during local development
// const { exec } = require("child_process");
const cron = require("node-cron");
const express = require("express");
const app = express();

//uses the port variable set by the hosting provider, or 3000
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
//Checking for environment - if the code is running on web host then it should have a NODE_ENV of production
console.log("Running in:", process.env.NODE_ENV || "no environment specified");

// IMPORT MAIN PROCESS
const executeMainLogic = require("./main");
// const testPrintAreas = require('./test_print_areas');
// const executeMainTestLogic = require("./main_test");

app.get("/", (req, res) => {
  res.send("App is Running!");
});

let isRunning = false;

cron.schedule("*/5 * * * *", async function () {
  if (isRunning) {
    console.log("Previous cron job still running, skipping this iteration");
    return;
  }

  isRunning = true;
  try {
    await executeMainLogic();
  } catch (error) {
    console.error("Error executing main logic:", error);
  } finally {
    isRunning = false;
  }
});

// Hit the below endpoint to run a test during local dev
// app.get('/testPrintAreas', async (req, res) => {
//     try {
//         const allProductsData = await testPrintAreas();
//         res.send(`<pre>${JSON.stringify(allProductsData, null, 2)}</pre>`);
//     } catch (error) {
//         console.error('Error executing testPrintAreas logic:', error);
//         res.status(500).send('An error occurred while executing testPrintAreas');
//     }
// });

// Hit the below endpoint to run the main logic during local dev
// app.get("/mainTest", async (req, res) => {
//   try {
//     const allProductsData = await executeMainTestLogic();
//     res.send(`<pre>${JSON.stringify(allProductsData, null, 2)}</pre>`);
//   } catch (error) {
//     console.error("Error executing executeMainTestLogic logic:", error);
//     res
//       .status(500)
//       .send("An error occurred while executing executeMainTestLogic");
//   }
// });

// Below is for live app
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Use below block to automatically open browser window during local development
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   exec(`start http://localhost:${PORT}/mainTest`, (err, stdout, stderr) => {
//     if (err) {
//       console.error(`exec error: ${err}`);
//       return;
//     }
//   });
// });
