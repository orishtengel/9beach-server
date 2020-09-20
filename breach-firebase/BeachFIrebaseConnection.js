var admin = require("firebase-admin");
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");
// Add the Firebase products that you want to use
require("firebase/auth");

var serviceAccount = require("./beach-6493e-firebase-adminsdk-3dikw-08f7669fab.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://beach-6493e.firebaseio.com"
});

var firebaseConfig = {
    apiKey: "AIzaSyDo3aoWImu2SCWLENR_HMdSeaUx36WteIU",
    authDomain: "beach-6493e.firebaseapp.com",
    databaseURL: "https://beach-6493e.firebaseio.com",
    projectId: "beach-6493e",
    storageBucket: "beach-6493e.appspot.com",
    messagingSenderId: "601135062449",
    appId: "1:601135062449:web:bfd9b273dfade67f8bf190"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);



module.exports = {
    admin: admin,
    login: (username, password, func) => {
        // All future sign-in request now include tenant ID.
        firebase.auth().signInWithEmailAndPassword(username, password)
        .then(function(result) {
            func(result)
            // result.user.tenantId should be ‘TENANT_PROJECT_ID’.
        }).catch(function(error) {
            // Handle error.
            func(undefined, error)
            console.log(error)
        });
    }
}