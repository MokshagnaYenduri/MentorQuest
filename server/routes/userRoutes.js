const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createNote, getNotes, updateNote, deleteNote } = require('../controllers/userController');


router.get('/', protect, getNotes);


router.post('/', protect, createNote);

router.put('/:id', protect, updateNote);

router.delete('/:id', protect, deleteNote);

module.exports = router;