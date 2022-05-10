const router = require("express").Router();
const bcrypt = require("bcrypt");
const UserModel = require("../models/User.model");

const generateToken = require("../config/jwt.config");
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");
const isAdmin = require("../middlewares/isAdmin");

const saltRounds = 10;
const bankBalance = 500;
router.post("/signup", async (req, res) => {
	try {
		// Primeira coisa: Criptografar a senha!

		const { password } = req.body;

		const randomAccount = Math.floor(Math.random() * 200000);

		const agency = "00001";

		if (!password) {
			return res.status(400).json({
				msg: "Password is required and must have at least 8 characters, uppercase and lowercase letters, numbers and special characters.",
			});
		}

		const salt = await bcrypt.genSalt(saltRounds);
		const passwordHash = await bcrypt.hash(password, salt);

		const createdUser = await UserModel.create({
			...req.body,
			passwordHash: passwordHash,
			account: randomAccount,
			bankAgency: agency,
			bankBalance: bankBalance,
		});

		delete createdUser._doc.passwordHash;

		return res.status(201).json(createdUser);
	} catch (error) {
		console.log(error);
		return res.status(500).json(error);
	}
});

router.post("/login", async (req, res) => {
	try {
		const { account, password } = req.body;

		const user = await UserModel.findOne({ account: account });

		if (!user) {
			return res.status(400).json({ msg: "Wrong password or account." });
		}

		if (await bcrypt.compare(password, user.passwordHash)) {
			delete user._doc.passwordHash;
			const token = generateToken(user);

			return res.status(200).json({
				token: token,
				user: { ...user._doc },
			});
		} else {
			return res.status(400).json({ msg: "Wrong password or account." });
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json(error);
	}
});

router.get("/profile", isAuth, attachCurrentUser, (req, res) => {
	return res.status(200).json(req.currentUser);
});

router.patch("/update-profile", isAuth, attachCurrentUser, async (req, res) => {
	try {
		const loggedInUser = req.currentUser;

		const updatedUser = await UserModel.findOneAndUpdate(
			{ _id: loggedInUser._id },
			{ ...req.body },
			{ runValidators: true, new: true }
		);

		delete updatedUser._doc.passwordHash;

		return res.status(200).json(updatedUser);
	} catch (error) {
		console.log(error);
		return res.status(500).json(error);
	}
});

//SOFT DELETE

router.delete(
	"/disable-profile",
	isAuth,
	attachCurrentUser,
	async (req, res) => {
		try {
			const disabledUser = await UserModel.findOneAndUpdate(
				{ _id: req.currentUser._id },
				{ isActive: false, disabledOn: Date.now() },
				{ runValidators: true, new: true }
			);

			delete disabledUser._doc.passwordHash;

			return res.status(200).json(disabledUser);
		} catch (error) {
			console.log(error);
			return res.status(500).json(error);
		}
	}
);

router.patch("/transfer/", isAuth, attachCurrentUser, async (req, res) => {

  try {
    const loggedInUser = req.currentUser;
    

    const value = req.body.moneyAmount;
    const account = req.body.destinyAcc;
    const destinyAccount = await UserModel.findOne({ account: account })
    


		if ((loggedInUser.bankBalance - value) < 0) {
			return res.status(400).json({ msg: "unauthorized operation" });
		}
		const attUser = await UserModel.findOneAndUpdate(
			{ _id: loggedInUser._id },
			{ bankBalance: loggedInUser.bankBalance - value },
			{ runValidators: true, new: true }
		);
      
    
		const attDestinyUser = await UserModel.findOneAndUpdate(
			{ account: account },
			{ bankBalance: destinyAccount.bankBalance + value },   
			{ runValidators: true, new: true }
		);

		delete attUser._doc.passwordHash;

		return res.status(200).json(attUser);
	} catch (error) {
		console.log(error);
		return res.status(500).json(error);
	}
});

module.exports = router;
