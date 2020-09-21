var jwt = require('jsonwebtoken');

const key = 'sdfdfbhdftrevfg'

module.exports = {
    createUserToken: (user) => {
        return jwt.sign({
            role: "user",
            email: user.user.email,
            name: user.user.name
        },
        key)
    },
    decodeToken: (token) => {
        return jwt.verify(token, key);
    }
}