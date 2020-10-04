var jwt = require('jsonwebtoken');

const key = 'sdfdfbhdftrevfg'

module.exports = {
    createUserToken: (email, name, admin) => {
        return jwt.sign({
            email: email,
            name: name,
            admin: !!admin
        },
        key)
    },
    decodeToken: (token) => {
        return jwt.verify(token, key);
    }
}

