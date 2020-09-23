const { admin } = require("./BeachFIrebaseConnection");
const db = admin.firestore()
const dayjs = require('dayjs')
var { v4: uuidv4 } = require('uuid');

module.exports = {
    getShifts: async (dates) => {
        const snapshot = await db.collection('shifts').where(admin.firestore.FieldPath.documentId(), 'in', dates).get()
        let arr = {}
        snapshot.forEach(doc => {
            arr[doc.ref.id] = doc.data()
        })
        return arr
    },
    getShiftsByDate: async (userId, date) => {
        let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
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
    addShift: async (date, userId , userName , color) => {
        let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        let event = { email : userId , name : userName, backgroundColor: color, id: uuidv4() }
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
    deleteShifts: async (date, userId, userName, color, id) => {
        let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        let event = { email : userId, name : userName, backgroundColor : color, id: id }
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
    addTips: async(date, userId, deposit, tip) => {
        let dateId = dayjs(date).format("YYYY-MM-DD")
        let data = { }
        data[dateId] = {deposit: deposit, tip: tip}
        return await db.collection('tips').doc(userId).set(data, {merge: true})
    },
    getTips: async (userId) => {
        let snapshot = await db.collection('tips').doc(userId).get()
        let data = await snapshot.data()
        return data
    }
    
    
    
}