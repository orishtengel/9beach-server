const dayjs = require("dayjs");

module.exports = {
    isbefore : () => {
        var date = dayjs().add(-1,'day').format('YYYY-MM-DD');
        return date;
    },

    isafterweek : () => {
        var date = dayjs().day(6).add(8,'day').format('YYYY-MM-DD');
        return date;
    },

    isthisweek : () => {
        var date = dayjs().day(7).format('YYYY-MM-DD');
        return date;
    },

    isbeforelastweek : () => {
        var date = dayjs().day(0).add(-7,'day').format('YYYY-MM-DD');
        return date;
    }
}