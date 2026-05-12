import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import logger from './middleware/logger.js'
import sequelize from './db/sequelize.js'
import userRouter from './routes/user.js'
import conversionsRouter from './routes/conversions.js'

const app = express()
const PORT = 3000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const openApiSpecPath = path.join(__dirname, '../openapi.yaml')

app.use(express.json())

app.get('/openapi.yaml', (req, res) => {
        res.type('text/yaml').sendFile(openApiSpecPath)
})

app.get('/api-docs', (req, res) => {
        res.type('html').send(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>QTYM API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
        <style>
            html, body { margin: 0; padding: 0; height: 100%; background: #fafafa; }
            #swagger-ui { height: 100%; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
        <script>
            window.addEventListener('load', () => {
                window.ui = SwaggerUIBundle({
                    url: '/openapi.yaml',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                    layout: 'BaseLayout'
                });
            });
        </script>
    </body>
</html>`)
})

app.use('/api/v1/user', userRouter)
app.use('/api/v1/conversions', conversionsRouter)
app.use(logger)

try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: true })
    console.log("db connected")
} catch (err) {
    console.error("connection failed: ", err)
}

app.get('/', (req, res) => {
    res.json({ message : "Hello world" })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})