const PracticeQ = require("../models/practiceQuestion"),
      User = require('../models/user'),
      Tutorial = require('../models/tutorial'),
      { ROUTES, ENV } = require("../resources/constants");

//Get all questions
exports.get_all = (req, res) => {
  PracticeQ.find()
    .select('-__v')
    .sort('level')
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        questions: docs.map((doc) => {
          return {
            ...doc._doc,
            request: {
              type: "GET",
              url: `${ENV.BASE_URL}/${ROUTES.PRACTICEQ}/${doc._id}`,
            },
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: 'Error occurred while fetching questions!',
        error: err,
      });
    });
};

//get question by level
exports.get_by_level = async (req, res) => {
  try {

    const [questionsByLevel, tutorials] = await Promise.all([
      PracticeQ.aggregate([
        { $unset: '__v' },
        { $group: { _id: '$level', questions: { $push: '$$ROOT' } } },
        { $sort: { _id: 1 } },
      ]),
      Tutorial.find().select('-__v').sort('level')
    ]);

    const response = {
      levelCount: tutorials.length,
      levels: tutorials.map((tutorial, index) => {
        return {
          level: tutorial._doc.level,
          title: tutorial.title,
          questions: questionsByLevel[index]? questionsByLevel[index].questions : []
        };
      }),
    };

    res.status(200).json(response);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error occurred while fetching questions by levels!',
      error: err,
    });
  }
}

// get question levels overview
exports.getLevelsOverview = async (req, res) => {
  try {
    const [questionsByLevel, user, tutorials] = await Promise.all([
      PracticeQ.aggregate([
        { $unset: '__v' },
        { $group: { _id: "$level", questions: { $push: "$$ROOT" } } },
        { $sort: { _id: 1 } },
      ]),
      User.findOne({_id: req.userData.userId}),
      Tutorial.find()
    ]);

    if (questionsByLevel.length === 0)
      return res.status(404).json({message: 'No questions for this level yet!'});
    if (!user)
      return res.status(404).json({message: 'User could not be found'});
    if (tutorials.length === 0)
      return res.status(404).json({message: 'Tutorials could not be found'});

    const response = {
      userLevel: user._doc.completion,
      totalQuestionLevels: questionsByLevel.length,
      overview: null
    }
    
    // for each level, create the overview object
    let overviews = [];

    questionsByLevel.forEach((level, idx) => {
      const questionsOfLevel = level.questions;
      const overview = {
        title: tutorials[idx]._doc.title,
        category: questionsByLevel[idx].questions[0].category,
        level: level._id,
        questions: questionsOfLevel.length,
        completed: 0,
        levelCompleted: false,
      };

      for (const question of questionsOfLevel) {
        const passed = user._doc.attempts.practice.find(attempt => {
          return (String(question._id) === String(attempt._doc.question._id)) && attempt._doc.passed === true;
        });

        if (passed) overview.completed++;
      }

      levelCompleted = questionsOfLevel.length === overview.completed ? true : false;
      overviews.push(overview);
    });

    response.overview = overviews;
    res.status(200).json(response);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error occurred while generating overview for levels',
      error: err
    });
  }
}

// Get user overview for a level in practice
exports.getOverviewOfLevel = async (req, res) => {
  if (!req.params[ROUTES.LEVEL]) return res.status(400).json({message: 'Required parameter not present'});
  try {
    const response = {
      level: parseInt(req.params[ROUTES.LEVEL]),
      title: '',
      attemptsOverview: []
    }

    const [questionsOfLevel, user, tutorial] = await Promise.all([
      PracticeQ.find()
        .select('-testcases -__v')
        .where('level', parseInt(req.params[ROUTES.LEVEL])),
      User.findById(req.userData.userId),
      Tutorial.findOne({level: response.level}).select('title')
    ]);

    if (questionsOfLevel.length === 0)
      return res.status(404).json({message: 'This level does not have any questions yet!'});  
    if (!user) 
    return res.status(404).json({message: 'User could not be found!'});
    if (!tutorial)
        return res.status(404).json({message: 'This level does not have a tutorial yet!'});

    for (const question of questionsOfLevel) {
      let questionOverview = {
        questionId: question._doc._id,
        category: question._doc.category,
        title: question._doc.title,
        difficulty: question._doc.difficulty,
        pointsAllocated: Number(question._doc.pointsAllocated),
        attempts: 0,
        passed: false
      }

      const userAttempt = user._doc.attempts.practice
        .find(attempt => String(attempt._doc.question._id) === String(question._doc._id));
        
      if (userAttempt) {
        questionOverview.attempts = Number(userAttempt._doc.count);
        questionOverview.passed = userAttempt._doc.passed;
      }

      response.attemptsOverview.push(questionOverview);
    }

    response.title = tutorial._doc.title? tutorial._doc.title : '';
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: `Error occurred while generating overview for level ${req.params[ROUTES.LEVEL]}`,
      error: err
    });
  }
}

//Get question by id
exports.get_one = (req, res) => {
  const id = req.params[ROUTES.QUESTIONID];
  PracticeQ.findById(id)
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json(doc);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: 'Error occurred while fetching practice questions by id',
        error: err 
      });
    });
};


