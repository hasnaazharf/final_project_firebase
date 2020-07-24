const uuid = require('uuid');
const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
const dateFormat = require('dateformat');

var serviceAccount = require("./permission.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://energy-monitoring-6c8ab.firebaseio.com"
});
const db = admin.firestore();

app.use(cors({ origin: true }));

app.get('/hello-world', (req, res) => {
    return res.status(200).send('Hello World!');
});

// log
app.post('/api/energy_log', (req, res) => {
    (async () => {
        var now = new Date();
        try {
            await db.collection('energy_logs').doc(`/${uuid.v4()}/`)
                .create({
                    watt: req.body.watt,
                    value: req.body.value,
                    created_at: admin.firestore.Timestamp.fromDate(new Date())
                });
        } catch (error) {
            return res.status(500).send(error);
        }

        // Store daily energy consumption
        try {
            await db.collection('energy_daily').where('created_date', '==', dateFormat(now, "yyyy-mm-dd")).get()
                .then(querySnapshot => {
                    let docs = querySnapshot.docs;
                    let created_at = null
                    let value = 0
                    let consumpsion = 0
                    let seconds = 0
                    for (let doc of docs) {
                        value = doc.data().value
                        created_at = doc.data().created_at
                        consumpsion += doc.data().joule
                        seconds += doc.data().seconds
                    }
                    
                    let diff = 0
                    if (created_at){
                        diff = (now.getTime() / 1000) - created_at._seconds
                    }
                    if(value>0){
                        seconds += diff
                    }

                    let _consumpsion = diff * value * req.body.watt
                    consumpsion += _consumpsion
                    joule = consumpsion
                    wh = consumpsion / 3600
                    kwh = wh / 1000
                    
                    try {
                        db.collection('energy_daily').doc(`/${dateFormat(now, "yyyy-mm-dd")}/`)
                            .set({
                                value: req.body.value,
                                created_at: admin.firestore.Timestamp.fromDate(now),
                                created_date: dateFormat(now, "yyyy-mm-dd"),
                                seconds: seconds,
                                joule: joule,
                                wh: wh,
                                kwh: kwh
                            });
                    } catch (error) {
                        return res.status(500).send(error);
                    }
                    return null
                });
        } catch (error) {
            return res.status(500).send(error);
        }

        // Store monthly energy consumption
        try {
            await db.collection('energy_monthly').where('created_month', '==', dateFormat(now, "mmmm yyyy")).get()
                .then(querySnapshot => {
                    let docs = querySnapshot.docs;
                    let created_at = null
                    let value = 0
                    let consumpsion = 0
                    let seconds = 0
                    for (let doc of docs) {
                        value = doc.data().value
                        created_at = doc.data().created_at
                        consumpsion += doc.data().joule
                        seconds += doc.data().seconds
                    }
                    
                    let diff = 0
                    if (created_at){
                        diff = (now.getTime() / 1000) - created_at._seconds
                    }
                    if(value>0){
                        seconds += diff
                    }

                    let _consumpsion = diff * value * req.body.watt
                    consumpsion += _consumpsion
                    joule = consumpsion
                    wh = consumpsion / 3600
                    kwh = wh / 1000
                    
                    try {
                        db.collection('energy_monthly').doc(`/${dateFormat(now, "mmmm yyyy")}/`)
                            .set({
                                value: req.body.value,
                                created_at: admin.firestore.Timestamp.fromDate(now),
                                created_month: dateFormat(now, "mmmm yyyy"),
                                seconds: seconds,
                                joule: joule,
                                wh: wh,
                                kwh: kwh
                            });
                    } catch (error) {
                        return res.status(500).send(error);
                    }
                    return null
                });
        } catch (error) {
            return res.status(500).send(error);
        }

        return res.status(200).send();
    })();
});


// read all logs
app.get('/api/energy_log', (req, res) => {
    (async () => {
        try {
            let query = db.collection('energy_logs').orderBy('created_at').limit(100);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        value: doc.data().value,
                        created_at: doc.data().created_at,
                        created_at_str: doc.data().created_at.toDate(),
                    };
                    response.push(selectedItem);
                }
                return null;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// read all logs
app.get('/api/last_day_energy', (req, res) => {
    (async () => {
        try {
            let query = db.collection('energy_daily').orderBy('created_at').limit(1);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        date: doc.id,
                        seconds: doc.data().seconds,
                        joule: doc.data().joule,
                        wh: doc.data().wh,
                        kwh: doc.data().kwh,
                    };
                    response.push(selectedItem);
                }
                return null;
            });
            return res.status(200).send(response[0]);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// read all logs
app.get('/api/energy_daily', (req, res) => {
    (async () => {
        try {
            let query = db.collection('energy_daily').orderBy('created_at').limit(30);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        date: doc.id,
                        joule: doc.data().joule,
                        wh: doc.data().wh,
                        kwh: doc.data().kwh,
                    };
                    response.push(selectedItem);
                }
                return null;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// read monthy logs
app.get('/api/energy_monthly', (req, res) => {
    (async () => {
        try {
            let query = db.collection('energy_monthly').orderBy('created_at').limit(12);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        date: doc.id,
                        joule: doc.data().joule,
                        wh: doc.data().wh,
                        kwh: doc.data().kwh,
                    };
                    response.push(selectedItem);
                }
                return null;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

exports.app = functions.https.onRequest(app);
