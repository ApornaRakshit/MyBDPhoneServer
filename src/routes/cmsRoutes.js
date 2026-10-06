const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const c = require('../controllers/cmsController');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'cms');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path.basename(file.originalname || 'image', ext)
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image';
    cb(null, `${Date.now()}-${base}${ext || '.png'}`);
  },
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.mimetype || '');
    cb(ok ? null : new Error('Only PNG, JPG, WEBP or SVG images are allowed'), ok);
  },
});

const { submitContactInquiry } = require('../controllers/contactController');

router.get('/public/header', c.getPublicHeader);
router.get('/public/footer', c.getPublicFooter);
router.get('/public/contact', c.getPublicContact);
router.post('/public/contact', submitContactInquiry);
router.get('/public/home', c.getPublicHome);
router.get('/public/page', c.getPublicPage);
router.get('/public/page/{*slug}', c.getPublicPage);
router.get('/public/cms-page', c.getPublicPage);
router.get('/public/cms-page/{*slug}', c.getPublicPage);
router.get('/public/collection/:collection', c.getPublicCollection);

router.use('/admin', protect, adminOnly);
router.get('/admin/overview', c.adminOverview);
router.get('/admin/config', c.getAdminConfigs);
router.put('/admin/config/:key', c.updateAdminConfig);
router.get('/admin/pages', c.listPages);
router.post('/admin/pages', c.createPage);
router.put('/admin/pages/:id', c.updatePage);
router.delete('/admin/pages/:id', c.deletePage);
router.put('/admin/pages/:id/toggle', c.togglePage);
router.get('/admin/pages/:pageId/sections', c.listSections);
router.post('/admin/pages/:pageId/sections', c.createSection);
router.get('/admin/sections/:id', c.getSection);
router.put('/admin/sections/:id', c.updateSection);
router.put('/admin/sections/:id/toggle', c.toggleSection);
router.delete('/admin/sections/:id', c.deleteSection);
router.put('/admin/sections/reorder', c.reorderSections);
router.get('/admin/items/:collection', c.listItems);
router.post('/admin/items', c.createItem);
router.put('/admin/items/:id', c.updateItem);
router.put('/admin/items/:id/toggle', c.toggleItem);
router.delete('/admin/items/:id', c.deleteItem);
router.put('/admin/items/reorder', c.reorderItems);
router.get('/admin/media', c.listMedia);
router.post('/admin/media/upload', imageUpload.single('file'), c.uploadMedia);
router.post('/admin/media', c.createMedia);
router.put('/admin/media/:id', c.updateMedia);
router.put('/admin/media/:id/toggle', c.toggleMedia);
router.delete('/admin/media/:id', c.deleteMedia);

module.exports = router;
