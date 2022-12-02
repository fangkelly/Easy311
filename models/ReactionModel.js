const mongoose = require("mongoose");



const ReactionSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    reactions: {
      type: Object,
      required: true
    }
  })
  
  const Reaction = mongoose.model("Reaction", ReactionSchema);

  module.exports = Reaction;