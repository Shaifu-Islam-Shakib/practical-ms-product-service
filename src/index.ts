import morgan from 'morgan';
import cors from 'cors';
import express from 'express'
import dotenv from 'dotenv'
import mainRoute from './routes/main.ts'
dotenv.config({ path: '.env' })
const app = express()
app.use(express.json())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }));
app.use(mainRoute)

const port = process.env.PORT || 4003
const service = process.env.SERVICE_NAME
app.listen(port, () => {
  console.log(`${service} running at ${port}`);
})