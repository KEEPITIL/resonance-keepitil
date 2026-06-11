const router = require('express').Router();
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const {
  getDJs, getDJBySlug, getMyProfile,
  createDJProfile, updateDJProfile, updateTheme, addWidget, removeWidget,
} = require('../controllers/djController');
const { profilePhotoUpload, bannerUpload, logoUpload, galleryUpload } = require('../services/s3Service');

router.get('/', optionalAuth, getDJs);
router.get('/me', protect, restrictTo('dj'), getMyProfile);
router.get('/:slug', optionalAuth, getDJBySlug);

router.post('/', protect, restrictTo('dj'), createDJProfile);
router.patch('/me', protect, restrictTo('dj'), updateDJProfile);
router.patch('/me/theme', protect, restrictTo('dj'), updateTheme);
router.post('/me/widgets', protect, restrictTo('dj'), addWidget);
router.delete('/me/widgets/:widgetId', protect, restrictTo('dj'), removeWidget);

// File uploads
router.post('/me/photo', protect, restrictTo('dj'), profilePhotoUpload.single('photo'), async (req, res) => {
  const DJProfile = require('../models/DJProfile');
  const dj = await DJProfile.findOneAndUpdate({ user: req.user._id }, { profilePhoto: req.file.location }, { new: true });
  res.json({ success: true, url: req.file.location, data: dj });
});

router.post('/me/banner', protect, restrictTo('dj'), bannerUpload.single('banner'), async (req, res) => {
  const DJProfile = require('../models/DJProfile');
  const dj = await DJProfile.findOneAndUpdate({ user: req.user._id }, { bannerImage: req.file.location }, { new: true });
  res.json({ success: true, url: req.file.location, data: dj });
});

router.post('/me/logo', protect, restrictTo('dj'), logoUpload.single('logo'), async (req, res) => {
  const DJProfile = require('../models/DJProfile');
  const dj = await DJProfile.findOneAndUpdate({ user: req.user._id }, { logoImage: req.file.location }, { new: true });
  res.json({ success: true, url: req.file.location, data: dj });
});

router.post('/me/gallery', protect, restrictTo('dj'), galleryUpload.array('images', 10), async (req, res) => {
  const DJProfile = require('../models/DJProfile');
  const urls = req.files.map((f) => f.location);
  const dj = await DJProfile.findOneAndUpdate({ user: req.user._id }, { $push: { galleryImages: { $each: urls } } }, { new: true });
  res.json({ success: true, urls, data: dj });
});

module.exports = router;
