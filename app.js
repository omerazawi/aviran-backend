const express = require('express');
const cron = require("node-cron");
const path = require('path');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const {routesInit} = require('./routes/config_routes');
const {ScheduleSchema} = require('./models/ScheduleModel');
require("./DB/mongoConnect");

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, 'public')));
routesInit(app);

const server = http.createServer(app);

cron.schedule("* * * * *", async () => {
  try {
    console.log("Cron job started");  // בדיקה אם הקרון רץ בכלל
    const currentDate = new Date(); 

    // המרת התאריך הנוכחי לפורמט DD-MM-YYYY
    const currentDateString = 
      ("0" + currentDate.getDate()).slice(-2) + "-" + 
      ("0" + (currentDate.getMonth() + 1)).slice(-2) + "-" + 
      currentDate.getFullYear();

    const currentTimeString = currentDate.toTimeString().split(" ")[0]; // HH:MM:SS

    console.log("Current Date: " + currentDateString); // הדפסת התאריך
    console.log("Current Time: " + currentTimeString); // הדפסת השעה

    // מחיקת תורים שהתאריך שלהם עבר או שהתאריך הוא היום והשעה שלהם כבר עברו
    const result = await ScheduleSchema.deleteMany({
      $or: [
        { Date: { $lt: currentDateString } }, // תור עם תאריך עבר
        {
          Date: { $eq: currentDateString },  // תור עם תאריך היום
          Hour: { $lt: currentTimeString },  // שעה שעברה
        },
      ],
    });

    if (result.deletedCount > 0) {
      console.log(`Old appointments cleaned up successfully: ${result.deletedCount} appointments removed.`);
    } else {
      console.log("No appointments found to clean up.");
    }
  } catch (err) {
    console.error("Error cleaning up old appointments:", err);
  }
});





let port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
