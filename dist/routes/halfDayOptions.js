"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const HalfDayOption_1 = __importDefault(require("../models/HalfDayOption"));
const router = express_1.default.Router();
router.get('/', async (_req, res) => {
    const options = await HalfDayOption_1.default.find().sort({ code: 1 });
    res.json(options);
});
router.post('/', auth_1.authAdmin, [
    (0, express_validator_1.body)('code').isIn(['morning', 'afternoon', 'evening']).withMessage('Invalid code'),
    (0, express_validator_1.body)('label').notEmpty().withMessage('Label required')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { code, label } = req.body;
    const existing = await HalfDayOption_1.default.findOne({ code });
    if (existing)
        return res.status(400).json({ message: 'Option already exists' });
    const option = new HalfDayOption_1.default({ code, label });
    await option.save();
    res.status(201).json(option);
});
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('label').notEmpty().withMessage('Label required')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const option = await HalfDayOption_1.default.findById(req.params.id);
    if (!option)
        return res.status(404).json({ message: 'Not found' });
    option.label = req.body.label;
    await option.save();
    res.json(option);
});
router.delete('/:id', auth_1.authAdmin, async (req, res) => {
    const option = await HalfDayOption_1.default.findById(req.params.id);
    if (!option)
        return res.status(404).json({ message: 'Not found' });
    await option.deleteOne();
    res.json({ message: 'Deleted' });
});
exports.default = router;
//# sourceMappingURL=halfDayOptions.js.map