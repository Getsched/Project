const express = require('express');
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const bodyParser = require('body-parser');
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

//connect to database and create schemas
mongoose.connect('mongodb://localhost/workforce_scheduler',
  { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  authentication: Number,
  isManager: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);


const timeslotSchema = new mongoose.Schema({
  day: String ,
  isBooked: Boolean,
  bookedBy: String
});

const matrixSchema = new mongoose.Schema({
  matrix: [[timeslotSchema]]
});


const Timeslots = mongoose.model( "Timeslots", matrixSchema );
const Matrix = mongoose.model('Matrix', matrixSchema);
/*
const newMatrix = new Matrix({
    matrix: [
        [{ day: 'MondayMorning', isBooked: false, bookedBy: '' }], 
        [{ day: 'MondayAfternoon', isBooked: false, bookedBy: ''}],
        [{ day: 'MondayEvening', isBooked: true, bookedBy: 'user1'}]
});
newMatrix.save();
*/

// test manager id: manager@mail.com
// test manager password: 1234
// test employee id: park@gmail.com
// test employee password: 1234
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes

app.get("/", (req, res) => {
  res.render("home", {user: req.user});
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()){
  res.render("home", {user: req.user});
  } else {
    res.redirect("/");
  }
});

app.get("/about", (req, res) => {
  const user = req.isAuthenticated() ? req.user : null;
  res.render("about", { user });
});

app.get("/contact", (req, res) => {
  const user = req.isAuthenticated() ? req.user : null;
  res.render("contact", { user });
});

//login route
//authenticates user using passport
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

//register route
//user password is salted and hashed by passport
//managers and employees are given access to different pages
app.post('/register', (req, res) => {
  const { authentication } = req.body;

  if (authentication === '5432') {
    const isManager = req.body.isManager === 'on';
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

//schedule route
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



app.post('/emptyTimeslot/:day', async (req, res) => {
  try {
    const dayToEmpty = req.params.day;


    console.log('Day to empty:', dayToEmpty);
    const matrixBeforeUpdate = await Matrix.findOne({ "matrix.0.day": dayToEmpty });
    console.log('Matrix before update:', matrixBeforeUpdate);

      if (!matrixBeforeUpdate) {
        console.log("Matrix not found for the specified day");
        return res.redirect('/manager');
      }
  
        // Find the index of the timeslot within the matrix
    const timeslotIndex = matrixBeforeUpdate.matrix.findIndex(
      timeslot => timeslot[0].day === dayToEmpty
    );

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


    // Save the updated matrix
    const matrixAfterUpdate = await Matrix.findOne({ "matrix.0.day": dayToEmpty });
    console.log('Matrix after update:', matrixAfterUpdate);

    console.log(`Empty the timeslot for ${dayToEmpty}`);
    res.redirect('/manager');
  } catch (err) {
    console.error(err);
    res.redirect('/manager');
  }
});



app.post('/assignEmployee/:day', async (req, res) => {
  try {
    const dayToAssign = req.params.day;
    const selectedEmployee = req.body.employeeSelect;

    if (!selectedEmployee) {
      console.log('Invalid selected employee');
      return res.redirect('/manager');
    }

    console.log('Day to assign:', dayToAssign);
    const matrixBeforeUpdate = await Matrix.findOne({ "matrix.0.day": dayToAssign });
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

    const matrixAfterUpdate = await Matrix.findOne({ "matrix.0.day": dayToAssign });
    console.log('Matrix after update:', matrixAfterUpdate);

    console.log(`Assign ${selectedEmployee} the timeslot for ${dayToAssign}`);
    res.redirect('/manager');
  } catch (err) {
    console.error(err);
    res.redirect('/manager');
  }
});





app.get('/generateSchedule', async(req, res) => {
  try {
    const availabilities = await Availability.find({
      employeeName: req.user.username
    });

    const generatedSchedule = availabilities.map(
      (availability) => '${availability.date]: ${availibility.startTime} - ${availability.endTime}'
    );

    res.render('generateSchedule', {schedule: generatedSchedule}); 
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

app.get('/manager', async(req, res) => {
  if (req.isAuthenticated() && req.user.isManager) {
    try {
      // Fetch all data from the Matrix collection
      const allMatrixData = await Matrix.find();
      const allEmployeeData = await User.find();
  
      // Render manager.ejs and pass the data as a variable
      res.render('manager', { matrixData: allMatrixData, employeeData: allEmployeeData });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    console.log("No permission")
    res.redirect('/');
  }
})


app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
