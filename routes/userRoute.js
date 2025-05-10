const express = require('express')
const router = express.Router()
const User = require('../models/user')
require('dotenv').config()
const { jwtAuthMiddleware, generateToken } = require('../jwt')

// POST method of User
router.post('/signup', async (req, res) => {

  try {
    const data = req.body

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (data.role === 'admin' && existingAdmin){
      return res.status(400).json({ error: 'Admin user already exists' })      
    }
    // create a new user document using the mongoose model
    const newUser = new User(data);

    //save the new user to the database
    const response = await newUser.save()
    console.log("data saved")

    const payLoad = {
      id: response.id      
    }
    console.log(JSON.stringify(payLoad))
    const token = generateToken(payLoad);
    console.log("Token is: ", token);


    res.status(200).json({ response: response, token: token })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// Login Route
router.post('/login', async(req, res) => {
  try {
    // Extract aadharCardNumber and password from request body
    const {aadharCardNumber, password} = req.body

    // Find the user by aadharCardNumber
    const user = await User.findOne({aadharCardNumber: aadharCardNumber})

    // if user does't exist or password does't match, return error
    if(!user || (!await user.comparePassword(password))){
      return res.status(401).json({error: 'Invalid username and password'})
    }
    // generate token
    const payLoad = {
      id: user.id      
    }
    console.log(JSON.stringify(payLoad))
    const token = generateToken(payLoad);
    console.log("Token is: ", token);

    // return token as response
    res.json({ token: token })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" })
  }

})

// Profile route
router.get('/profile', jwtAuthMiddleware, async(req, res) => {
  try {
    const userData = req.user
    console.log("User data: ", userData);
    const userId = userData.id
    const user = await User.findById(userId)

    res.status(200).json({user})
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// update method
router.put('/profile/password',jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id   // extract the id from the token
    const {currentPassword, newPassword} = req.body 

    // Find the user by userId
    const user = await User.findById(userId)

    // if password does't match, return error
    if(!await user.comparePassword(currentPassword)){
      return res.status(401).json({error: 'Invalid password'})
    }

    // update the user's password
    user.password = newPassword
    await user.save()

    console.log("Password updated")
    res.status(200).json({message: 'Password changed successfully'})
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

module.exports = router