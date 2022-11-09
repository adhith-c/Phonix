const express = require('express');

const wishlistController = require("../controller/wishlistController");
const router = express.Router();
router.get('/', wishlistController.getWishlist);
router.get('/addtowishlist/:id', wishlistController.addToWishlist);
// router.post('/addtoexistingcart', cartController.addToExistingCart);
// router.post('/decfromcart', cartController.decrementFromCart);
router.post('/delfromwishlist', wishlistController.deleteFromWishlist);






module.exports = router;