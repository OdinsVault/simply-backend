const LeaderboardController = require("../controllers/leaderboard.controller"),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');

// get the leaderboard with pagination
router.get(`/`, LeaderboardController.rankings);

// filter on score, institute
router.get(`/${ROUTES.FILTER}`, LeaderboardController.filterLeaderboard);

// get distinct institute values for institute filter
router.get(`/${ROUTES.DISTINCTINSTITUTES}`, LeaderboardController.distinctInstitutes);

// get specific user ranking in leaderboard
router.get(`/:${ROUTES.USERID}`, LeaderboardController.getUserRanking);


module.exports = router;