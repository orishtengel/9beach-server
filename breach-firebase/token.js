var jwt = require('jsonwebtoken');

const key = 'sdfdfbhdftrevfg'

module.exports = {
    createUserToken: (user) => {
        return jwt.sign({
            role: "user",
            email: user.user.email
        },
        key)
    },
    decodeToken: (token) => {
        return jwt.verify(token, key);
    }
}