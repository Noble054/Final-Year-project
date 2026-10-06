const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = db.prepare(`
    SELECT complaint_id, category, subject, description, status, created_at, updated_at
    FROM Complaints
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);
  res.json(complaints);
});

const submitComplaint = asyncHandler(async (req, res) => {
  const { category, subject, description } = req.body;
  const categories = ['Charging Station', 'Battery Swap', 'Reservation', 'Payment or Wallet', 'Account', 'Other'];

  if (!categories.includes(category) || typeof subject !== 'string' || subject.trim().length < 3 || subject.length > 150 || typeof description !== 'string' || description.trim().length < 10 || description.length > 2000) {
    throw new AppError('Please provide a valid category, subject, and detailed description.', 400);
  }

  const result = db.prepare(`
    INSERT INTO Complaints (user_id, category, subject, description)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, category, subject.trim(), description.trim());

  res.status(201).json({
    message: 'Complaint submitted successfully.',
    complaint_id: result.lastInsertRowid,
  });
});

module.exports = { getMyComplaints, submitComplaint };
