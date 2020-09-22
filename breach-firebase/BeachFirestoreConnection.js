const { admin } = require("./BeachFIrebaseConnection");
const db = admin.firestore()
const dayjs = require('dayjs')

module.exports = {
    getShifts: async (dates) => {
        const snapshot = await db.collection('shifts').where(admin.firestore.FieldPath.documentId(), 'in', dates).get()
        let arr = {}
        snapshot.forEach(doc => {
            arr[doc.ref.id] = doc.data()
        })
        return arr
    },
    getShiftsByDate: async (dateId) => {
        const snapshot = await db.collection('shifts').doc(dateId).get()
        return snapshot.data()
    },
    addShift: async (date, userId , userName) => {
        let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        data[dateHour] = admin.firestore.FieldValue.arrayUnion({email : userId , name : userName})
        let result = await db.collection('shifts').doc(dateKey).set(data, {merge: true})

        if(result) 
            return { date: date, title: userName }
        else
            return undefined
    },
    deleteShifts: async (date, userId, userName) => {
        let dateId = dayjs(date).format("YYYY-MM-DD H:mm").split(' ')
        let dateKey = dateId[0]
        let dateHour = dateId[1] 
        let data = {}
        data[dateHour] = admin.firestore.FieldValue.arrayRemove({email : userId, name : userName})
        return await db.collection('shifts').doc(dateKey).update(data)
    },
    getUser: async (userId) => {
        const snapshot = await db.collection('users').doc(userId).get()
        return snapshot.data()
    }
}