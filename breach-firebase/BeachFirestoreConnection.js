const { admin } = require("./BeachFIrebaseConnection");
const db = admin.firestore()
const dayjs = require('dayjs')
var { v4: uuidv4 } = require('uuid');
const { DATE_FORMAT } = require("../consts");
const { generateRandomColor } = require("../utils/colorutils");

module.exports = {
    getShifts: async (dates) => {
        const snapshot = await db.collection('shifts').where(admin.firestore.FieldPath.documentId(), 'in', dates).get()
        let arr = {}
        snapshot.forEach(doc => {
            arr[doc.ref.id] = doc.data()
        })
        return arr
    },
    getShiftsByDateAndId: async (userId, date, eventId) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD H:mm Z").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 

        const snapshot = await db.collection('shifts').doc(dateKey).get()
        let shifts = snapshot.data()

        if(shifts && shifts[dateHour]) {
            let index = shifts[dateHour].findIndex(shift => shift.email == userId && shift.id == eventId)
            if(index != -1)
                return shifts[dateHour][index]
        }
        return undefined
    },

    getShiftsByDateAndIdWemail: async ( date, eventId) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        const snapshot = await db.collection('shifts').doc(dateKey).get()
        let shifts = snapshot.data()
        if(shifts && shifts[dateHour]) {
            let index = shifts[dateHour].findIndex(shift => shift.id == eventId)
            if(index != -1)
                return shifts[dateHour][index]
        }
        return undefined
    },


    getShiftsByDate: async (userId, date) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 

        const snapshot = await db.collection('shifts').doc(dateKey).get()
        let shifts = snapshot.data()

        if(shifts && shifts[dateHour]) {
            let index = shifts[dateHour].findIndex(shift => shift.email == userId)
            if(index != -1)
                return shifts[dateHour][index]
        }
        return undefined
    },
    addShift: async (date, userId , userName , color, standby) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        let event = { email : userId , name : userName, backgroundColor: color, id: uuidv4() ,standby: standby}
        data[dateHour] = admin.firestore.FieldValue.arrayUnion(event)
        let result = await db.collection('shifts').doc(dateKey).set(data, {merge: true})
        if(result) {
            event.date = date
            event.title = event.name
            return event
        }
        else
            return undefined
    },

    // changeStandBy: async(date,userId,userName,color,id,standby)=>{
    //      let data = this.getShiftsByDate(userId,date)
    //      let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
    //      let dateKey = dateId[0]
    //      let dateHour = dateId[1] 
    //      let change = false
    //      if (data.standby)
    //          let change = false
    //     else
    //         change=true
    //     let result = await db.collection('shifts').doc(dateKey)[dateHour].standby.set(standby,{merge:true})
    //     if (result)
    //     {

    //     }

    // },
    isFacebookAuthorized: async (name) => {
        let id = name.toLowerCase().replace(' ', '')
        const snapshot = await db.collection('facebookNames').doc(id).get()
        return snapshot.data()
    },
    createUser: async (name, email, picture) => {
        await db.collection('users').doc(email).create({name: name.toLowerCase(),
             color: generateRandomColor(),
             admin: false,
             picture: picture})
    },
    deleteShifts: async (date, userId, userName, color, id,standby) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        let event = { email : userId, name : userName, backgroundColor : color, id: id, standby : standby}
        data[dateHour] = admin.firestore.FieldValue.arrayRemove(event)
        let result = await db.collection('shifts').doc(dateKey).set(data, {merge: true})
        if(result) 
            return event
        else
            return undefined
    },
    getUser: async (userId) => {
        const snapshot = await db.collection('users').doc(userId).get()
        return snapshot.data()
    },
    getUsers: async () => {
        const snapshot = await db.collection('users').get()
        let arr = {}
        snapshot.forEach(doc => {
            arr[doc.ref.id] = doc.data()
        })
        return arr
        
    },
    getFacebookName: async () =>{
        const snapshot = await db.collection('users').get()
        let arr = {}
        snapshot.forEach(doc => {
            arr[doc.ref.id] = doc.data()
        })
        return arr

    },
    getOneFacebookName : async (name) => {
        const snapshot = await db.collection('facebookNames').doc(name).get()
        let check = snapshot.data()
        if(check)
            return true
        else    
            return false
    
 
    },

    addFacebookName: async (name) => {
        let result = await db.collection('facebookNames').doc(name).create({})
        if(result) 
            return true
        else
            return undefined
    },

    deleteUser: async (userId) => {  
        let result = await db.collection('users').doc(userId).delete()
        if(result) 
            return true
        else
            return undefined
    },

    deleteFacebookName: async (name) => {
        let result = await db.collection('facebookNames').doc(name).delete()
        if(result) 
            return true
        else
            return undefined
    },

    addTips: async(date, userId, deposit, tip) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD")
        let data = { }
        data[dateId] = {deposit: deposit, tip: tip}
        return await db.collection('tips').doc(userId).set(data, {merge: true})
    },

    getTips: async (userId) => {
        let snapshot = await db.collection('tips').doc(userId).get()
        let data = await snapshot.data()
        return data
    },

    //add lock to manger 
    setLocktrue: async(date) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD")
        let data = { }
        data = { islock : true }
        return await db.collection('lock').doc(dateId).set(data, {merge: true})
    }, 

    setLockfalse: async(date) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD")
        let data = { }
        data = { islock : false }
        return await db.collection('lock').doc(dateId).set(data, {merge: true})
    },

    getLock: async (date) => {
        let dateId = dayjs(date, DATE_FORMAT).format("YYYY-MM-DD")
        let snapshot = await db.collection('lock').doc(dateId).get()
        let data = await snapshot.data()
        return data
    },



    
    
    
    
}