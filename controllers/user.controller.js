const User = require("../models/user");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ROUTES, XP, ROLE, ENV } = require("../resources/constants");

//Signup User
exports.signup = async (req, res) => {
  const requiredProps = ['fname', 'lname', 'email', 'password', 'dob', 'institute'];

  // if not all required keys present, throw error
  const noAllProps = requiredProps.some(prop => !Object.keys(req.body).includes(prop));
  if (noAllProps) 
    return res.status(400).json({message: 'Some of the required properties are missing'});

  // if all required props present, try to create user with any optional props
  const optionalProps = ['xp'];
  const userObj = {};
  for (const [key, val] of Object.entries(req.body)) {
    if ([...requiredProps, ...optionalProps].includes(key)) {
      userObj[key] = val;
    }
  }
  
  // convert to necessary types
  userObj.dob = new Date(userObj.dob);
  if (userObj.xp) userObj.xp = Object.values(XP).find(xp => userObj.xp === xp) || XP.BEGINNER;

  try {
    // hash password
    userObj.password = await bcrypt.hash(userObj.password, 10);

    // save user
    const created = await new User({
      _id: new mongoose.Types.ObjectId(),
      ...userObj
    }).save({validateBeforeSave: true});

    // remove unnecessary fields
    delete created._doc.password;
    delete created._doc.__v;

    res.status(201).json({message: 'User created', result: created});

  } catch (err) {
      console.log(err);
      // handle unique index - email
      if (err.code && err.code === 11000) {
        return res.status(409).json({
          message: 'This email is already registered with another account, Please choose another!',
          error: {
            type: 'Duplicate value for unique attribute',
            keyValue: err.keyValue,
          }
        });
      }
      res.status(500).json({message: 'Error occured while saving user', error: err});
  }

};

//Login
exports.login = async (req, res) => {
  // if required params not found return with error
  if (!req.body.email || req.body.email === '' ||
  !req.body.password || req.body.password === '')
    return res.status(400).json({message: 'Required values missing for login'});

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) 
        return res.status(401)
        .json({message: `No user found with the email ${req.body.email}`});

      const passwordOkay = await bcrypt.compare(req.body.password, user._doc.password);
      if (!passwordOkay) 
        return res.status(401).json({message: 'Password is incorrect'});

      const token = jwt.sign(
        {
          email: user.email,
          userId: user._id,
          roles: [ROLE.USER]
        },
        ENV.JWT_KEY,
        { expiresIn: "1h" }
      );
      
      res.status(200).json({
        message: "Authentication successful!",
        token: token,
      });

    } catch (err) {
      console.log(err);
      res.status(401).json({message: 'Authentication falied!', error: err});
    }
}

//Delete own User profile
exports.deleteUser = (req, res) => {
  User.remove({ _id: req.userData.userId })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "User deleted!",
        result
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: 'Error occurred while deleting the profile',
        error: err,
      });
    });
};

/**
 * get user personal profile - populated with completed questions
 * or get only the user profile.
 * 
 * Provide query parameter: `populate=true` to get full profile
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getUser = async (req, res) => {
  const isPopulate = Boolean(req.query.populate || false);

  let query = User.findOne({_id: req.userData.userId}, '-__v -password');

  try {
    let user;

    if (isPopulate) {
      user = await query
        .populate({
            path: 'attempts.practice',
            populate: [{ path: 'question', select: '-__v' }]
        })
        .populate({
            path: 'attempts.compete',
            populate: [{ path: 'question', select: '-__v' }]
        });
    } else {
      user = await query;
    }

    if (!user) return res.status(404).json({message: 'User not found'});

    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({message: 'Error occured while fetching user data', error: err});
  }
};

/**
 * Edit the logged in user personal details
 * @param {Request} req 
 * @param {Response} res 
 */
