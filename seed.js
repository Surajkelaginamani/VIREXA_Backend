// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');

const timetableData = [
  // ---------------- MONDAY ----------------
  { dayOfWeek: 'Monday', subject: 'MCS', type: 'Lecture', startTime: '09:45', endTime: '10:30', room: '222', batch: 'ALL', faculty: 'Prof.A.S.Aher' },
  { dayOfWeek: 'Monday', subject: 'DS', type: 'Lecture', startTime: '10:30', endTime: '11:30', room: '222', batch: 'ALL', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Monday', subject: 'ES', type: 'Lecture', startTime: '11:30', endTime: '12:30', room: '222', batch: 'ALL', faculty: 'Prof.A.B Mokal' },
  
  // Monday Afternoon - Batch AS1
  { dayOfWeek: 'Monday', subject: 'FIOTL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'ADT/NW Lab', batch: 'AS1', faculty: 'Prof.P.M.' },
  { dayOfWeek: 'Monday', subject: 'JAVAL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'PG LAB', batch: 'AS1', faculty: 'Dr.H.E. Khodake' },
  
  // Monday Afternoon - Batch AS2
  { dayOfWeek: 'Monday', subject: 'DSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-II', batch: 'AS2', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Monday', subject: 'DBMSL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'UNIX Lab', batch: 'AS2', faculty: 'Prof.M.Agrawal' },

  // Monday Afternoon - Batch AS3
  { dayOfWeek: 'Monday', subject: 'JAVAL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'PG LAB', batch: 'AS3', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Monday', subject: 'FIOTL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'NWL', batch: 'AS3', faculty: 'Prof.P.M.' },
  
  // Monday Evening
  { dayOfWeek: 'Monday', subject: 'Student-Teacher Interaction', type: 'Interaction', startTime: '17:10', endTime: '19:00', room: 'TBA', batch: 'ALL', faculty: 'Staff' },

  // ---------------- TUESDAY ----------------
  { dayOfWeek: 'Tuesday', subject: 'ES', type: 'Lecture', startTime: '09:45', endTime: '10:30', room: '208', batch: 'ALL', faculty: 'Prof.A.B Mokal' },
  
  // Tuesday Morning Labs
  { dayOfWeek: 'Tuesday', subject: 'DSL', type: 'Practical', startTime: '10:30', endTime: '12:30', room: 'SL-II', batch: 'AS1', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Tuesday', subject: 'FIOTL', type: 'Practical', startTime: '10:30', endTime: '12:30', room: 'ADTL', batch: 'AS2', faculty: 'Prof.P.M.' },
  { dayOfWeek: 'Tuesday', subject: 'JAVAL', type: 'Practical', startTime: '10:30', endTime: '12:30', room: 'PG LAB', batch: 'AS3', faculty: 'Dr.H.E. Khodake' },

  { dayOfWeek: 'Tuesday', subject: 'DBMS', type: 'Lecture', startTime: '13:10', endTime: '14:05', room: '222', batch: 'ALL', faculty: 'Prof.M.Agrawal' },
  { dayOfWeek: 'Tuesday', subject: 'MCS', type: 'Lecture', startTime: '14:05', endTime: '15:00', room: '222', batch: 'ALL', faculty: 'Prof.A.S.Aher' },

  // Tuesday Afternoon Labs
  { dayOfWeek: 'Tuesday', subject: 'JAVAL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'PG LAB', batch: 'AS1', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Tuesday', subject: 'DSL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'SL-II', batch: 'AS2', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Tuesday', subject: 'FIOTL', type: 'Practical', startTime: '15:10', endTime: '17:00', room: 'NWL', batch: 'AS3', faculty: 'Prof.P.M.' },
  
  // Tuesday Evening
  { dayOfWeek: 'Tuesday', subject: 'Honors-AIML', type: 'Lecture', startTime: '17:10', endTime: '19:00', room: '222', batch: 'ALL', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Tuesday', subject: 'Honors-DS', type: 'Lecture', startTime: '17:10', endTime: '19:00', room: '208', batch: 'ALL', faculty: 'Prof. TB' },

  // ---------------- WEDNESDAY ----------------
  { dayOfWeek: 'Wednesday', subject: 'DBMS', type: 'Lecture', startTime: '09:45', endTime: '10:30', room: '222', batch: 'ALL', faculty: 'Prof.M.Agrawal' },
  
  // Wednesday Morning Tutorials
  { dayOfWeek: 'Wednesday', subject: 'MCS-T', type: 'Tutorial', startTime: '10:30', endTime: '11:30', room: '222', batch: 'AS1', faculty: 'Prof.A.S.Aher' },
  { dayOfWeek: 'Wednesday', subject: 'MCS-T', type: 'Tutorial', startTime: '10:30', endTime: '11:30', room: '222', batch: 'AS2', faculty: 'Prof.A.S.Aher' },
  { dayOfWeek: 'Wednesday', subject: 'MCS-T', type: 'Tutorial', startTime: '10:30', endTime: '11:30', room: 'VIRTUSA LAB', batch: 'AS3', faculty: 'Prof. NSA' },

  { dayOfWeek: 'Wednesday', subject: 'DS', type: 'Lecture', startTime: '11:30', endTime: '12:30', room: '222', batch: 'ALL', faculty: 'Prof.V.N.Nirgude' },

  // Wednesday Afternoon Labs
  { dayOfWeek: 'Wednesday', subject: 'DBMSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'UNIX', batch: 'AS1', faculty: 'Prof.M.Agrawal' },
  { dayOfWeek: 'Wednesday', subject: 'JAVAL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-1', batch: 'AS2', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Wednesday', subject: 'DSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-II', batch: 'AS3', faculty: 'Prof.V.N.Nirgude' },
  
  // Wednesday Afternoon (Honors)
  { dayOfWeek: 'Wednesday', subject: 'Honors-AIML', type: 'Lecture', startTime: '15:10', endTime: '17:00', room: '222', batch: 'ALL', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Wednesday', subject: 'Honors-DS', type: 'Lecture', startTime: '15:10', endTime: '17:00', room: '208', batch: 'ALL', faculty: 'Prof. TB' },

  // ---------------- THURSDAY ----------------
  { dayOfWeek: 'Thursday', subject: 'DS', type: 'Lecture', startTime: '09:45', endTime: '10:30', room: '222', batch: 'ALL', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Thursday', subject: 'ES', type: 'Lecture', startTime: '10:30', endTime: '11:30', room: '222', batch: 'ALL', faculty: 'Prof.A.B Mokal' },
  { dayOfWeek: 'Thursday', subject: 'SS', type: 'Lecture', startTime: '11:30', endTime: '12:30', room: '222', batch: 'ALL', faculty: 'Prof V. Tambe' },

  // Thursday Afternoon Labs
  { dayOfWeek: 'Thursday', subject: 'FIOTL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'ADTL', batch: 'AS1', faculty: 'Prof.P.M.' },
  { dayOfWeek: 'Thursday', subject: 'JAVAL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-1', batch: 'AS2', faculty: 'Dr.H.E. Khodake' },
  { dayOfWeek: 'Thursday', subject: 'DSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-II', batch: 'AS3', faculty: 'Prof.V.N.Nirgude' },

  // Thursday Late Afternoon / Evening
  { dayOfWeek: 'Thursday', subject: 'DBMS', type: 'Lecture', startTime: '15:10', endTime: '16:15', room: '222', batch: 'ALL', faculty: 'Prof.M.Agrawal' },
  { dayOfWeek: 'Thursday', subject: 'OE-1', type: 'Lecture', startTime: '16:15', endTime: '17:10', room: '222', batch: 'ALL', faculty: 'Dr.A.S Bodhe' },
  { dayOfWeek: 'Thursday', subject: 'Student-Teacher Interaction', type: 'Interaction', startTime: '17:10', endTime: '19:00', room: 'TBA', batch: 'ALL', faculty: 'Staff' },

  // ---------------- FRIDAY ----------------
  { dayOfWeek: 'Friday', subject: 'SS', type: 'Lecture', startTime: '09:45', endTime: '10:30', room: '222', batch: 'ALL', faculty: 'Prof V. Tambe' },
  { dayOfWeek: 'Friday', subject: 'DS', type: 'Lecture', startTime: '10:30', endTime: '11:30', room: '222', batch: 'ALL', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Friday', subject: 'MCS', type: 'Lecture', startTime: '11:30', endTime: '12:30', room: '222', batch: 'ALL', faculty: 'Prof.A.S.Aher' },

  // Friday Afternoon Labs
  { dayOfWeek: 'Friday', subject: 'DSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'SL-II', batch: 'AS1', faculty: 'Prof.V.N.Nirgude' },
  { dayOfWeek: 'Friday', subject: 'FIOTL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'ADTL', batch: 'AS2', faculty: 'Prof.P.M.' },
  { dayOfWeek: 'Friday', subject: 'DBMSL', type: 'Practical', startTime: '13:10', endTime: '15:00', room: 'UNIX', batch: 'AS3', faculty: 'Prof.M.Agrawal' },

  // Friday Late Afternoon / Evening
  { dayOfWeek: 'Friday', subject: 'DBMS', type: 'Lecture', startTime: '15:10', endTime: '16:15', room: '222', batch: 'ALL', faculty: 'Prof.M.Agrawal' },
  { dayOfWeek: 'Friday', subject: 'SS', type: 'Lecture', startTime: '16:15', endTime: '17:10', room: '222', batch: 'ALL', faculty: 'Prof V. Tambe' },
  { dayOfWeek: 'Friday', subject: 'OE-1', type: 'Lecture', startTime: '17:10', endTime: '19:00', room: '222', batch: 'ALL', faculty: 'Dr.A.S Bodhe' },

  // ---------------- SATURDAY ----------------
  { dayOfWeek: 'Saturday', subject: 'MCS-T', type: 'Tutorial', startTime: '10:30', endTime: '12:30', room: 'PG LAB', batch: 'AS2', faculty: 'Prof.A.S.Aher' },
  { dayOfWeek: 'Saturday', subject: 'Mentor Meeting', type: 'Interaction', startTime: '13:10', endTime: '15:00', room: 'TBA', batch: 'ALL', faculty: 'Mentor' },
  { dayOfWeek: 'Saturday', subject: 'Mentor Meeting', type: 'Interaction', startTime: '15:10', endTime: '17:00', room: 'TBA', batch: 'ALL', faculty: 'Mentor' }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB...");
    
    // 1. Clear out any old schedule data so we don't get duplicates
    await Schedule.deleteMany({});
    console.log("Old schedule deleted.");

    // 2. Insert the new timetable array
    await Schedule.insertMany(timetableData);
    console.log("New timetable successfully added!");

    // 3. Disconnect when finished
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Database connection error:", err);
  });