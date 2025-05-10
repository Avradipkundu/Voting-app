const express = require('express')
const router = express.Router()
const Candidate = require('../models/candidate')
require('dotenv').config()
const { jwtAuthMiddleware, generateToken } = require('../jwt')
const User = require('../models/user')

const checkAdminRole = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (user.role === 'admin') {
      return true
    }    
  } catch (error) {
    return false
  }
}

// POST method of candidate
router.post('/',jwtAuthMiddleware, async (req, res) => {

  try {
    if (! await checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" })

    const data = req.body

    // create a new candidate document using the mongoose model
    const newCandidate = new Candidate(data);

    //save the new candidate to the database
    const response = await newCandidate.save()
    console.log("data saved")

    res.status(200).json({ response: response })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// update method
router.put('/:candidateId',jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" })

    const candidateId = req.params.candidateId  // extract the id from the URL parameter
    const updatedCandidateData = req.body // updated data for the candidate

    const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
      new: true,  // return the updated document
      runValidators: true  // Run Mongoose validation
    })

    if (!response) {
      return res.status(404).json({ error: "candidate not found" })
    }

    console.log("data updated")
    res.status(200).json(response)
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// delete method
router.delete('/:candidateId',jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" })

    const candidateId = req.params.candidateId

    const response = await Person.findByIdAndDelete(candidateId)

    if (!response) {
      return res.status(404).json({ error: "candidate not found" })
    }
    console.log("data deleted")
    res.status(200).json({ message: 'Candidate Deleted Successfully' })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

module.exports = router