const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const swal = require('sweetalert');
const nodemailer = require('nodemailer');
const User = require('../model/user');
const Product = require('../model/product');
const Brand = require('../model/brand');
const Banner = require('../model/banner');
const Order = require('../model/order');
const Category = require('../model/category');
const Cart = require('../model/cart');
const Wishlist = require('../model/wishlist');

const Otp = require('../model/otp');
const {
    isLoggedIn,
    isActive
} = require('../middleware');
const asyncErrorCatcher = require('../util/asynErrorCatch');


const loginValidate = (req, res, next) => {
    passport.authenticate('local', {
        // successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    })(req, res, next);
};
const home = async (req, res) => {
    const banners = await Banner.find({});
    //console.log(banners)
    const products = await Product.find({});
    const brands = await Brand.find({});
    const newProducts = await Product.find({
        createdAt: {
            $lt: Date.now(),
            $gt: Date.now() - 604800000
        }
    });
    const categories = await Category.find({});
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId)
    if (req.session.userId) {
        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        let wishlistCount = await Wishlist.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$Items"
                }
            }
        }]);
        console.log(wishlistCount)

        res.render('user/index', {
            products,
            banners,
            categories,
            newProducts,
            brands,
            cartCount,
            wishlistCount
        });
        console.log(wishlistCount)
    } else {
        res.render('user/index', {
            products,
            banners,
            categories,
            newProducts,
            brands,
            cartCount: '',
            wishlistCount: ''
        });

    }
    // console.log('product.image[0]', newProducts)
    // console.log('user session', req.session);
}

const registerPage = (req, res) => {
    res.render('user/register');
}

const loginPage = (req, res) => {
    if (req.user) {
        return res.redirect('/user/');
    }
    res.render('user/login');
}

var email;

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',

    auth: {
        user: process.env.email,
        pass: process.env.password,
    }

});

let otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);


const userRegister = async (req, res) => {

    console.log(otp);

    email = req.body.username;
    console.log(req.body);
    const {
        username,
        firstname,
        lastname,
        password
    } = req.body;
    const user = new User({
        username,
        firstname,
        lastname,
        verified: false
    });
    const registerUser = await User.register(user, password);
    console.log(registerUser);
    req.flash('success', 'Welcome');
    //res.redirect('/user/lo');
    // send mail with defined transport object
    var mailOptions = {
        to: req.body.username,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


        //res.redirect('user/login')
    });

    res.render('user/otp', {
        pass: {
            msg: '',
            email

        }
    });
}

const otpPage = async (req, res) => {

    console.log(req.body);
    if (req.body.otp == otp) {

        const user = await User.findOne({
            username: req.body.email
        });
        console.log(user);
        if (user) {
            await User.updateOne({
                username: req.body.email
            }, {
                $set: {
                    verified: true
                }

            });
        }
        //res.send("You has been successfully registered");
        res.render('user/login');
    } else {
        res.render('user/otp', {
            pass: {
                msg: 'otp is incorrect',

            }

        });
    }
}

const submitLogin = async (req, res) => {
    // console.log('submit')
    const {
        username,
        password
    } = req.body;
    console.log('username', username);
    const user = await User.findOne({
        username
    });
    console.log('user', user);
    console.log('user verified', user.verified);
    if (user.verified) {
        req.session.username = user.username;
        req.session.userId = user._id;
        req.session.save();
        req.flash('success', 'Login Success');
        res.redirect('/');
    } else {
        console.log('username', username);
        req.flash('error', 'Not verified user');
        // res.redirect('/register');

        var mailOptions = {
            to: req.body.username,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
        res.render('user/otp', {
            pass: {
                msg: '',
                email

            }
        });
    }

}


const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
}

const getProfile = async (req, res) => {
    let userId = req.session.userId;
    const user = await User.findById(userId);
    const categories = await Category.find({});
    userId = mongoose.Types.ObjectId(userId);
    let cartCount = await Cart.aggregate([{
        $match: {
            userId
        }
    }, {
        $project: {
            _id: 0,
            count: {
                $size: "$cartItems"
            }
        }
    }]);
    let wishlistCount = await Wishlist.aggregate([{
        $match: {
            userId
        }
    }, {
        $project: {
            _id: 0,
            count: {
                $size: "$Items"
            }
        }
    }]);
    //console.log(cartCount, wishlistCount)
    res.render('user/profile', {
        user,
        categories,
        wishlistCount,
        cartCount
    });
}

