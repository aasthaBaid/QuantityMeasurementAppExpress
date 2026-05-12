import http from 'http'

const logger = (req, res, next) => {
    const [date, rawTime] = new Date().toISOString().split('T')
    const time = rawTime.split('.')[0]

    const status = `${res.statusCode} ${http.STATUS_CODES[res.statusCode]}`
    console.log(`[${date} ${time}] ${req.method} ${req.originalUrl} - ${status}`)

    next()
}

export default logger