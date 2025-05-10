const mongoose = require('mongoose');
// const bcrypt = require('bcrypt')

// define the candidate schema
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    party: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    voters: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            votedAt: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    voteCount: {
        type: Number,
        default: 0
    }
});

const Candidate = mongoose.model('Candidate', candidateSchema)
module.exports = Candidate