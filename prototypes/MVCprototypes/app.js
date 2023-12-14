///////////// Import required Node.js modules and libraries
// Express web application framework
const express = require('express');
// MongoDB ODM library for Node.js
const mongoose = require('mongoose');
// Middleware for session management in Express
const session = require("express-session");
// Authentication middleware for Node.js
const passport = require("passport");
// Middleware for parsing request bodies
const bodyParser = require('body-parser');
// Passport strategy for local authentication
const passportLocalMongoose = require("passport-local-mongoose");
// Load environment variables from a .env file
require("dotenv").config();


//////////// Create an instance of the Express application
const app = express();
// Set the port number
const port = 3000;

/////////// Set up middleware for serving static files and parsing request bodies
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


////////// Configure session management middleware
app.use(session({
  // Secret key for session encryption
  secret: process.env.SECRET,
  // Do not save the session if it hasn't been modified
  resave: false,
  // Do not save new, uninitialized sessions
  saveUninitialized: false
}));


////////// Initialize Passport and use it for session management
app.use(passport.initialize());
app.use(passport.session());

//////////// Set the view engine to EJS (Embedded JavaScript)
app.set("view engine", "ejs");

///////// Connect to the MongoDB database named 'workforce_scheduler'
mongoose.connect('mongodb://localhost/workforce_scheduler',
//// Define a Mongoose schema for the user with fields such as name, username, password, authentication, and isManager
  { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  authentication: Number,
  // Default value for isManager is false
  isManager: {type: Boolean, default: false}
});

// Add Passport-local Mongoose plugin to simplify user authentication
userSchema.plugin(passportLocalMongoose);
// Create a Mongoose model for the User schema
const User = mongoose.model("User", userSchema);

//////// Define a Mongoose schema for timeslots with day, isBooked, and bookedBy fields
const timeslotSchema = new mongoose.Schema({
  day: String ,
  isBooked: Boolean,
  bookedBy: String
});

////// Define a Mongoose schema for a matrix of timeslots
const matrixSchema = new mongoose.Schema({
  // Nested array of timeslotSchema instances
  matrix: [[timeslotSchema]]
});

// Define Mongoose models for the 'Timeslots' and 'Matrix' collections
const Timeslots = mongoose.model( "Timeslots", matrixSchema );
const Matrix = mongoose.model('Matrix', matrixSchema);

// test manager id: manager@mail.com
// test manager password: 1234
// test employee id: park@gmail.com
// test employee password: 1234

// Passport configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

///////////////////////////////// Routes ///////////////////////////

// Home route - renders the home page
app.get("/", (req, res) => {
  res.render("home", {user: req.user});
});

// Home route with authentication check
app.get("/home", (req, res) => {
  if (req.isAuthenticated()){
  res.render("home", {user: req.user});
  } else {
    res.redirect("/");
  }
});

// About route - renders the about page with user information
app.get("/about", (req, res) => {
  const user = req.isAuthenticated() ? req.user : null;
  res.render("about", { user });
});

// Contact route - renders the contact page with user information
app.get("/contact", (req, res) => {
  const user = req.isAuthenticated() ? req.user : null;
  res.render("contact", { user });
});

// Login route - handles user login
app.post('/login', async(req, res) => {
  
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, async (err) => {
    if (err) {
      console.log(err);
      console.log("Login failed");
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, async () => {
        try {
          const loggedInUser = await User.findOne({username: req.user.username});

           // Redirect based on user role
          if (loggedInUser && loggedInUser.isManager) {
            res.redirect('/manager')
          } else {
            res.redirect("/schedule");
          }
        } catch(err) {
          console.log(err);
          res.redirect("/");
        }
      });
      console.log("Login successful");
    }
  })
});