exports.editUser = async (req, res) => {
  if (!req.body) return res.status(400).json({message: 'No update body present'});
  // remove unnecessary fields from update
  delete req.body.attempts;
  delete req.body.score;
  delete req.body.completion;

  // create the update object
  let userUpdate = {}
  const updatableKeys = ['fname', 'lname', 'email', 'password', 'dob', 'institute', 'xp'];

  for (const [key, val] of Object.entries(req.body)) {
    if (updatableKeys.includes(key)) {
      userUpdate[key] = val;
    }
  }
  // convert to necessary types
  if (userUpdate.dob) userUpdate.dob = new Date(userUpdate.dob);
  if (userUpdate.xp) userUpdate.xp = Object.values(XP).find(xp => userUpdate.xp === xp) || XP.BEGINNER;

  try {
    // hash password if password changed
    if (userUpdate.password) {
      const hashed = await bcrypt.hash(userUpdate.password, 10);
      userUpdate.password = hashed;
    }

    const updatedUser = await User
      .findOneAndUpdate({ _id: req.userData.userId }, userUpdate, { new: true })
      .select('-__v -password');

    if (!updatedUser) return res.status(404).json({message: 'User not found'});

    res.status(200).json({message: 'User updated', result: updatedUser});
  } catch (err) {
      console.log(err);
      // handle unique index - email
      if (err.codeName && err.codeName === 'DuplicateKey') {
        return res.status(409).json({
          message: 'This email is registered with another account!',
          error: {
            type: 'Duplicate value for unique attribute',
            keyValue: err.keyValue,
          }
        });
      }
      res.status(500).json({message: 'Error occured while updating user', error: err});
  }
}

/**
 * search users on `fname||lname||email` 
 * autocomplete results limit 10
 * 
 * Provide the search string in query parameter: `search=<searchStr>`
 * @param {Request} req 
 * @param {Response} res 
 */
exports.autocompleteUser = async (req, res) => {
  if (!req.query.search) return res.status(400).json({message: 'Search query is not present'});

  try {
    const results = await User.aggregate([
      {
        $search: {
          index: 'users-search',
          compound: {
            should: [
              {
                autocomplete: {
                query: req.query.search,
                path: "fname",
                fuzzy: {
                    maxEdits: 2,
                    prefixLength: 2
                  }
                }
              },
              {
                autocomplete: {
                query: req.query.search,
                path: "lname",
                fuzzy: {
                    maxEdits: 2,
                    prefixLength: 2
                  }
                }
              },
              {
                autocomplete: {
                query: req.query.search,
                path: "email",
                fuzzy: {
                    maxEdits: 2,
                    prefixLength: 2
                  }
                }
              },
            ]
          }
        }
      },
      { $limit: 10 },
      { $project: { _id: 1, fname: 1, lname: 1, email: 1 } }
    ]);

    const response = {
      search: req.query.search,
      results
    }

    res.status(200).json(response);

  } catch (err) {
    console.log(err);
      res.status(500).json({
        message: 'Error occurred while getting search results',
        error: err,
      });
  }
}

/**
 * Get performance details of the user
 * specified in path variable: /:userId
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getPeformance = async (req, res) => {
  if (!req.params[ROUTES.USERID]) return res.status(400).json({message: 'User id not presented'});

  try {
    const user = await User.aggregate([
      {$project: { _id: 1, score: 1, completion: 1 }},
      {$sort: { score: -1 }},
      {$group: { _id: '', ranked: { $push: '$$ROOT'} }},
      {$unwind: { path: '$ranked', includeArrayIndex: 'rank' }},
      { $project: {
          _id: '$ranked._id',
          score: '$ranked.score',
          completion: '$ranked.completion',
          rank: 1 } },
      {$match: { _id: mongoose.Types.ObjectId(req.params[ROUTES.USERID]) }},
    ]);

    if (user.length === 0) return res.status(404).json({message: 'User not found'});

    user[0].rank++;
    return res.status(200).json(user[0]);

  } catch (err) {
    console.log(err);
      res.status(500).json({
        message: 'Error occurred while getting performance details',
        error: err,
      });
  }
};
