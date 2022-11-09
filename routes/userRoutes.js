const express = require('express');
const passport = require('passport');

const userController = require("../controller/userController");
const brandController = require("../controller/brandController");
const orderController = require("../controller/orderController");
const categoryController = require("../controller/categoryController");

const router = express.Router();
router.get('/', userController.home);
router.get('/register', userController.registerPage);
router.get('/login', userController.loginPage);
router.post('/login', userController.loginValidate, userController.submitLogin);
router.post('/regsendotp', userController.userRegister);
router.post('/otpverify', userController.otpPage);
router.get('/profile', userController.getProfile);
router.post('/profile', userController.postProfile);
router.post('/addnewaddress', userController.postNewAddress);
router.post('/editaddress/:id', userController.editAddress);
router.post('/deleteaddress', userController.deleteAddress);
router.post('/getaddress', userController.getAddress);
router.get('/orders', userController.getOrders);
router.get('/logout', userController.logout);
router.get('/categories/:id', userController.getCategories)
router.get('/brands/:id', brandController.getBrandProductPage);
router.post('/orderitems', orderController.getOrderItems)
router.post('/orderfetch', orderController.getOrderSummary)
router.post('/ordercancel', orderController.cancelOrder)
router.post('/categoryproducts', categoryController.getCategoryProducts)
router.post('/sortname', categoryController.sortCategory)
router.post('/sortprice', categoryController.sortPrice)



module.exports = router;