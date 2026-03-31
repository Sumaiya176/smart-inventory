import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// import authRoutes from './routes/auth.routes'
// import staffRoutes from './routes/staff.routes'
// import appointmentRoutes from './routes/appointment.routes'
import { userRoute } from './modules/auth/auth.routes'
import prisma from './prisma/client'
import { categoryRoute } from './modules/category/category.routes'
import { productRoute } from './modules/product/product.routes'

dotenv.config()

const app = express()

const allowedOrigins = ['http://localhost:3000', 'https://appointa.vercel.app'];

const corsOptions = {
  origin: allowedOrigins
};


app.use(cors(corsOptions));
// app.use(cors({
//   origin: "http://localhost:3000"
// }))
app.use(express.json())

// app.use('/auth', authRoutes)
// app.use('/staff', staffRoutes)
// Debug endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConfigured: !!process.env.DATABASE_URL
  })
})
// Add this before your other routes
app.get('/debug', (req, res) => {
  res.json({
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    // Don't send the actual URL in production
  });
});
app.use('/user', userRoute)
app.use('/category', categoryRoute)
app.use('/product', productRoute)
//app.use('/appointments', appointmentRoutes)

app.get('/', (req, res) => {
  res.send('inventory helloo server API running')
})




// async function startServer() {
//   try {
//     // Test the connection
//     await prisma.$connect()
//     console.log('✅ Database connected successfully')
    
//     // Your server startup code
//     app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`)
// })
//   } catch (error) {
//     console.error('❌ Failed to connect to database:', error)
//     process.exit(1)
//   }
// }

async function startServer() {
  try {
    // Log environment status
    console.log('Starting server...')
    console.log('PORT:', process.env.PORT)
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL)
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()