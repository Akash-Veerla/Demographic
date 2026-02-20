const mongoose = require('mongoose');

const customInterestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Case-insensitive unique index
customInterestSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('CustomInterest', customInterestSchema);
