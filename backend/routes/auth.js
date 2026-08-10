const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.js")
const authMiddleware = require("../middleware/authenticate.js")
const { upload } = require("../middleware/cloudinary.js")

router.post('/signup',authController.signup)
router.post('/login',authController.login)
router.post('/logout',authMiddleware.isAuthenticated,authController.logout)
router.get('/me',authMiddleware.isAuthenticated,authController.getCurrentUser)
router.get('/user/:id',authMiddleware.isAuthenticated,authController.getUserById)
router.post('/upload',authMiddleware.isAuthenticated, upload.single('file'), authController.uploadFile)
router.put('/profile',authMiddleware.isAuthenticated, authController.updateProfile)

module.exports = router

