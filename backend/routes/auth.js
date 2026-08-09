const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.js")
const authMiddleware = require("../middleware/authenticate.js")

router.post('/signup',authController.signup)
router.post('/login',authController.login)
router.get('/me',authMiddleware.isAuthenticated,authController.getCurrentUser)

module.exports = router

