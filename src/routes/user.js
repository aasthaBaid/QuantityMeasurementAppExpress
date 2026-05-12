import { Router } from "express"
import { body } from "express-validator"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import auth from "../middleware/auth.js"
import logger from "../middleware/logger.js"
import validator from "../middleware/validator.js"
import User from "../models/user.js"

const router = Router()

router.use(logger)

const createUserRules = [
    body('name').notEmpty().withMessage('Username must not be empty'),
    body('email').isEmail().withMessage('Email entered must be valid'),
    body('phoneNumber').isMobilePhone().withMessage('Phone number entered must be valid'),
    body('password').isStrongPassword().withMessage('Password needs to be stronger')
]

const userLoginRules = [
    body('email').isEmail().withMessage('Email entered must be valid'),
    body('password').isStrongPassword().withMessage('Password needs to be stronger')
]

router.get('/health', (req, res) => {
    res.json({ message : 'users endpoint health check' })
})

router.get('/me', auth, async (req, res) => {
    const user = await User.findByPk(req.user.id)
    res.json(user)
})

router.get('/', async (req, res) => {
    try {
        const users = await User.findAll()
        res.status(200).json(users)
    } catch (err) {
        res.status(500).json({ error : err.message })
    }
})

router.post('/', validator(createUserRules), async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;

        const existing = await User.findOne({ where : { name } })
        if (existing) return res.status(409).json({ error : "Email already in use" })

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({ name, phoneNumber, email, passwordHash })

        const token = jwt.sign({ id : user.id, email : user.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        res.status(201).json({ user, token })
    } catch (err) {
        res.status(500).json({ error : err.message })
    }
})

router.post('/login', validator(userLoginRules), async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where : { email } })
        if (!user) return res.status(404).json({ error : "User not found" })

        const match = await bcrypt.compare(password, user.passwordHash)
        if (!match) return res.status(401).json({ error : "Incorrect password" })

        const token = jwt.sign({ id : user.id, email : user.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        res.status(200).json({ message : "Login successful", token, user })
    } catch (err) {
        res.status(500).json({ error : err.message })
    }
})

export default router