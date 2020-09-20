const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { login } = require("./breach-firebase/BeachFIrebaseConnection");
const { getShiftsByDate, addShift, deleteShifts, getUser } = require("./breach-firebase/BeachFirestoreConnection");
const { createUserToken, decodeToken } = require("./breach-firebase/token");

const app = express();
app.use(cookieParser());
app.use(bodyParser.json())

app.use(function (req, res, next) {
    if(req.cookies["9beachtoken"]) {
        req.beachUserToken = decodeToken(req.cookies["9beachtoken"])
    }
    next()
})


app.post('/login', function (req, res) {
    login(req.body.email, req.body.password, async (user, error) => {
        if(user) {
            let token = createUserToken(user);
            res.cookie('9beachtoken', token)
            res.status(200).send(getUser(req.body.email))
        }
        else 
            res.send(JSON.stringify(error));
    })
})

app.get('/getShifts', async function (req, res) {
    if(req.beachUserToken) {
        let shifts = await getShiftsByDate(new Date())
        res.status(200).send(JSON.stringify(shifts))
    }
})

app.get('/addShift', async function (req, res) {
    if(req.beachUserToken) {
        let shifts = await addShift(new Date(), '8am', req.beachUserToken.email)
        if(shifts)
            res.status(200).send(JSON.stringify({ ok: true }))
    }
})

app.get('/deleteShift', async function (req, res) {
    if(req.beachUserToken) {
        let shifts = await deleteShifts(new Date(), '8am', req.beachUserToken.email)
        if(shifts)
            res.status(200).send(JSON.stringify({ ok: true }))
    }
})

// Start the server on port 3000
app.listen(4000, '127.0.0.1');
console.log('Node server running on port 4000');