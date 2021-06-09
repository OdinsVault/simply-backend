const AdminController = require('../controllers/admin.controller'),
      adminAuth = require('../middleware/check-admin-auth'),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');

// Admin login route
router.post(
    `/${ROUTES.LOGIN}`,
    AdminController.login
);

// Practice question administration
// Create Practice question
router.post(
    `/${ROUTES.PRACTICEQ}`,
    adminAuth,
    AdminController.createPracticeQ);

// Update a practice question
router.patch(
    `/${ROUTES.PRACTICEQ}/:${ROUTES.QUESTIONID}`,
    adminAuth,
    AdminController.updatePracticeQ);

// Delete a practice question
router.delete(
    `/${ROUTES.PRACTICEQ}/:${ROUTES.QUESTIONID}`,
    adminAuth,
    AdminController.deletePracticeQ);

        
// Compete question administration
// Create compete question
router.post(
    `/${ROUTES.COMPETEQ}`,
    adminAuth,
    AdminController.createCompeteQ);

// Update compete question
router.patch(
    `/${ROUTES.COMPETEQ}/:${ROUTES.QUESTIONID}`,
    adminAuth,
    AdminController.updateCompeteQ);

// Delete compete question
router.delete(
    `/${ROUTES.COMPETEQ}/:${ROUTES.QUESTIONID}`,
    adminAuth,
    AdminController.deleteCompeteQ);

// Tutorial administration
// Add tutorial section
router.post(
    `/${ROUTES.TUTORIAL}`,
    adminAuth,
    AdminController.addTutorial);

// Edit tutorial by Id
router.patch(
    `/${ROUTES.TUTORIAL}/:${ROUTES.LEVEL}`,
    adminAuth,
    AdminController.editTutorial);

// Delete tutorial by Id
router.delete(
    `/${ROUTES.TUTORIAL}/:${ROUTES.LEVEL}`,
    adminAuth,
    AdminController.deleteTutorial);

module.exports = router;