const postProfile = async (req, res) => {
    const
        details = JSON.parse(JSON.stringify(req.body));
    console.log('details', details);
    const user = await User.findOne({
        _id: req.session.userId
    });
    console.log('user', user);
    user.addressDetails.address = details.address;
    user.addressDetails.city = details.city;
    user.addressDetails.country = details.country;
    user.addressDetails.pincode = details.pincode;
    user.addressDetails.mobilenumber = details.mobileNumber;
    await user.save();
    console.log('user', user);
    res.redirect('/profile');
}

const getOrders = async (req, res) => {
    let userId = req.session.userId;
    const order = await Order.find({
        userId
    })
    if (order) {
        const orders = await Order.find({
            userId
        }).populate({
            path: "orderItems",
            populate: {
                path: "productId"
            }
        });
        // console.log('orderitems', orders[0].orderitems);
        for (var i = 0; i < orders.length; i++) {
            orders[i].orderItems.forEach((element, index) => {
                console.log(element);
                console.log(index);
            })
        }
        const categories = await Category.find({});
        userId = mongoose.Types.ObjectId(userId);
        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        let wishlistCount = await Wishlist.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$Items"
                }
            }
        }]);
        res.render('user/orders', {
            orders,
            categories,
            cartCount,
            wishlistCount
        })
    } else {
        const categories = await Category.find({});
        userId = mongoose.Types.ObjectId(userId);
        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        let wishlistCount = await Wishlist.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                _id: 0,
                count: {
                    $size: "$Items"
                }
            }
        }]);
        res.render('user/orders', {
            orders: '',
            categories,
            cartCount,
            wishlistCount
        })
    }
}

const getAddress = async (req, res) => {
    let addressId = req.body.addressid;
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId);
    //console.log(addressId)
    addressId = mongoose.Types.ObjectId(addressId);
    // 
    const address = await User.aggregate([{
        $match: {
            _id: userId
        }
    }, {
        $unwind: "$addressDetails"
    }, {
        $match: {
            "addressDetails._id": addressId
        }
    }])
    console.log(address[0]);
    res.send({
        address: address[0]
    })
}
const postNewAddress = async (req, res) => {
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId);
    const user = await User.findById(userId);
    console.log(user)
    let obj = JSON.parse(JSON.stringify(req.body)); //console.log(req.body);
    console.log(obj);
    user.addressDetails.push(obj);
    await user.save();
    res.redirect('/profile');
}

const editAddress = async (req, res) => {
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId);
    let id = req.params;
    id = mongoose.Types.ObjectId(id);
    // console.log(id);
    let obj = JSON.parse(JSON.stringify(req.body));
    await User.findOneAndUpdate({
        $and: [{
            _id: userId
        }, {
            'addressDetails._id': id
        }]
    }, {
        $set: {
            'addressDetails.$': obj
        }
    })
    res.redirect('/profile');
}

const deleteAddress = async (req, res) => {
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId);
    let addressId = req.body.addressid;
    addressId = mongoose.Types.ObjectId(addressId);
    console.log(addressId);
    await User.updateOne({
        _id: userId
    }, {
        $pull: {
            "addressDetails": {
                "_id": addressId
            }
        }
    });
    res.send({
        msg: 'hi'
    })
}

const getCategories = async (req, res) => {
    const catId = req.params.id;
    const category = await Category.findById(catId);
    const categories = await Category.find({});
    const products = await Product.find({
        category: category.categoryName
    });
    let userId = req.session.userId;
    userId = mongoose.Types.ObjectId(userId);
    let cartCount = await Cart.aggregate([{
        $match: {
            userId
        }
    }, {
        $project: {
            _id: 0,
            count: {
                $size: "$cartItems"
            }
        }
    }]);
    let wishlistCount = await Wishlist.aggregate([{
        $match: {
            userId
        }
    }, {
        $project: {
            _id: 0,
            count: {
                $size: "$Items"
            }
        }
    }]);
    res.render('user/store', {
        products,
        category,
        categories,
        cartCount,
        wishlistCount
    })
}

module.exports = {
    home,
    registerPage,
    loginPage,
    userRegister,
    otpPage,
    submitLogin,
    logout,
    loginValidate,
    getProfile,
    postProfile,
    getOrders,
    getAddress,
    postNewAddress,
    editAddress,
    deleteAddress,
    getCategories


}