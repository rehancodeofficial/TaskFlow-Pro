import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { comparePassword, createSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    await createSession(user.id);

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    return handleApiError(error);
  }
}
