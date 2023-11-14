const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (Make sure MongoDB is running)
mongoose.connect('mongodb://localhost/workforce_scheduler', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a Mongoose schema and model
const availabilitySchema = new mongoose.Schema({
  employeeName: String,
  day: String,
  startTime: String,
  endTime: String,
});

const Availability = mongoose.model('Availability', availabilitySchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('schedule', { schedule: [] }); // Pass an empty array to schedule initially
  });

app.post('/submitAvailability', async (req, res) => {
  const { employeeName, day, startTime, endTime } = req.body;
  const availability = new Availability({ employeeName, day, startTime, endTime });
  await availability.save();
  res.redirect('/');
});

app.get('/generateSchedule', async (req, res) => {
    // Implement schedule generation logic based on stored availabilities
    // Retrieve data from the database and generate the schedule
    const availabilities = await Availability.find();
    // Your scheduling logic here
  
    // Example: Pass the generated schedule to the view
    const generatedSchedule = ['Monday: 3 pm - 7 pm', 'Tuesday: 12 pm - 5 pm', 'Wednesday: 10 am - 5 pm', 'Thursday: 11 am - 4 pm'];
    res.render('schedule', { schedule: generatedSchedule });
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
