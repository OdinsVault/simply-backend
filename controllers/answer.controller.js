const User = require('../models/user'),
      PracticeQ = require('../models/practiceQuestion'),
      CompeteQ = require('../models/competeQuestion'),
      mongoose = require("mongoose"),
      runTests = require('../utils/runTests'),
      runAnswer = require('../utils/runAnswer'),
      {ROUTES} = require('../resources/constants');

/**
 * Runs the base test case before submission of practice question.
 * Does not update the user score, attempts or levels
 * @param {Request} req 
 * @param {Response} res 
 */
exports.runPracticeAnswer = async (req, res) => {
    const id = req.params[ROUTES.QUESTIONID];
    if (!id || id === '') 
        return res.status(400).json({message: 'Question id is not present'});

    try {
        // check if user has already completed the question
        const user = await User.findById(req.userData.userId);
        if (!user) return res.status(404).json({message: 'User not found'});
        // If already answered & passed, return without running tests or updating score
        let questionAttempt = user._doc.attempts.practice
            .find(attempt => String(attempt._doc.question._id) === String(id));
        if (questionAttempt && questionAttempt.passed) 
            return res.status(200).json({message: 'Question already answered correctly'});

        // Get the question 
        const answeredQ = await PracticeQ.findById(id);
        if (!answeredQ) return res.status(404).json({message: 'Question not found'});

        // Check if user is authorized to answer the question - compare user level & question level
        if (user._doc.completion !== answeredQ._doc.level)
            return res.status(401).json({
                message: 'Your level is too low to answer this question',
                status: {
                    requiredLevel: answeredQ._doc.level,
                    userLevel: user._doc.level
                }
            });

        // run the tests & collect the console output to response object
        const output = {
            answer: req.body.answer,
            testResults: null,
            compilerResult: {
                status: 0,
                stdout: null,
                stderr: null
            },
            passed: false
        };

        // Execute the tests & populate the output object
        await runAnswer({
            inputs: answeredQ._doc.inputs,
            outputs: answeredQ._doc.outputs,
            output,
            userId: req.userData.userId,
        });

        const response = {
            message: output.passed? 'Practice question answer run passed':'Practice question answer run failed',
            consoleResult: output,
        };

        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while running answer for practice question',
            error: err
        });
    }
}

/**
 * Handle submission of a practice question answer
 * Run all the test cases, update user score & level
 * @param {Request} req 
 * @param {Response} res 
 * @returns Response
 */
exports.practiceAnswer = async (req, res) => {
    const id = req.params[ROUTES.QUESTIONID];
    if (!id || id === '') 
        return res.status(400).json({message: 'Question id is not present'});
  
    try {
        // check if user has already completed the question
        const user = await User.findById(req.userData.userId);
        if (!user) return res.status(404).json({message: 'User not found'});
        // If already answered & passed, return without running tests or updating score
        let questionAttempt = user._doc.attempts.practice
            .find(attempt => String(attempt._doc.question._id) === String(id));
        if (questionAttempt && questionAttempt.passed) 
            return res.status(200).json({message: 'Question already answered correctly'});

        // Get the question 
        const answeredQ = await PracticeQ.findById(id);
        if (!answeredQ) return res.status(404).json({message: 'Question not found'});

        // Check if user is authorized to answer the question - compare user level & question level
        if (user._doc.completion !== answeredQ._doc.level)
            return res.status(401).json({
                message: 'User\'s level is too low to answer this question',
                status: {
                    requiredLevel: answeredQ._doc.level,
                    userLevel: user._doc.level
                }
            });

        // run the tests & collect the console output to response object
        const output = {
            answer: req.body.answer,
            testResults: [],
            compilerResult: {
                status: 0,
                stdout: null,
                stderr: null
            },
            passed: false
        };

        // Execute the tests & populate the output object
        await runTests(answeredQ._doc.testcases, output, req.userData.userId);

        const response = {
            message: output.passed? 'Practice question answer passed':'Practice question answer failed',
            consoleResult: output,
            updatedUser: null,
            levelInfo: {
                leveledUp: false,
                completion: 0,
            },
        }

        // if the question is previously attempted, increase the attempt count & update the passed status
        // if not attempted, add new attempt of this question with passed status

        let updateObj = {};
        if (output.passed) { // update the user score only if all tests are passed
            updateObj['$inc'] = { score: answeredQ._doc.pointsAllocated };
        }
        let userUpdateQuery;
        if (questionAttempt) { // already attempted - update the attempt props
            questionAttempt.passed = output.passed;
            questionAttempt.count++;

            updateObj['$set'] = {'attempts.practice.$[attempt]': questionAttempt};

            userUpdateQuery = User
                .findOneAndUpdate(
                    {_id: req.userData.userId},
                    updateObj,
                    {
                        arrayFilters: [ // filter the attempts array to find attempt of this question
                            {'attempt._id': mongoose.Types.ObjectId(questionAttempt._doc._id)},
                        ],
                        new: true, useFindAndModify: true
                    });
        } else { // add new attempt of this question
            questionAttempt = {
                question: id,
                passed: output.passed,
                count: 1
            };
            updateObj['$push'] = {'attempts.practice': questionAttempt}; // push the new attempt object
            userUpdateQuery = User
                .findOneAndUpdate(
                    {_id: req.userData.userId},
                    updateObj,
                    {new: true, useFindAndModify: true});
        }

        let updatedUser = await userUpdateQuery.select('-__v -dob -password'); // execute the user update

        if (!updatedUser) return res.status(404).json({message: 'User not found'});

        // check & update the user level
        // get the questionIds grouped by level
        const questionByLevels =  await PracticeQ.aggregate([
            { $project: { level: 1, _id: 1 } },
            { $group: { _id: "$level", questions: { $push: "$$ROOT._id" } } },
            { $sort: { _id: 1 } },
          ]);

        // if all passed for current level, increment the level & add level completion badge
        const questionsOfLevel = questionByLevels[updatedUser._doc.completion].questions;
        const levelCompleted = questionsOfLevel
                .every(qId => {
                    return updatedUser._doc.attempts.practice.find(attempt => {
                        return (String(qId) === String(attempt._doc.question._id)) && attempt._doc.passed === true;
                    });
                });

        if (levelCompleted) {
            // increment user completion 
            // TODO: add the badge
            updatedUser = await User
                .findOneAndUpdate(
                    {_id: req.userData.userId},
                    {
                        $inc: { completion: 1 },
                    },
                    {new: true, useFindAndModify: true}).select('-__v -dob -password');
            // set the response object level props
            response.levelInfo.leveledUp = true;
        }

        // update the response obj
        response.levelInfo.completion = updatedUser._doc.completion;
        response.updatedUser = updatedUser;
    
        res.status(200).json(response);
  
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while processing answer for practice question',
            error: err
        });
    }
}

