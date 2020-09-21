const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors')

const port = process.env.PORT || "4000";


const { login } = require("./breach-firebase/BeachFIrebaseConnection");
const { getShiftsByDate, addShift, deleteShifts, getUser, getShifts } = require("./breach-firebase/BeachFirestoreConnection");
const { createUserToken, decodeToken } = require("./breach-firebase/token");
const dayjs = require("dayjs");

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
            let shifts = await addShift(req.body.date, req.beachUserToken.email, user.name)
            if(shifts)
                res.status(200).send(JSON.stringify({ ok: true }))
        }
    }
})

app.post('/deleteShift', async function (req, res) {
    if(req.beachUserToken) {
        let user = await getUser(req.beachUserToken.email)
        if(user) {
            let shifts = await deleteShifts(req.body.date, req.beachUserToken.email, user.name)
            if(shifts)
                res.status(200).send(JSON.stringify({ ok: true }))
        }
    }
})

// Start the server on port 3000
app.listen(port, () => {
    console.log('Express server listening on port', port)

});