//// Register route - handles user registration
app.post('/register', (req, res) => {
  const { authentication } = req.body;
 // Check authentication code
  if (authentication === '5432') {
    const isManager = req.body.isManager === 'on';

     // Register user with Passport-local Mongoose
    User.register({ username: req.body.username, isManager },
      req.body.password, (err, user) => {
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect(isManager ? '/manager' : '/schedule');
          });
        }
      });
  } else {
    console.log("Wrong Authentication");
    res.redirect('/register');
  }
});

// Schedule route - renders the schedule page with Matrix data
app.get('/schedule', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
            // Fetch all data from the Matrix collection
            const allMatrixData = await Matrix.find();
      res.render('schedule',{ username: req.user.username,  matrixData: allMatrixData  });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/");
  }
});



// adding new data in MongoDB
/////////////////////////// MONDAY
app.post('/MondayMorning', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "MondayMorning" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "MondayMorning",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});



app.post('/MondayAfternoon', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "MondayAfternoon" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "MondayAfternoon",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});


app.post('/MondayEvening', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "MondayEvening" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "MondayEvening",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});






// adding new data in MongoDB
//////////////// Tuesday
app.post('/TuesdayMorning', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "TuesdayMorning" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "TuesdayMorning",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});



app.post('/TuesdayAfternoon', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "TuesdayAfternoon" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "TuesdayAfternoon",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});


app.post('/TuesdayEvening', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "TuesdayEvening" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "TuesdayEvening",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});






// adding new data in MongoDB
//////////////// Wednesday
app.post('/WednesdayMorning', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "WednesdayMorning" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "WednesdayMorning",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});



app.post('/WednesdayAfternoon', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "WednesdayAfternoon" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "WednesdayAfternoon",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});


app.post('/WednesdayEvening', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "WednesdayEvening" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "WednesdayEvening",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});







// adding new data in MongoDB
//////////////// Thursday
app.post('/ThursdayMorning', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "ThursdayMorning" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "ThursdayMorning",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});



app.post('/ThursdayAfternoon', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "ThursdayAfternoon" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "ThursdayAfternoon",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});


app.post('/ThursdayEvening', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "ThursdayEvening" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "ThursdayEvening",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});





// adding new data in MongoDB
//////////////// Friday
app.post('/FridayMorning', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "FridayMorning" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "FridayMorning",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});



app.post('/FrisdayAfternoon', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "FrisdayAfternoon" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "FrisdayAfternoon",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});


app.post('/FridayEvening', async (req, res) => {
  try {
    // Find the existing matrix (assuming you have some way to identify it, like an ID)
    const existingMatrix = await Matrix.findOne({ "matrix.day": "FridayEvening" });

    // If the matrix is found, it means the timeslot is already booked
    if (existingMatrix) {
      console.log("The timeslot is booked already");
      return res.redirect('/schedule');
    }

    // Create a newMatrix instance and add the new timeslot
    const newMatrix = new Matrix({
      matrix: [
        [
          {
            day: "FridayEvening",
            isBooked: true,
            bookedBy: req.user.username
          }
        ]
      ]
    });

    // Save the newMatrix with the added timeslot
    await newMatrix.save();

    console.log("New timeslot saved:", newMatrix);
    res.redirect('/schedule');
  } catch (err) {
    console.error(err);
    res.redirect('/schedule');
  }
});




