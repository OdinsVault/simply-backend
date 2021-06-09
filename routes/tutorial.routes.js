const TutorialController = require('../controllers/tutorial.controller'),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');


// Tutorial get by level
router.get(
    `/:${ROUTES.LEVEL}`,
    TutorialController.getTutorialByLevel
);

module.exports = router;