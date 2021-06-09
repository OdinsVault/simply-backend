
const CompeteController = require('../controllers/competeQuestion.controller'),
      checkAuth = require('../middleware/check-auth'),
      router = require('express').Router(),
      { ROUTES } = require('../resources/constants');

//Get all compete questions
router.get(`/`, CompeteController.getAll);

//Get compete questions by category
router.get(`/${ROUTES.BYCATGEORY}`, CompeteController.getByCategory);

// Get user compete questions overview by categories
router.get(
    `/${ROUTES.OVERVIEW}`,
    checkAuth,
    CompeteController.getCompeteOverview);

// Get by id
router.get(`/:${ROUTES.QUESTIONID}`, CompeteController.getOne);


module.exports = router;