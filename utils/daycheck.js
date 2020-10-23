
module.exports = {
    isbefore : () => {
        return dayjs().add(-1,'day').format('YYYY-MM-DD')
    },

    isafterweek : () => {
        return dayjs().day(6).add(8,'day').format('YYYY-MM-DD')
    },

    isthisweek : () => {
        return dayjs().day(7).format('YYYY-MM-DD')
    },

    isbeforelastweek : () => {
        return dayjs().day(0).add(-7,'day').format('YYYY-MM-DD')
    }

}