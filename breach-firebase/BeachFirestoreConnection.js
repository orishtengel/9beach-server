const { admin } = require("./BeachFIrebaseConnection");
const db = admin.firestore()
const dayjs = require('dayjs')

module.exports = {
    getShiftsByDate: async (date) => {
        let dateId = dayjs(date).format("YYYY-MM-DD")
        const snapshot = await db.collection('shifts').doc(dateId).get()
        return snapshot.data()
    },
    addShift: async (date, keyHour, userId) => {
        let dateId = dayjs(date).format("YYYY-MM-DD")
        let data = {}
        data[keyHour] = admin.firestore.FieldValue.arrayUnion(userId)
        return await db.collection('shifts').doc(dateId).update(data)
    },
    deleteShifts: async (date, keyHour, userId) => {
        let dateId = dayjs(date).format("YYYY-MM-DD")
        let data = {}
        data[keyHour] = admin.firestore.FieldValue.arrayRemove(userId)
        return await db.collection('shifts').doc(dateId).update(data)
    },
    getUser: async (userId) => {
        const snapshot = await db.collection('users').doc(userId).get()
        return snapshot.data()
    }

}