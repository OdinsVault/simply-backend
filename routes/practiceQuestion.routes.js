const PracticeController = require("../controllers/practiceQuestion.controller"),
      checkAuth = require('../middleware/check-auth'),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');

//Get all questions
router.get('/', PracticeController.get_all);

//Get # of levels
router.get(`/${ROUTES.BYLEVEL}`, PracticeController.get_by_level);

// Get user practice questions overview
router.get(
    `/${ROUTES.OVERVIEW}`,
    checkAuth,
    PracticeController.getLevelsOverview);

// Get user practice questions of a level overview
router.get(
    `/${ROUTES.OVERVIEW}/:${ROUTES.LEVEL}`,
    checkAuth,
    PracticeController.getOverviewOfLevel);

//Get question by id
router.get(`/:${ROUTES.QUESTIONID}`, PracticeController.get_one);


module.exports = router;