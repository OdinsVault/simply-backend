
const CompeteQ = require('../models/competeQuestion'),
      User = require('../models/user'),
      { ROUTES, ENV } = require('../resources/constants');

/**
 * Get all compete questions
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getAll = async (req, res) => {
    try {
        const questions = await CompeteQ.find().select('-__v');

        const response = {
            count: questions.length,
            questions: questions.map(q => {
                return {
                    ...q._doc,
                    request: {
                        type: 'GET',
                        url: `${ENV.BASE_URL}/${ROUTES.COMPETEQ}/${q._id}`
                    }
                }
            }),
        };

        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while fetching compete questions',
            error: err
        });
    }
}

/**
 * Get compete questions grouped by category
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getByCategory = async (req, res) => {
    try {
        const questions = await CompeteQ.aggregate([
            { $project: { __v: 0 } },
            { $group: { _id: '$category', questions: { $push: '$$ROOT' } } },
            { $sort: { _id: 1 } }
        ]);

        const response = {
            categoryCount: questions.length,
            categories: questions.map(q => {
                return {
                    category: q._id,
                    questions: q.questions
                }
            })
        };

        if (questions.length === 0)
            return res.status(404).json({message: 'Questions not found!'});

        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while fetching compete questions by category',
            error: err
        });
    }
}

/**
 * Get question by question Id
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getOne = async (req, res) => {
    const id = req.params[ROUTES.QUESTIONID];
    if (!id || id === '') return res.status(400).json({message: 'Question id not present'});

    try {
        const question = await CompeteQ.findById(id).select('-__v');

        if (!question) return res.status(404).json({ message: `No question found for id: ${id}` });

        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while fetching compete question by Id',
            error: err
        });
    }
}

/**
 * Returns the overview for compete questions for the logged in user
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getCompeteOverview = async (req, res) => {
    try {
        const [questionsByCat, user] = await Promise.all([
            CompeteQ.aggregate([
                { $project: { __v: 0 } },
                { $group: { _id: '$category', questions: { $push: '$$ROOT' } } },
                { $sort: { _id: 1 } }
            ]),
            User.findById(req.userData.userId)
        ]);

        if (questionsByCat.length === 0)
            return res.status(404).json({message: 'No questions found!'});
        if (!user)
            return res.status(404).json({message: 'User could not be found!'});

        const response = {
            categoriesCount: questionsByCat.length,
            overview: []
        }

        // loop through the compete question categories
        questionsByCat.forEach(competeQuestionCat => {
            const questionsOfCat = competeQuestionCat.questions;
            const catOverview = {
                category: competeQuestionCat._id,
                questions: questionsOfCat.length,
                completed: 0,
                attemptsOverview: []
            }

            // loop through each question in the specified category
            for (const question of questionsOfCat) {
                // create the user specific question overview
                let questionOverview = {
                    questionId: question._id,
                    title: question.title,
                    difficulty: question.difficulty,
                    pointsAllocated: Number(question.pointsAllocated),
                    attempts: 0,
                    passed: false
                  }
                
                const userAttempt = user._doc.attempts.compete
                        .find(attempt => String(attempt._doc.question._id) === String(question._id));
                
                // populate the question overview if user has an attempt
                if (userAttempt) {
                  questionOverview.attempts = Number(userAttempt._doc.count);
                  questionOverview.passed = userAttempt._doc.passed;
                  if (questionOverview.passed) catOverview.completed++;
                }

                // - else push incomplete overview
                catOverview.attemptsOverview.push(questionOverview);
            }

            response.overview.push(catOverview);
        });

        res.status(200).json(response);
        
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while fetching compete questions overview',
            error: err
        });
    }
}


