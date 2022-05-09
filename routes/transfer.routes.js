const router = require("express").Router();
const UserModel = require("../models/User.model");
const TransferModel = require("../models/Transfer.model");



const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");




module.exports = router;