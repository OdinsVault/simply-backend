const AnswerController = require("../controllers/answer.controller"),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');

// Run answer for practice question
// Does not update the user score, attempts or level
router.post(
    `/${ROUTES.PRACTICERUN}/:${ROUTES.QUESTIONID}`,
    AnswerController.runPracticeAnswer
);

// Answer practice question
// Updates the user score, attempts & level
router.post(
    `/${ROUTES.PRACTICEANSWER}/:${ROUTES.QUESTIONID}`,
    AnswerController.practiceAnswer
);

// Run answer for compete question
// Does not update the user score, attempts or level
router.post(
    `/${ROUTES.COMPETERUN}/:${ROUTES.QUESTIONID}`,
    AnswerController.runCompeteAnswer
);

// Answer compete question 
// Updates the user score, attempts & level
router.post(
    `/${ROUTES.COMPETEANSWER}/:${ROUTES.QUESTIONID}`,
    AnswerController.competeAnswer
);


module.exports = router;
