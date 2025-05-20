const {sendAppointmentEmail} = require('../services/Mail');
const express = require("express");
const { ScheduleSchema } = require("../models/ScheduleModel");
const router = express.Router();

// ------------קבלת כל התורים------------
router.get("/all", async (req, res) => {
  try {
    // שליפת כל התורים מהמסד נתונים
    const appointments = await ScheduleSchema.find();

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

// חיפוש התורים לפי תאריך
router.get("/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const appointments = await ScheduleSchema.find({ Date: date });

    if (appointments.length === 0) {
      return res.json('empty'); 
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

// ------------יצירת תורים------------
router.post("/create", async (req, res) => {
  try {
    const { appointments } = req.body;

    if (!appointments || appointments.length === 0) {
      return res.status(400).json({ error: "Appointments data is required" });
    }

    const createdAppointments = [];
    const skippedAppointments = [];

    for (const appointment of appointments) {
      const { Date, Day, Hour, Comments } = appointment;

      // בדיקה אם שדה חובה חסר
      if (!Date || !Hour) {
        skippedAppointments.push({ Date, Hour, reason: "Missing required fields" });
        continue;
      }

      // בדיקה אם תור קיים
      const existingAppointment = await ScheduleSchema.findOne({ Date, Hour });
      if (existingAppointment) {
        skippedAppointments.push({ Date, Hour, reason: "Appointment already exists" });
        continue;
      }

      // יצירת תור חדש
      const newAppointment = new ScheduleSchema({
        FullName: null, // אין שם משתמש בתחילה
        Tel: null,
        Date,
        Hour,
        Day, // יום בשבוע
        Comments: Comments || "אין הערות",
      });

      await newAppointment.save();
      createdAppointments.push(newAppointment);
    }

    res.status(201).json({
      message: "Bulk appointment creation completed",
      createdAppointments,
      skippedAppointments,
    });
  } catch (error) {
    console.error("Error creating bulk appointments:", error);
    res.status(500).json({ error: "Error creating bulk appointments" });
  }
});

// --------------------עדכון תור לפי לקוח---------------
router.put("/update-user", async (req, res) => {
  try {
    const { FullName, Tel, Date, Hour, Comments } = req.body;

    // Ensure required fields are provided
    if (!FullName || !Tel || !Date || !Hour) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user already has an appointment
    const existingUserAppointment = await ScheduleSchema.findOne({
      FullName,
      Tel,
      Date: { $ne: Date }, // תור אחר (לא אותו תאריך)
      Hour: { $ne: Hour }, // תור אחר (לא אותה שעה)
    });

    await sendAppointmentEmail({
  fullName: req.body.FullName,
  tel: req.body.Tel,
  date: req.body.Date,
  hour: req.body.Hour
});

    if (existingUserAppointment) {
      return res.status(409).json({
        error: `אנחנו מצטערים ${FullName}, קיים לך כבר תור בתאריך ${existingUserAppointment.Date} בשעה ${existingUserAppointment.Hour} אם ברצונך לשנות את התור אנא צור קשר`,
      });
    }

    // Check if the specific appointment exists for update
    const existingAppointment = await ScheduleSchema.findOne({ Date, Hour });
    if (!existingAppointment) {
      return res.status(404).json({ error: "Appointment not found for the specified date and hour" });
    }

    // Update the existing appointment
    existingAppointment.FullName = FullName;
    existingAppointment.Tel = Tel;
    existingAppointment.Comments = Comments || existingAppointment.Comments;

    await existingAppointment.save();

    res.status(200).json(existingAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Error updating appointment" });
  }
});

// -------------מחיקת תור------------------
router.post("/delete", async (req, res) => {
  try {
    const { selectedOptions } = req.body;
    if (!selectedOptions || selectedOptions.length === 0) {
      return res.status(400).json({ error: "No appointments selected for deletion" });
    }
    
    const deletePromises = selectedOptions.map(({ date, hour }) =>
      ScheduleSchema.findOneAndDelete({ Date: date, Hour: hour })
    );
    
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter((res) => res).length;

    if (deletedCount === 0) {
      return res.status(404).json({ error: "No matching appointments found to delete" });
    }
    
    res.status(200).json({ message: `Successfully deleted ${deletedCount} appointments` });
  } catch (error) {
    console.error("Error deleting appointments:", error);
    res.status(500).json({ error: "Error deleting appointments" });
  }
});



// מחיקת תורים ישנים אוטומטית
router.delete("/cleanup", async (req, res) => {
  try {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];
    const currentTimeString = currentDate.toTimeString().split(" ")[0];

    // מחיקת תורים שהתאריך שלהם עבר או שהתאריך הוא היום והשעה שלהם כבר עברו
    const result = await ScheduleSchema.deleteMany({
      $or: [
        { Date: { $lt: currentDateString } },  // תור עם תאריך עבר
        {
          Date: { $eq: currentDateString },    // תור עם תאריך היום
          Hour: { $lt: currentTimeString },    // שעה שעברה
        },
      ],
    });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: `Successfully cleaned up ${result.deletedCount} old appointments.` });
    } else {
      res.status(404).json({ message: "No old appointments found to clean up." });
    }
  } catch (err) {
    console.error("Error cleaning up appointments:", err);
    res.status(500).json({ error: "Error cleaning up appointments" });
  }
});


  
  module.exports = router;
