import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// import authRoutes from './routes/auth.routes'
// import staffRoutes from './routes/staff.routes'
// import appointmentRoutes from './routes/appointment.routes'
import { userRoute } from './modules/auth/auth.routes'
import prisma from './prisma/client'

dotenv.config()

const app = express()

app.use(cors({
  origin: "http://localhost:3000"
}))
app.use(express.json())

// app.use('/auth', authRoutes)
// app.use('/staff', staffRoutes)
app.use('/user', userRoute)
//app.use('/appointments', appointmentRoutes)

app.get('/', (req, res) => {
  res.send('Smart Queue API running')
})




async function startServer() {
  try {
    // Test the connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Your server startup code
    app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    process.exit(1)
  }
}

startServer()