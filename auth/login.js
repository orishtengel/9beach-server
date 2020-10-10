const { getUser, isFacebookAuthorized, createUser } = require("../breach-firebase/BeachFirestoreConnection")


module.exports = {
    facebookLogin: async (email, name, picture) => {
        let user = await getUser(email)
        if(!user) {
            let valid = await isFacebookAuthorized(name)
            if(valid) {
                await createUser(name, email, picture)
                user = await getUser(email)
            }
            else {
                return null
            }
        }
        return user
    }
}