import express from 'express';
import { body, validationResult } from 'express-validator';
import { authAdmin } from '../middleware/auth';
import HalfDayOption from '../models/HalfDayOption';

const router = express.Router();

router.get('/', async (_req, res) => {
  const options = await HalfDayOption.find().sort({ code: 1 });
  res.json(options);
});

router.post('/', authAdmin, [
  body('code').isIn(['morning','afternoon','evening']).withMessage('Invalid code'),
  body('label').notEmpty().withMessage('Label required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { code, label } = req.body;
  const existing = await HalfDayOption.findOne({ code });
  if (existing) return res.status(400).json({ message: 'Option already exists' });
  const option = new HalfDayOption({ code, label });
  await option.save();
  res.status(201).json(option);
});

router.put('/:id', authAdmin, [
  body('label').notEmpty().withMessage('Label required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const option = await HalfDayOption.findById(req.params.id);
  if (!option) return res.status(404).json({ message: 'Not found' });
  option.label = req.body.label;
  await option.save();
  res.json(option);
});

router.delete('/:id', authAdmin, async (req, res) => {
  const option = await HalfDayOption.findById(req.params.id);
  if (!option) return res.status(404).json({ message: 'Not found' });
  await option.deleteOne();
  res.json({ message: 'Deleted' });
});

export default router;