/**
 * Runs the base test case before submission of Compete question.
 * Does not update the user score, attempts or levels
 * @param {Request} req 
 * @param {Response} res 
 */
 exports.runCompeteAnswer = async (req, res) => {
    const id = req.params[ROUTES.QUESTIONID];
    if (!id || id === '') 
        return res.status(400).json({message: 'Question id is not present'});

    try {
        // check if user has already completed the question
        const user = await User.findById(req.userData.userId);
        if (!user) return res.status(404).json({message: 'User not found'});
        // If already answered & passed, return without running tests or updating score
        let questionAttempt = user._doc.attempts.compete
            .find(attempt => String(attempt._doc.question._id) === String(id));
        if (questionAttempt && questionAttempt.passed) 
            return res.status(200).json({message: 'Question already answered correctly'});

        // Get the question 
        const answeredQ = await CompeteQ.findById(id);
        if (!answeredQ) return res.status(404).json({message: 'Question not found'});

        // run the tests & collect the console output to response object
        const output = {
            answer: req.body.answer,
            testResults: null,
            compilerResult: {
                status: 0,
                stdout: null,
                stderr: null
            },
            passed: false
        };

        // Execute the tests & populate the output object
        await runAnswer({
            inputs: answeredQ._doc.inputs,
            outputs: answeredQ._doc.outputs,
            output,
            userId: req.userData.userId,
        });

        const response = {
            message: output.passed? 'Compete question answer run passed':'Compete question answer run failed',
            consoleResult: output,
        };

        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while running answer for compete question',
            error: err
        });
    }
}

/**
 * Handle submission of a compete question answer
 * Run all the test cases, update user score
 * @param {Request} req 
 * @param {Response} res 
 * @returns Response
 */
exports.competeAnswer = async (req, res) => {
    // proceeed only if the question id is present
    const id = req.params[ROUTES.QUESTIONID];
    if (!id || id === '') 
        return res.status(400).json({message: 'Question id is not present'});

    try {
        // check if user has already completed the question
        const user = await User.findById(req.userData.userId);
        if (!user) return res.status(404).json({message: 'User not found'});
        // If already answered & passed, return without running tests or updating score
        let questionAttempt = user._doc.attempts.compete
            .find(attempt => String(attempt._doc.question._id) === String(id));

        if (questionAttempt && questionAttempt.passed) 
            return res.status(200).json({message: 'Question already answered correctly'});

        // Get the question 
        const answeredQ = await CompeteQ.findById(id);
        if (!answeredQ) return res.status(404).json({message: 'Question not found'});

        // run the tests & collect the console output to response object
        const output = {
            answer: req.body.answer,
            testResults: [],
            compilerResult: {
                status: 0,
                stdout: null,
                stderr: null
            },
            passed: false
        };

        // Execute the tests & populate the output object
        await runTests(answeredQ._doc.testcases, output, req.userData.userId);

        const response = {
            message: output.passed? 'Compete question answer passed':'Compete question answer failed',
            consoleResult: output,
            updatedUser: null,
        }

        // if the question is previously attempted, increase the attempt count & update the passed status
        // if not attempted, add new attempt of this question with passed status

        let updateObj = {};
        if (output.passed) { // update the user score only if all tests are passed
            updateObj['$inc'] = { score: answeredQ._doc.pointsAllocated };
        }
        let userUpdateQuery;
        if (questionAttempt) { // already attempted - update the attempt props
            questionAttempt.passed = output.passed;
            questionAttempt.count++;

            updateObj['$set'] = {'attempts.compete.$[attempt]': questionAttempt};

            userUpdateQuery = User
                .findOneAndUpdate(
                    {_id: req.userData.userId},
                    updateObj,
                    {
                        arrayFilters: [ // filter the attempts array to find attempt of this question
                            {'attempt._id': mongoose.Types.ObjectId(questionAttempt._doc._id)},
                        ],
                        new: true, useFindAndModify: true
                    });
        } else { // add new attempt of this question
            questionAttempt = {
                question: id,
                passed: output.passed,
                count: 1
            };
            updateObj['$push'] = {'attempts.compete': questionAttempt}; // push the new attempt object
            userUpdateQuery = User
                .findOneAndUpdate(
                    {_id: req.userData.userId},
                    updateObj,
                    {new: true, useFindAndModify: true});
        }

        let updatedUser = await userUpdateQuery.select('-__v -dob -password'); // execute the user update

        if (!updatedUser) return res.status(404).json({message: 'User not found'});

        // update the response obj
        response.updatedUser = updatedUser;
    
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error occurred while processing answer for compete question',
            error: err
        });
    }
}
