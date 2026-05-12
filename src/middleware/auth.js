import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error : 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (err) {
        res.status(400).json({ error : "Invalid or expired token" })
    }
}

export default auth