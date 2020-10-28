const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors')
const websocket = require('ws');
const http = require('http');
const compression = require('compression')
const fs = require('fs')

const port = process.env.PORT || "4000";

const { login } = require("./breach-firebase/BeachFIrebaseConnection");
const { addShift, deleteShifts, getUser, getShifts, addTips, getTips, getShiftsByDate, getShiftsByDateAndId,getShiftsByDateAndIdWemail,getUsers, changeStandBy, addFacebookName, deleteUser, deleteFacebookName, setLocktrue,setLockfalse,getLock} = require("./breach-firebase/BeachFirestoreConnection");
const { createUserToken, decodeToken } = require("./breach-firebase/token");
const dayjs = require("dayjs");
const { addConnection, broadcast } = require("./socket/BeachSocketConnection");
const { facebookLogin } = require("./auth/login");
const { isafterweek, isthisweek, isbeforelastweek ,isbefore, getDaysAhead } = require("./utils/daycheck");
const { Dayjs } = require("dayjs");
const { Console } = require("console");

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors())
app.use(compression())
app.use(express.static('public'))

app.use(function (req, res, next) {
    if(req.cookies["9beachtoken"]) {
        req.beachUserToken = decodeToken(req.cookies["9beachtoken"])
    }
    if(req.headers["token"]) {
        req.beachUserToken = decodeToken(req.headers["token"])
    }
    next()

})

app.post('/facebookLogin', async function(req, res) {
    let user = await facebookLogin(req.body.email, req.body.name, req.body.picture)
    console.log(user)
    if(user) {
        let token = createUserToken(req.body.email, user.name, user.admin);
        res.cookie('9beachtoken', token)
        res.status(200).send({
            user: user,
            token: token
        })
    }
    else 
        res.status(401).send(JSON.stringify('Not Autorized'));
})

