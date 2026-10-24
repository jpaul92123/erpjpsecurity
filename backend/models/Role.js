const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: String }] // ej: ['view_users', 'create_user']
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);