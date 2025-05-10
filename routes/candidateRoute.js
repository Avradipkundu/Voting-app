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
router.post('/', jwtAuthMiddleware, async (req, res) => {

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
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
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
router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) => {
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
}
)

// let's starting voting
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res) => {
  // no admin can vote
  // user can only vote once

  const candidateId = req.params.candidateId
  const userId = req.user.id
  try {
    // find the candidate document with the specified candidateId
    const candidate = await Candidate.findById(candidateId)
    if (!candidate){
      return res.status(404).json({ error: "candidate not found" })
    }

    const user = await User.findById(userId)
    if (!user){
      return res.status(404).json({ error: "user not found" })
    }
    
    if(user.isVoted){
      return res.status(400).json({ message: "you have already voted" })
    }

    if (user.role == 'admin') {
      return res.status(403).json({ message: "admin is not allowed" })
    }

    // update the candidate document to record the vote
    candidate.voters.push({user: userId})
    candidate.voteCount++
    await candidate.save()

    // update the user document
    user.isVoted = true
    await user.save()
    
    res.status(200).json({message: 'vote recorder successfully'})

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// vote count
router.get('/vote/count', async(req, res) => {
  try {
    // find all candidates and sort them by votecount in descending order
    const candidate = await Candidate.find().sort({voteCount: 'desc'})

    // map the candidates to only return their name and vote count
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        vote: data.voteCount
      }
    })

    res.status(200).json(voteRecord)

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

// Get List of all candidates with only name and party fields
router.get('/', async(req, res)=>{
  try {
    const candidates = await Candidate.find({}, 'name party _id')    

    res.status(200).json(candidates)
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" })
  }
})

module.exports = router