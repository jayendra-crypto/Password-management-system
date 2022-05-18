const express = require('express')
app = express()
var bcrypt = require('bcryptjs');   // decrypting password
const path = require('path')
const jwt = require('jsonwebtoken')
app.use(express.static('public'))// to use css or external files
app.set('view engine', 'ejs');
app.set('views', './views')//to use ejs template engine filews

app.use(express.urlencoded())// to get the form data
app.set('views', path.join(__dirname, 'views'))// to set the views directory
const mongoose = require('mongoose');
const { stringify } = require('querystring');
const { check, validationResult } = require('express-validator');  //to validate the input and report any errors before creating the user:
// like length of password

var passdetailsmodel = require('./modules/add-password')
mongoose.connect('mongodb://localhost/pms', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false });
//last two are added to remove depracted warnings
//last one for use findbyidandupdate

if (typeof localStorage === "undefined" || localStorage === null) {         //
    const LocalStorage = require('node-localstorage').LocalStorage;         // for local storage module 
    localStorage = new LocalStorage('./scratch');                           //
}



const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    // do everything here

    // userdetails schemA
    const userdetails = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },

        email: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },

        password: {
            type: String,
            required: true

        },
        date: {
            type: Date,
            default: Date.now

        }



    });

    // MODEL

    const usermodel = mongoose.model('users', userdetails);


    //new scema forv pass cat
    const passcatschema = new mongoose.Schema({
        password_category: {
            type: String,
            required: true,
            
        },
        username: {
            type: String,
            required: true,
           
        }

    });

    // MODEL

    const passcatmodel = mongoose.model('password_categories', passcatschema);



    //middleware for checkloginuser
    function checkloginuser(req, res, next) {
        var uusertoken = localStorage.getItem('usertoken');
        try {
            var decoded = jwt.verify(uusertoken, 'logintoken');

        } catch (err) {

            res.redirect('/');
        }
        next();
    }



    //middleware for email
    function emailcheck(req, res, next) {
        usermodel.find({ email: req.body.email }).exec(function (err, data) {
            if (err) return console.error(err);

            if (data.length != 0) {

                return res.render("signup.ejs", { title: "signup", msg: "email already exist", alert: "danger" })
            }
            next();
        });

    }



    //middleware for username
    function usernamecheck(req, res, next) {
        passcatmodel.find({ username: req.body.username }).exec(function (err, data) {
            if (err) return console.error(err);
            if (data.length != 0) {
                return res.render("signup.ejs", { title: "signup", msg: "username already exist", alert: "danger" })
            }
            next();
        });

    }

