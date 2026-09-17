const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const assignmentSchema = new mongoose.Schema({
  unit: { 
    type: String, 
    required: true 
  },
  module: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  deadline: { 
    type: Date, 
    required: true 
  },
  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