// POST route to empty a timeslot for a specific day
app.post('/emptyTimeslot/:day', async (req, res) => {
  try {
    // Extract the day parameter from the request
    const dayToEmpty = req.params.day;

    // Log the day to be emptied
    console.log('Day to empty:', dayToEmpty);

    // Find the matrix document that contains the timeslot for the specified day
    const matrixBeforeUpdate = await Matrix.findOne({ "matrix.0.day": dayToEmpty });
    // Log the matrix before the update
    console.log('Matrix before update:', matrixBeforeUpdate);
    // Check if the matrix for the specified day exists
      if (!matrixBeforeUpdate) {
        console.log("Matrix not found for the specified day");
        return res.redirect('/manager');
      }
  
        // Find the index of the timeslot within the matrix
    const timeslotIndex = matrixBeforeUpdate.matrix.findIndex(
      timeslot => timeslot[0].day === dayToEmpty
    );
      // Check if the timeslot for the specified day exists
    if (timeslotIndex === -1) {
      console.log("Timeslot not found for the specified day");
      return res.redirect('/manager');
    }

    // Update the isBooked property to false
      // Update the existing matrix directly using positional operator $
    await Matrix.updateOne(
      { "matrix.0.day": dayToEmpty },
      {
        $set: {
          "matrix.$.0.isBooked": false,
          "matrix.$.0.bookedBy": null,
        },
      }
    );


    // Find the matrix document after the update
    const matrixAfterUpdate = await Matrix.findOne({ "matrix.0.day": dayToEmpty });
    // Log the matrix after the update
    console.log('Matrix after update:', matrixAfterUpdate);
      // Log a message indicating the successful emptying of the timeslot
    console.log(`Empty the timeslot for ${dayToEmpty}`);
    // Redirect back to the manager page
    res.redirect('/manager');
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.redirect('/manager');
  }
});


// POST route to assign an employee to a timeslot for a specific day
app.post('/assignEmployee/:day', async (req, res) => {
  try {
    // Extract the day parameter from the request
    const dayToAssign = req.params.day;
    const selectedEmployee = req.body.employeeSelect;
    // Extract the selected employee from the request body
     // Check if a valid employee is selected
    if (!selectedEmployee) {
      console.log('Invalid selected employee');
      return res.redirect('/manager');
    }
     // Log the day to be assigned
    console.log('Day to assign:', dayToAssign);
    // Find the matrix document that contains the timeslot for the specified day
    const matrixBeforeUpdate = await Matrix.findOne({ "matrix.0.day": dayToAssign });
    // Log the matrix before the update
    console.log('Matrix before update:', matrixBeforeUpdate);


    // Update the existing matrix directly using positional operator $
    await Matrix.updateOne(
      { "matrix.0.day": dayToAssign },
      {
        $set: {
          "matrix.$.0.isBooked": true,
          "matrix.$.0.bookedBy": selectedEmployee,
        },
      }
    );

    // Find the matrix document after the update
    const matrixAfterUpdate = await Matrix.findOne({ "matrix.0.day": dayToAssign });
    // Log the matrix after the update
    console.log('Matrix after update:', matrixAfterUpdate);
    // Log a message indicating the successful assignment of the timeslot
    console.log(`Assign ${selectedEmployee} the timeslot for ${dayToAssign}`);
    // Redirect back to the manager page
    res.redirect('/manager');
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.redirect('/manager');
  }
});




// GET route to generate a schedule for the current user
app.get('/generateSchedule', async(req, res) => {
  try {
    // Find availabilities for the current user
    const availabilities = await Availability.find({
      employeeName: req.user.username
    });
    // Map availabilities to a formatted schedule string
    const generatedSchedule = availabilities.map(
      (availability) => '${availability.date]: ${availibility.startTime} - ${availability.endTime}'
    );
    // Render the 'generateSchedule' view with the generated schedule
    res.render('generateSchedule', {schedule: generatedSchedule}); 
  } catch (err) {
     // Log and handle errors
    console.log(err);
    res.redirect('/');
  }
});

// GET route for the manager page
app.get('/manager', async(req, res) => {
   // Check if the user is authenticated and is a manager
  if (req.isAuthenticated() && req.user.isManager) {
    try {
      // Fetch all data from the Matrix collection
      const allMatrixData = await Matrix.find();
      const allEmployeeData = await User.find();
  
      // Render manager.ejs and pass the data as a variable
      res.render('manager', { matrixData: allMatrixData, employeeData: allEmployeeData });
    } catch (err) {
       // Log and handle errors
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // Log a message indicating no permission and redirect to the home page
    console.log("No permission")
    res.redirect('/');
  }
})

// GET route for user logout
app.get("/logout", (req, res, next) => {
  // Log the user out and redirect to the home page
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