app.post('/login', function (req, res) {
    console.log(req.body)
    login(req.body.email, req.body.password, async (user, error) => {
        if(user) {
            let userData = await getUser(req.body.email)
            let token = createUserToken(req.body.email, userData.name, userData.admin);
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


app.get('/getUsers', async function (req, res) {
   if(req.beachUserToken){
        let arr = []
        arr = await getUsers()
        if(arr) {
            res.status(200).send(arr)
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
                shifts[dateId][keyHour].map(shift => {
                    events.push({
                        id: shift.id,
                        title: shift.name,
                        date: dayjs(dateId + " " + keyHour, 'YYYY-MM-DD H:mm'),
                        backgroundColor : shift.backgroundColor,
                        standby:shift.standby,
                        email: shift.email
                    })
                })
            })
        })
        res.status(200).send(JSON.stringify(events))
    }
})

app.post('/addShift', async function (req, res) {
    if(req.beachUserToken) {
        let lock = await getLock(req.body.date)
        if(lock.islock) {
            res.status(400).send({error: 'can\'t add shift in this date, date is lock'})
        } 
        else {
            if(req.body.date > isbefore() && req.body.date < isafterweek() && req.body.date > isthisweek()) {  
                    let user = await getUser(req.beachUserToken.email)
                    if(user) {
                        let isExistsAlready = await getShiftsByDate(req.beachUserToken.email, req.body.date)
                        if(!isExistsAlready) {
                            let shift = await addShift(req.body.date, req.beachUserToken.email, user.name, user.color,req.body.standby)
                            if(shift) {
                                res.status(200).send(JSON.stringify({ ok: true, shift: shift }))
                                broadcast('ADD_EVENT', shift)
                            }
                        }
                        else {
                            res.sendStatus(400)
                        }
                }
            }
            else {
                res.status(400).send({error: 'can\'t add shift in this date, only in the next week'})
            }
        }
    }
})

app.post('/addShiftAdmin', async function (req, res) {
    if(req.beachUserToken.admin) {
        if(req.body.date > isbeforelastweek()) {
            let user = await getUser(req.body.userId)
            if(user) {
                let isExistsAlready = await getShiftsByDate(req.body.userId, req.body.date)
                if(!isExistsAlready) {
                    let shift = await addShift(req.body.date, req.body.userId, user.name, user.color,req.body.standby)
                    if(shift) {
                        res.status(200).send(JSON.stringify({ ok: true, shift: shift }))
                        broadcast('ADD_EVENT', shift)
                    }
                }
                else {
                    res.sendStatus(400)
                }
            }
        }
        else {
            res.status(400).send({error: 'This shift is too old. can\'t be added'})
        }
    }
    else
        res.sendStatus(401)
})

app.post('/deleteShift', async function (req, res) {
    if(req.beachUserToken) {
        let user = await getUser(req.beachUserToken.email)
        let shift = await getShiftsByDateAndIdWemail(req.body.date,req.body.id)
        let lock = await getLock(req.body.date)
        if(req.beachUserToken.admin){
            // Check last week 
            
            if(req.body.date > isbeforelastweek()) {
                let isExistsAlready = await getShiftsByDateAndId(shift.email, req.body.date, req.body.id)
                if(isExistsAlready) {
                    let shifts = await deleteShifts(req.body.date, shift.email, shift.name, shift.backgroundColor, shift.id,shift.standby)
                    if(shifts) {
                        res.status(200).send(JSON.stringify({ ok: true }))
                        broadcast('DELETE_EVENT', shifts)
                    }
                }
                else
                    res.sendStatus(400)
            }
            else {
                res.status(400).send({error: 'This shift is too old. can\'t be deleted'})
            }
        }
        else if(user) {
                    if(lock.islock) {
                        res.status(400).send({error: 'can\'t add shift in this date, date is lock'})
                    }
                    else {
                        if(req.body.date > isbefore() && req.body.date < isafterweek() && req.body.date > isthisweek()) {
                            let isExistsAlready = await getShiftsByDateAndId(req.beachUserToken.email, req.body.date, req.body.id)
                            if(isExistsAlready) {
                                let shifts = await deleteShifts(req.body.date, req.beachUserToken.email, user.name, user.color, req.body.id,shift.standby)
                                if(shifts) {
                                    res.status(200).send(JSON.stringify({ ok: true }))
                                    broadcast('DELETE_EVENT', shifts)
                                }
                            }
                            else
                                res.sendStatus(400)

                        }
                        else {
                            res.status(400).send({error: 'can\'t add shift in this date, only in the next week'})
                    }
                }
                
        }
        else
            res.sendStatus(400)
    }
})

app.get('/getTip', async function (req, res) {
    if(req.beachUserToken) {
        let tip = await getTips(req.beachUserToken.email)
        if(tip) {
            res.status(200).send(tip)
        }
        else {
            res.sendStatus(400)
        }
    }
    else {
        res.sendStatus(400)
    }
})

app.post('/getAdminTip', async function (req, res) {
    if(req.beachUserToken.admin) {
        let tip = await getTips(req.body.email)
        if(tip) {
            res.status(200).send(tip)
        }
        else {
            res.status(200).send([])
        }
    }
    else {
        res.sendStatus(400)
    }
})

app.post('/addTip', async function (req, res) {
    if(req.beachUserToken) {
        let writeResult = await addTips(req.body.date, req.beachUserToken.email, req.body.deposit , req.body.tips)
        if(writeResult) { 
            res.status(200).send(JSON.stringify({ ok: true }))  
        }
        else {
            res.sendStatus(400)
        }
    }
})

app.post('/addFacebookName', async function (req, res) {
    if(req.beachUserToken.admin) {
        console.log(req.body.name)
        let writeResult = await addFacebookName(req.body.name)
        if(writeResult) { 
            res.status(200).send(JSON.stringify({ ok: true }))  
        }
        else {
            res.status(400).send({error: 'can\'t add facebok name'})
        }
    }
})

app.post('/deleteUser',async function (req,res){
    if(req.beachUserToken.admin){
        
        let userdelete = await deleteUser(req.body.userId)
        //let users = getUsers()
        if(userdelete) {
            res.status(200).send(JSON.stringify({ ok: true }))
            //broadcast('DELETE_USERS', users)
        }
    else
        res.status(400).send({error: 'can\'t delete user'})
    }
})

app.post('/deleteFacebookName',async function (req,res){
    if(req.beachUserToken.admin){
        let facebookNameDelete = await deleteFacebookName(req.body.name)
        if(facebookNameDelete) {
            res.status(200).send(JSON.stringify({ ok: true }))
            // broadcast('DELETE_EVENT', shifts)
        }
    else
        res.status(400).send({error: 'can\'t delete facebook name'})
    }
})

//add class lock
app.post('/setLockTrue',async function (req,res){
    if(req.beachUserToken.admin){
       let change
       let dates = getDaysAhead(req.body.date,7)
       for (let i = 0; i < 7; i++ ) {
          change = await setLocktrue(dates[i])
       }
       if (change) {
        res.status(200).send(JSON.stringify({ ok: true })) 
       }
       else
          res.sendStatus(400)
    }
})

app.post('/setLockFalse',async function (req,res){
    if(req.beachUserToken.admin){
       let change
       let dates = getDaysAhead(req.body.date,7)
       for (let i = 0; i < 7; i++ ) {
          change = await setLockfalse(dates[i])
       }
       if (change) {
        res.status(200).send(JSON.stringify({ ok: true })) 
       }
       else
          res.sendStatus(400)
    }
})

app.post('/getIsLock', async function (req, res) {
    if(req.beachUserToken) {
        let check = await getLock(req.body.date)
        if(check) 
            res.status(200).send({locked: check.islock})
        else
            res.status(200).send({locked: false})
    }
    else {
        res.sendStatus(400)
    }
})


const httpServer = http.createServer(app);
const wss = new websocket.Server({ server: httpServer });

wss.on('connection', ( wsConnection ) => {
    addConnection(wsConnection)
})

setInterval(() => {
    wss.clients.forEach((ws) => {
        
        if (!ws.isAlive) return ws.terminate();
        
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);

httpServer.listen(port, function() {
    console.log(`http/ws server listening on ${port}`);
});