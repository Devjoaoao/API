const mongoose = require('mongoose');

const User = mongoose.model('User', {
    name: String,
    email: String,
    password: String,
    approved: { type: Boolean, default: false }, // Novo campo para aprovação do usuário
});

module.exports = User;
