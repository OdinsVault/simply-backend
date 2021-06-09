const Tutorial = require("../models/tutorial"),
      {ROUTES} = require('../resources/constants');

/**
 * Returns the tutorial found by the level.
 * Level is unique for each tutorial.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.getTutorialByLevel = async (req, res) => {
    // check id param
    const tutorialLevel = parseInt(req.params[ROUTES.LEVEL]);
    if (!tutorialLevel || tutorialLevel === '')
        return res.status(400).json({message: 'Tutorial level is not present'});

    try {
        const [tutorialsCount, tutorial] = await Promise.all([
            Tutorial.countDocuments({}),
            Tutorial.findOne({level: tutorialLevel}).select('-__v')
        ]);

        // find & send the tutorial data if found
        if (!tutorial) 
            return res.status(404).json({message: `No tutorial found for level: ${tutorialLevel}`});

        const response = {
            totalTutorialsCount: tutorialsCount,
            previousTutorialLevel: tutorialLevel === 1? null : tutorialLevel - 1,
            nextTutorialLevel: tutorialLevel === tutorialsCount? null : tutorialLevel + 1,
            tutorial
        };

        res.status(200).json(response);

    } catch (err) {
        res.status(500).json({
            message: 'Error occurred while getting tutorial level',
            error: err
        });
    }
}