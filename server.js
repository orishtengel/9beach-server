const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors')
const websocket = require('ws');
const http = require('http');


const port = process.env.PORT || "4000";

const { login } = require("./breach-firebase/BeachFIrebaseConnection");
const { addShift, deleteShifts, getUser, getShifts, addTips, getTips } = require("./breach-firebase/BeachFirestoreConnection");
const { createUserToken, decodeToken } = require("./breach-firebase/token");
const dayjs = require("dayjs");
const { addConnection, broadcast } = require("./socket/BeachSocketConnection");

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors())

app.use(function (req, res, next) {
    if(req.cookies["9beachtoken"]) {
        req.beachUserToken = decodeToken(req.cookies["9beachtoken"])
    }
    if(req.headers["token"]) {
        req.beachUserToken = decodeToken(req.headers["token"])
    }
    next()

})


app.post('/login', function (req, res) {
    console.log(req.body)
    login(req.body.email, req.body.password, async (user, error) => {
        if(user) {
            let token = createUserToken(user);
            let userData = await getUser(req.body.email)
            res.cookie('9beachtoken', token)
            res.status(200).send({
                user: userData,
                token: token
            })
        }
        else 
            res.status(401).send(JSON.stringify(error));
    })
})

app.get('/getUser', async function (req, res) {
    if(req.beachUserToken) {
        let user = await getUser(req.beachUserToken.email)
        if(user) {
            user.email = req.beachUserToken.email
            res.status(200).send(user)
        }
        else {
            res.status(400)
        }
    }
})

app.post('/getShifts', async function (req, res) {
    if(req.beachUserToken) {
        let shifts = []
        shifts = await getShifts(req.body.dates)
        let events = []
        Object.keys(shifts).map(dateId => {
            Object.keys(shifts[dateId]).map(keyHour => {
                shifts[dateId][keyHour].map(user => {
                    events.push({
                        title: user.name,
                        date: dayjs(dateId + " " + keyHour, 'YYYY-MM-DD H:mm')
                    })
                })
            })
        })
        res.status(200).send(JSON.stringify(events))
    }
})

app.post('/addShift', async function (req, res) {
    if(req.beachUserToken) {
        let user = await getUser(req.beachUserToken.email)
        if(user) {
            let shift = await addShift(req.body.date, req.beachUserToken.email, user.name)
            if(shift) {
                res.status(200).send(JSON.stringify({ ok: true, shift: shift }))
                broadcast('ADD_EVENT', shift)
            }
        }
    }
})

app.post('/deleteShift', async function (req, res) {
    if(req.beachUserToken) {
        let user = await getUser(req.beachUserToken.email)
        if(user) {
            let shifts = await deleteShifts(req.body.date, req.beachUserToken.email, user.name)
            if(shifts) {
                res.status(200).send(JSON.stringify({ ok: true }))
                broadcast('DELETE_EVENT', shifts)
                console.log("xxx", shifts)

            }
              
        }
    }
})

// Start the server on port 3000
// app.listen(port, () => {
//     console.log('Express server listening on port', port)

// });

const httpServer = http.createServer(app);
const wss = new websocket.Server({ server: httpServer });

wss.on('connection', ( wsConnection ) => {
    addConnection(wsConnection)
})

httpServer.listen(port, function() {
    console.log(`http/ws server listening on ${port}`);
});

app.get('/getTip', async function (req, res) {
    if(req.beachUserToken) {
        let tip = await getTips(req.beachUserToken.email)
        console.log(tip)
        res.status(200).send(tip)
    }
    else {
        res.status(400)
    }
})

app.post('/addTip', async function (req, res) {
    if(req.beachUserToken) {
        let tip = await addTips(req.body.date, req.beachUserToken.email, req.body.deposit , req.body.tips)
        if(tip) { 
            res.status(200).send(JSON.stringify({ ok: true, tip: tip }))
            
        }
        else {
            res.status(400)
        }
    }
})