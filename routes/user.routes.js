const UserController = require("../controllers/user.controller"),
      checkAuth = require('../middleware/check-auth'),
      router = require('express').Router(),
      {ROUTES} = require('../resources/constants');

//signup user
router.post(`/${ROUTES.SIGNUP}`, UserController.signup);

//user login
router.post(`/${ROUTES.LOGIN}`, UserController.login);

//delete own user profile
router.delete(`/`, checkAuth, UserController.deleteUser);

// get logged in user personal profile - completed questions
router.get(`/`, checkAuth, UserController.getUser);

// edit user details
router.put(`/`, checkAuth, UserController.editUser);

// search users on fname/lname/email autocomplete results limit 10
router.get(`/${ROUTES.AUTOCOMPLETE}`, UserController.autocompleteUser);

// user rank & performance details
router.get(`/${ROUTES.PERFORMANCE}/${ROUTES.USERIDPARAM}`, UserController.getPeformance);


module.exports = router;
