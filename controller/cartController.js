const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const swal = require('sweetalert');
const nodemailer = require('nodemailer');

const {
    isLoggedIn,
    isActive
} = require('../middleware');
const asyncErrorCatcher = require('../util/asynErrorCatch');
const Cart = require('../model/cart');
const Coupon = require('../model/coupon');
const User = require('../model/user');
const Wishlist = require('../model/wishlist');
const Category = require('../model/category');

const {
    request
} = require('express');
const {
    cloudinary
} = require('../cloudinary');

let total = 0;
let totalAmount;
const getCart = async (req, res) => {
    const categories = await Category.find({});
    const userfind = await User.find({
        _id: req.session.userId
    });
    let id = req.session.userId;
    id = mongoose.Types.ObjectId(id);
    let cart = await Cart.findOne({
        userId: id
    }).populate({
        path: "userId",
        path: "cartItems",
        populate: {
            path: "productId"
        }
    });
    let cartCount = await Cart.aggregate([{
        $match: {
            userId: id
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
            userId: id
        }
    }, {
        $project: {
            count: {
                $size: "$Items"
            }
        }
    }]);
    if (cart) {
        let items = cart.cartItems;
        for (let item of items) {
            total += item.productQuantity * item.productId.price;
        }
        console.log(total);
        totalAmount = total;
        console.log('cart', cart)

        console.log('cart items', items);
        //console.log('cart items prod name:', cart.cartItems.productId)
        console.log('cart details', cart);
        res.render('user/cart', {
            items,
            cartCount,
            wishlistCount,
            categories
        });
    } else {
        res.render('user/cart', {
            items: '',
            cartCount,
            wishlistCount,
            categories
        });
    }

}
// const getCart = async (req, res) => {
//     // swal("hello world");
//     const userfind = await User.find({
//         _id: req.session.userId
//     });
//     let id = req.session.userId;
//     id = mongoose.Types.ObjectId(id);
//     let cart = await Cart.findOne({
//         userId: id
//     }).populate({
//         path: "userId",
//         path: "cartItems",
//         populate: {
//             path: "productId"
//         }
//     });

//     let items = cart.cartItems;
//     for (let item of items) {
//         total += item.productQuantity * item.productId.price;
//     }
//     console.log(total);
//     totalAmount = total;
//     console.log('cart', cart)

//     console.log('cart items', items);
//     //console.log('cart items prod name:', cart.cartItems.productId)
//     console.log('cart details', cart);
//     res.render('user/cart', {
//         items
//     });
// }

const addToCart = async (req, res) => {
    if (req.session.username) {
        console.log('req.session.username', req.session.username);
        let productId = req.params.id;
        console.log('productid', productId);
        productId = new mongoose.Types.ObjectId(productId);
        let userId = req.session.userId;
        console.log('req.session.userId', req.session.userId);
        let userExist = await Cart.findOne({
            userId
        });
        if (userExist) {

            let productExist = await Cart.findOne({
                $and: [{
                    userId
                }, {
                    cartItems: {
                        $elemMatch: {
                            productId
                        }
                    }
                }]
            });
            if (productExist) {
                //await cartModel.aggregate([{$match:{$and:[{userId},{"cartItems.productId":productId}]}},{$inc:{"cartItems.$.productQuantity":1}}]);
                await Cart.findOneAndUpdate({
                    $and: [{
                        userId
                    }, {
                        "cartItems.productId": productId
                    }]
                }, {
                    $inc: {
                        "cartItems.$.productQuantity": 1
                    }
                });
            } else {
                await Cart.updateOne({
                    userId
                }, {
                    $push: {
                        cartItems: {
                            productId,
                            productQuantity: 1
                        }
                    }
                });
                res.redirect('/cart');
            }
        } else {
            try {
                let cart = new Cart({
                    userId,
                    cartItems: [{
                        productId,
                        productQuantity: 1
                    }]
                });
                await cart.save();
            } catch (err) {
                const msg = 'cart adding failed';
                console.log('cart', cart)
                // res.send({
                //     msg
                // });
            }
        }
        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        // res.send({
        //     cartCount
        // });
    } else {
        const msg = 'please login to continue';
        res.send({
            msg
        });
        return;
    }
}

const addToExistingCart = async (req, res) => {
    if (req.session.username) {
        let productId = req.body.prodid;
        productId = new mongoose.Types.ObjectId(productId);
        let userId = req.session.userId;
        let userExist = await Cart.findOne({
            userId
        });
        if (userExist) {
            let productExist = await Cart.findOne({
                $and: [{
                    userId
                }, {
                    cartItems: {
                        $elemMatch: {
                            productId
                        }
                    }
                }]
            });
            if (productExist) {
                await Cart.findOneAndUpdate({
                    $and: [{
                        userId
                    }, {
                        "cartItems.productId": productId
                    }]
                }, {
                    $inc: {
                        "cartItems.$.productQuantity": 1
                    }
                });
                res.redirect('/user/cart');
            } else {
                await Cart.updateOne({
                    userId
                }, {
                    $push: {
                        cartItems: {
                            productId,
                            productQuantity: 1
                        }
                    }
                });
                //res.redirect('/user/cart');
                res.send({
                    msg: 'hi'
                });
            }
        } else {
            let cart = new Cart({
                userId,
                cartItems: [{
                    productId,
                    productQuantity: 1
                }]
            });
            // cart.bill += quantity * price;
            try {
                await cart.save();
            } catch (err) {
                const msg = 'cart adding failed';
                console.log('cart', cart)
                res.send({
                    msg
                });
            }
        }
        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        // res.send({
        //     cartCount
        // });
    } else {
        const msg = 'please login to continue';
        res.send({
            msg
        });
        return;
    }
}

