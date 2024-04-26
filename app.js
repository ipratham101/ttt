require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');

const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const chokidar = require('chokidar');
const fsm = require('fs/promises');
const BASE_URL = process.env.BASE_URL;
const port = process.env.PORT;
const http = require('http');
const socketIo = require('socket.io');
app.use(express.json());

const cors = require('cors'); // Add this line


// Enable CORS middleware
app.use(cors({
  origin: 'https://ttt-1-s5l2.onrender.com',
  allowedHeaders: ['Content-Type']
}));

app.get('/home', (req, res)=>{
    res.sendFile(__dirname + '/homePage.html');
})

app.use(express.static(__dirname+'/public'));

const jsonFilePath = 'locationData.json';

const readJsonFile = async () => {
    try {
        const data = await fsm.readFile(jsonFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return null;
    }
};

const watcher = chokidar.watch(jsonFilePath);
watcher.on('change', async () => {
    console.log('JSON file changed. Reloading data...');
    const jsonData = await readJsonFile();
    io.emit('data-update', jsonData); // Emit the updated data to connected clients
});

let temp = 0;
app.get('/api/realtime-data', async (req, res) => {
    const jsonData = await readJsonFile();
    res.json(jsonData);
    // res.json(temp);
    // console.log("hey", temp);
});
let receivedRandomNumber = 0;
app.use(bodyParser.json());
app.post('/api/random', (req, res) => {
    receivedRandomNumber = req.body.randomNumber;
    // console.log('Received random number from frontend:', receivedRandomNumber);
    res.json({ message: 'Random number received successfully' });
});






app.get('/home/teacher', (req, res) => {
    function generateRandomNumber() {
        const min = 100;
        const max = 999;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
temp = generateRandomNumber();
    res.sendFile(__dirname + '/mam.html');
    // console.log(generateRandomNumber());
});



app.get('/camera', (req, res) => {
    const pythonProcess = spawn('python', ['app.py']);
  
    pythonProcess.stdout.on('data', (data) => {
      try {
        const jsonData = JSON.parse(data.toString());
        console.log('Detected Face Names:', jsonData.face_name);
        res.json(jsonData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });
  
    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  
    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  });
  




const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected');
});

app.get('/api/coordinates', (req, res) => {
    res.sendFile(__dirname + '/index.html');    
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/adminPage.html')
});

app.get('/home/student', (req, res) => {
    res.sendFile(__dirname + '/i.html');
  
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static('public'));


// API endpoint to receive data from the student page
app.post('/home/teacher', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://ttt-1-s5l2.onrender.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    const data = req.body;

    // Broadcast the received data to all connected clients (teacher page)
   
    console.log("hi", data);
    // if(dist <= 6000){
    io.emit('dataUpdate', data);

    res.sendStatus(200);
});


app.post('/home/student', (req, res) => {
    const enteredCode = req.body.code;



    console.log("entered code is: ",enteredCode);
    console.log("i got: ", receivedRandomNumber);
    if(enteredCode == receivedRandomNumber)  res.redirect(`/api/coordinates`);
    // else {res.send('code not matched');}
        else {res.send('code not matched');}
});




let locationData = [];



app.post('/api/sendLocation', (req, res) => {
    // console.log("andar");
    const receivedLocation = req.body;

    const enrollmentNumber = receivedLocation.enrollment;
    // console.log("enrollment numberrr: ", enrollmentNumber);
    
    if (isValidEnrollmentNumber(enrollmentNumber)) {
        const existingEntryIndex = locationData.findIndex(entry => entry.enrollment === enrollmentNumber);

        if (existingEntryIndex === -1) {
            locationData.push(receivedLocation);
            saveDataToFile();
            notifyAdmin(enrollmentNumber);

            res.status(200).json({ attendanceMarked: true, message: 'Location data saved successfully' });
        } else {
            res.status(400).json({ attendanceMarked: false, message: 'Location data already exists for this enrollment number' });
        }
    } else {
        res.status(400).json({ attendanceMarked: false, message: 'Invalid enrollment number' });
    }
});



function isValidEnrollmentNumber(enrollmentNumber) {
    return /^\d{10}$/.test(enrollmentNumber);
}



function saveDataToFile() {
    fs.writeFileSync('locationData.json', JSON.stringify(locationData, null, 2), 'utf-8');
}

function notifyAdmin(enrollmentNumber) {
    console.log(`Attendance marked for enrollment number: ${enrollmentNumber}`);
}