//middleware for password_category
function passcatcheck(req, res, next) {
    var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')

    passcatmodel.find({ password_category: req.body.passwordcategoryname,username:loginuser}).exec(function (err, data) {
        if (err) return console.error(err);
        if (data.length != 0) {
            return res.render("add-category.ejs", { title: "Add category",loginuser:loginuser, msg: "category already exist", alert: "danger",errors:"" })
        }
        next();
    });

}

    //middleware for password and confirm password
    function confirmpasswordcheck(req, res, next) {
        if (req.body.password != req.body.confirmpassword) {
            return res.render("signup.ejs", { title: "signup", msg: "password and confirm password need to be matched", alert: "danger" })

        }


        next();
    }


    //   login

    app.get('/', (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        if (loginuser) {
            res.redirect('/dashboard')
        }
        else {



            res.render("index.ejs", { title: "login", msg: '', alert: '' })
        }
    });



    app.post('/', (req, res) => {

        usermodel.find({ username: req.body.username }).exec(function (err, data) {
            if (err) return console.error(err);

            if (data.length == 0) {

                res.render("index.ejs", { title: "login", msg: "username not exist", alert: "danger" })
            }
            else {
                if (bcrypt.compareSync(req.body.password, data[0].password)) {
                    // creating token for user
                    var token = jwt.sign({ userid: data[0]._id }, 'logintoken');
                    localStorage.setItem('usertoken', token);
                    localStorage.setItem('loginuser', data[0].username);
                    res.redirect('/dashboard');
                }
                else {
                    res.render("index.ejs", { title: "login", msg: "wrong password", alert: "danger" })
                }
            }

        });


    });


    // dashboard
    app.get('/dashboard', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')


        res.render("dashboard.ejs", { title: "login", loginuser: loginuser })
    });

    app.get('/logout', checkloginuser, (req, res) => {
        localStorage.removeItem('usertoken');
        localStorage.removeItem('loginuser');


        res.redirect('/');
    });


    //signup


    app.get('/signup', (req, res) => {
        var loginuser = localStorage.getItem('loginuser');
        if (loginuser) {
            res.redirect('/dashboard')
        }
        else {


            res.render("signup.ejs", { title: "signup", msg: '' })

        }


    });


    app.post('/signup', emailcheck, usernamecheck, confirmpasswordcheck, (req, res) => {





        const user = new usermodel({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)
        });
        user.save(function (err, res1) {           // create and saving to database
            if (err) return console.error(err);

            res.render("signup.ejs", { title: "signup", msg: 'user registered successfully', alert: "success" })
        });
    });

    //password-category

    app.get('/password-category', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        passcatmodel.find({username:loginuser}).exec(function (err, data) {
            if (err) return console.error(err);

            res.render("password-category.ejs", { loginuser: loginuser, records: data });


        })
    });


    app.get('/password-category/delete/:id', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')

        passcatmodel.findByIdAndDelete(req.params.id).exec(function (err) {
            if (err) return console.error(err);

            res.redirect("/password-category");


        })

    });

    app.get('/password-category/edit/:id', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        var id = req.params.id
        passcatmodel.findById(id).exec(function (err, data) {
            if (err) return console.error(err);
            // console.log(data)
            res.render("edit_pass_cat.ejs", { title: "edit category", loginuser: loginuser, errors: '', msg: '', records: data });

        })

    });


    app.post('/update_pass_cat', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        var edited_id = req.body.id
        var edited_data = req.body.editpasswordcategoryname
        passcatmodel.findByIdAndUpdate(edited_id, { password_category: edited_data }).exec(function (err, data) {
            if (err) return console.error(err);
            res.redirect("password-category");

        })

    });



    //add category

    app.get('/add-category', checkloginuser,(req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')


        res.render("add-category.ejs", { title: "Add category", loginuser: loginuser, errors: '', msg: '' })


    });



    app.post('/add-category', checkloginuser,passcatcheck,  [
        // password must be at least 1 chars long
        check('passwordcategoryname', 'The password must be 1+ chars long and contain a number').isLength({ min: 1 })
    ], (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //   console.log(errors);
            res.render("add-category.ejs", { title: "Add category", loginuser: loginuser, errors: errors.mapped(), alert: "danger", msg: "" })
        }

        else {
            var passcatname = req.body.passwordcategoryname;
            var passdetails = new passcatmodel({
                password_category: passcatname,
                username:loginuser
            })
            passdetails.save(function (err, res1) {           // create and saving to database
                if (err) return console.error(err);
                res.render("add-category.ejs", { title: "Add category", loginuser: loginuser, errors: '', alert: 'success', msg: 'added successfully' })

            });

        }

    });

    // add new password

    app.get('/add-new-password', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')

        passcatmodel.find({username:loginuser}).exec(function (err, data) {
            if (err) return console.error(err);

            res.render("add-new-password.ejs", { title: "Add password", loginuser: loginuser, records: data, msg: '' })

        })
    });


    app.post('/add-new-password', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        var category = req.body.pass_category
        var passdetails = req.body.editor1

        var passdetails = new passdetailsmodel({
            password_category: category,
            username:loginuser,
            password_details: passdetails
        })
        passdetails.save(function (err, res1) {           // create and saving to database
            if (err) return console.error(err);



            passcatmodel.find({username:loginuser}).exec(function (err, data) {
                if (err) return console.error(err);


                res.render("add-new-password.ejs", { title: "Add password", loginuser: loginuser, records: data, msg: "data entered successfully", alert: 'success' })

            })
        })
    });

    // view-all-password

    app.get('/view-all-password', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
       
            const options = {
                page: 1,
                limit: 12,
              };
            passdetailsmodel.paginate({username:loginuser},options,function(err, result) {
                if (err) return console.error(err);
                var data=result.docs;
            res.render("view-all-password.ejs", { title: "view Add password", loginuser: loginuser, records: data,pages:result.totalPages,current:result.page })
        })
    

    });

    app.get('/view-all-password/:pages', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
             var pages=req.params.pages;
       
            const options = {
                page: pages,
                limit: 5,
              };
            passdetailsmodel.paginate({username:loginuser},options,function(err, result) {
                if (err) return console.error(err);
                var data=result.docs;
            res.render("view-all-password.ejs", { title: "view Add password", loginuser: loginuser, records: data,pages:result.totalPages,current:result.page })
        })
    

    });


    app.get('/view-all-password/delete/:id', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')

        passdetailsmodel.findByIdAndDelete(req.params.id).exec(function (err) {
            if (err) return console.error(err);

            res.redirect("/view-all-password");


        })

    });


    app.get('/view-all-password/edit/:id', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        var id = req.params.id
        passcatmodel.find({username:loginuser}).exec(function (err, data) {
            if (err) return console.error(err);
            passdetailsmodel.findById(id).exec(function (err, data1) {
                if (err) return console.error(err);

                res.render("edit_pass_det.ejs", { title: "edit password details", loginuser: loginuser, errors: '', msg: '', records: data, records1: data1 });

            })
        })

    });



    app.post('/update-password-details', checkloginuser, (req, res) => {
        var loginuser = localStorage.getItem('loginuser')
        localStorage.getItem('logintoken')
        var edited_id = req.body.id
        var edited_cat = req.body.pass_category
        var edited_det = req.body.editor1
        passdetailsmodel.findByIdAndUpdate(edited_id, { password_category: edited_cat, password_details: edited_det }).exec(function (err, data) {
            if (err) return console.error(err);
            res.redirect("/view-all-password");

        })

    });


    app.listen(80, () => {
        
    });
});