const decrementFromCart = async (req, res) => {

    // if (req.session.username) {
    //     let productId = req.body.prodid;
    //     console.log('decrement prodid is', productId);
    //     productId = mongoose.Types.ObjectId(productId);
    //     console.log('decrement prodid is', productId);

    //     let userId = req.session.userId;
    //     userId = mongoose.Types.ObjectId(userId);
    //     console.log('decrement userid is', userId);
    //     let userExist = await Cart.findOne({
    //         userId
    //     });
    //     console.log('user xsist', userExist);
    //     if (userExist) {

    //         let productExist = await Cart.findOne({
    //             $and: [{
    //                 userId
    //             }, {
    //                 cartItems: {
    //                     $elemMatch: {
    //                         productId
    //                     }
    //                 }
    //             }]
    //         });
    //         console.log('prdct xsist ', productExist);
    //         if (productExist) {
    //             await Cart.findOneAndUpdate({
    //                 $and: [{
    //                     userId
    //                 }, {
    //                     "cartItems.productId": productId
    //                 }]
    //             }, {
    //                 $inc: {
    //                     "cartItems.$.productQuantity": -1
    //                 }
    //             });
    //             let cart = await Cart.findOne({
    //                 userId
    //             });
    //             console.log('after decrement ', cart);

    //         } else {
    //             // await Cart.updateOne({
    //             //     userId
    //             // }, {
    //             //     $push: {
    //             //         cartItems: {
    //             //             productId,
    //             //             productQuantity: 1
    //             //         }
    //             //     }
    //             // });
    //             console.log('error vaneee');
    //         }
    //     } else {
    //         const msg = 'Item failed to find';
    //         res.send({
    //             msg
    //         });
    //         return;
    //     }
    //     let cartCount = await Cart.aggregate([{
    //         $match: {
    //             userId
    //         }
    //     }, {
    //         $project: {
    //             count: {
    //                 $size: "$cartItems"
    //             }
    //         }
    //     }]);

    // } else {
    //     const msg = 'please login to continue';
    //     res.send({
    //         msg
    //     });
    //     return;
    // }
    if (req.session.username) {
        let productId = req.body.prodid;
        console.log('decrement prodid is', productId);
        productId = mongoose.Types.ObjectId(productId);
        console.log('decrement prodid is', productId);

        let userId = req.session.userId;
        userId = mongoose.Types.ObjectId(userId);
        console.log('decrement userid is', userId);
        // let userExist = await Cart.findOne({
        //     userId
        // });



        //  let productExist = await Cart.findOne({
        //      $and: [{
        //          userId
        //      }, {
        //          cartItems: {
        //              $elemMatch: {
        //                  productId
        //              }
        //          }
        //      }]
        //  });


        await Cart.findOneAndUpdate({
            $and: [{
                userId
            }, {
                "cartItems": {
                    $elemMatch: {
                        productId
                    }
                }
            }, {
                "cartItems.productId": productId
            }]
        }, {
            $inc: {
                "cartItems.$.productQuantity": -1
            }
        });
        // let cart = await Cart.findOne({
        //     userId
        // });
        // console.log('after decrement ', cart);

        let cartCount = await Cart.aggregate([{
            $match: {
                userId
            }
        }, {
            $project: {
                count: {
                    $size: "$cartItems"
                }
            }
        }]);
        res.send({
            cartCount
        });



    } else {
        const msg = 'please login to continue';
        res.send({
            msg
        });
        return;
    }
}


const deleteFromCart = async (req, res) => {
    const productId = req.body.prodid;
    console.log('productid', productId);
    const userId = req.session.userId;
    console.log('userid', userId);
    await Cart.updateOne({
        userId
    }, {
        $pull: {
            "cartItems": {
                "productId": productId
            }
        }
    });
    let cartCount = await Cart.aggregate([{
        $match: {
            userId
        }
    }, {
        $project: {
            count: {
                $size: "$cartItems"
            }
        }
    }]);
    res.send({
        cartCount
    });

}

const checkCoupon = async (req, res) => {
    let obj = JSON.parse(JSON.stringify(req.body));
    console.log(obj)
    let {
        couponName,
        subTotal,
        grandTotal
    } = obj;
    // const totalAmount = subTotal;
    const coupon = await Coupon.findOne({
        couponName
    })
    // console.log(coupon)
    if (coupon) {
        let discount = coupon.discount;
        let reduce = subTotal * discount / 100;
        console.log('reduce', reduce);
        if (reduce > coupon.maxLimit) {
            grandTotal -= coupon.maxLimit;
            reduce = coupon.maxLimit;
        } else {
            grandTotal -= reduce;
        }
        // const final = total;
        //console.log('total' + total);
        //total = totalAmount;
        res.send({
            reduce,
            grandTotal
        })
    } else {
        res.send({
            reduce: 0,
            grandTotal: parseInt(subTotal)
        })
    }

}



module.exports = {
    getCart,
    addToCart,
    addToExistingCart,
    decrementFromCart,
    deleteFromCart,
    checkCoupon


}