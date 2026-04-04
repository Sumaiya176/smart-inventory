import prisma from "../../prisma/client"
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Secret } from 'jsonwebtoken';
import { log } from "node:console";

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
};

const createUser = async (data : any) => {
   const { email, password, name } = data;

    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already registered');  
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (default role is VIEWER for new signups)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'VIEWER',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken(user);

    // Log activity
    // await prisma.activityLog.create({
    //   data: {
    //     action: `New user ${user.email} registered`,
    //     actionType: 'USER_CREATED',
    //     entityType: 'USER',
    //     entityId: user.id,
    //     metadata: { role: user.role }
    //   }
    // });
    return {user, token}
}
const loginUser = async (data : any) => {
   const { email, password } = data;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    console.log("token", token)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `User ${user.email} logged in`,
        actionType: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: { role: user.role }
      }
    });

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
    return {userData, token}
}




export const userServices  = {
    createUser,
    loginUser
}