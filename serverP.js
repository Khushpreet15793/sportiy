require("dotenv").config();
const express = require("express");
const path = require("path");
const fileuploader = require("express-fileupload");
const mysql2 = require("mysql2");
const cloudinary = require("cloudinary").v2;

const app = express();

// Static files
app.use(express.static("public"));
app.use(fileuploader());
app.use(express.urlencoded({ extended: true }));

// MySQL connection
const sqldb = mysql2.createConnection(process.env.DB_URL);

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Connect DB
sqldb.connect(err => {
    if (err) console.error("DB Error:", err.message);
    else console.log("Connected to MySQL database");
});

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/playerdash", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "playerdash.html"));
});

app.get("/hlo", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashOrganiser.html"));
});

app.get("/tour", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tournament.html"));
});

app.get("/angular", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "findtournament.html"));
});

// Signup
app.get("/signup", (req, resp) => {
    let { txtMail, txtPwd, utype } = req.query;
    sqldb.query(
        "INSERT INTO users(emailid,pwd,utype,status,dos) VALUES(?,?,?,?,CURRENT_DATE())",
        [txtMail, txtPwd, utype, 1],
        (err) => {
            if (!err) resp.send("Signed up Successfully");
            else resp.send(err.message);
        }
    );
});

// Login
app.get("/login", (req, resp) => {
    let { txtMaillog, txtPwdlog } = req.query;
    sqldb.query(
        "SELECT * FROM users WHERE emailid=? AND pwd=?",
        [txtMaillog, txtPwdlog],
        (err, rows) => {
            if (rows.length === 1) resp.send(rows[0].utype);
            else resp.send("incorrect details");
        }
    );
});

// Logout
app.get("/logout", (req, resp) => {
    resp.send("logged out");
});

// Change Password
app.get("/change-pwd", (req, resp) => {
    sqldb.query(
        "UPDATE users SET pwd=? WHERE emailid=? AND pwd=?",
        [req.query.newpwd, req.query.email, req.query.pwd],
        (err, result) => {
            if (err) resp.send(err.message);
            else if (result.affectedRows === 0) resp.send("Incorrect current password");
            else resp.send("Password Changed Successfully");
        }
    );
});

// Check user
app.get("/chk-user", (req, resp) => {
    sqldb.query(
        "SELECT * FROM users WHERE emailid=?",
        [req.query.txtMail],
        (err, rows) => {
            if (rows.length === 1) resp.send("Already taken");
            else resp.send("Ok");
        }
    );
});

// Save organiser
app.post("/save", async (req, resp) => {
    let filename = "nopic.jpg";
    if (req.files?.txtprofile) {
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, cloudRes) => {
                if (!error) filename = cloudRes.url;
            }
        );
    }

    sqldb.query(
        "INSERT INTO organizers VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        [
            req.body.txtemail, req.body.txtorg, req.body.txtcontact,
            req.body.txtaddress, req.body.txtcity, filename,
            req.body.txtproof, req.body.txtsports.toString(),
            req.body.txtprev, req.body.txtwebsite, req.body.txtinsta
        ],
        (err) => {
            if (!err) resp.send("Record Saved Successfully");
            else resp.send(err.message);
        }
    );
});

// Update organiser
app.post("/update", async (req, resp) => {
    let filename = req.body.txtprofile || "nopic.jpg";
    if (req.files?.txtprofile) {
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, cloudRes) => {
                if (!error) filename = cloudRes.url;
            }
        );
    }

    sqldb.query(
        "UPDATE organizers SET organisation=?,contact=?,address=?,city=?,profile=?,prrof=?,sports=?,previous=?,website=?,instagram=? WHERE email=?",
        [
            req.body.txtorg, req.body.txtcontact, req.body.txtaddress,
            req.body.txtcity, filename, req.body.txtproof,
            req.body.txtsports, req.body.txtprev, req.body.txtwebsite,
            req.body.txtinsta, req.body.txtemail
        ],
        (err) => {
            if (!err) resp.send("UPDATED Successfully");
            else resp.send(err.message);
        }
    );
});

// Save tournament
app.post("/savet", async (req, resp) => {
    let filename = "nopic.jpg";
    if (req.files?.txtposter) {
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, cloudRes) => {
                if (!error) filename = cloudRes.url;
            }
        );
    }

    sqldb.query(
        "INSERT INTO tournamentz VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        [
            null, req.body.txtemail, req.body.txtgame,
            req.body.txttitle, req.body.txtfee, req.body.txtdate,
            req.body.txtcity, req.body.txtlocation, req.body.txtprize,
            filename, req.body.txtinfo
        ],
        (err) => {
            if (!err) resp.send("Record Saved Successfully");
            else resp.send(err.message);
        }
    );
});

// Save player
app.post("/sendplayer", (req, resp) => {
    sqldb.query(
        "INSERT INTO players VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
            req.body.txtemail, req.body.pname, req.body.game,
            req.body.mobile, req.body.dob, req.body.gender,
            req.body.address, req.body.city, req.body.idproof,
            req.body.otherinfo
        ],
        (err) => {
            if (!err) resp.send("Record Saved Successfully");
            else resp.send(err.message);
        }
    );
});

// Modify player
app.post("/modifyplayer", (req, resp) => {
    sqldb.query(
        "UPDATE players SET pname=?,game=?,mobile=?,dob=?,gender=?,address=?,city=?,idproof=?,otherinfo=? WHERE email=?",
        [
            req.body.pname, req.body.game, req.body.mobile,
            req.body.dob, req.body.gender, req.body.address,
            req.body.city, req.body.idproof, req.body.otherinfo,
            req.body.txtemail
        ],
        (err) => {
            if (!err) resp.send("UPDATED Successfully");
            else resp.send(err.message);
        }
    );
});

// Fetch tournament by city & game
app.get("/fetch-all-user", (req, resp) => {
    sqldb.query(
        "SELECT * FROM tournamentz WHERE city=? AND game=?",
        [req.query.city, req.query.game],
        (err, rows) => {
            if (err) resp.send(err.message);
            else resp.send(rows);
        }
    );
});

// Fetch distinct games
app.get("/fetch-game", (req, resp) => {
    sqldb.query("SELECT DISTINCT game FROM tournamentz", (err, rows) => {
        if (err) resp.send(err.message);
        else resp.send(rows);
    });
});

// Fetch distinct cities
app.get("/fetch-city", (req, resp) => {
    sqldb.query("SELECT DISTINCT city FROM tournamentz", (err, rows) => {
        if (err) resp.send(err.message);
        else resp.send(rows);
    });
});

const PORT = process.env.PORT || 2004;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
