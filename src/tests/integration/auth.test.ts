import request from 'supertest';
import { app, container } from '../../app';

describe('Auth integration', () => {
  jest.setTimeout(30000);

  it('register then login', async () => {
    const timestamp = Date.now();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test_${timestamp}@example.com`,
        username: `user_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        password: 'Password123!',
        role: 'student'
      });

    // Require exact 201 Created for successful registration
    expect(reg.status).toBe(201);
    expect(reg.body).toHaveProperty('token');
    expect(reg.body.user).toHaveProperty('id');
    expect(reg.body.user.role).toBe('STUDENT');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `test_${timestamp}@example.com`, password: 'Password123!' });
    
    // Require exact 200 OK for successful login
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
  });

  it('rejects registration with ADMIN role', async () => {
    const timestamp = Date.now();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `admin_${timestamp}@example.com`,
        username: `admin_${timestamp}`,
        firstname: 'Admin',
        lastname: 'Attempt',
        password: 'Password123!',
        role: 'ADMIN'
      });

    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error).toMatch(/Administrator registration is not allowed/i);
  });

  it('supports full password recovery flow (forgot-password, verify-reset-otp, reset-password)', async () => {
    const timestamp = Date.now();
    const email = `forgot_${timestamp}@example.com`;

    // 1. Register a test user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        username: `forgot_${timestamp}`,
        firstname: 'Reset',
        lastname: 'Test',
        password: 'OldPassword123!',
        role: 'student'
      });

    // 2. Trigger forgot-password
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.otp).toBeDefined();

    const otp = forgotRes.body.otp;

    // 3. Verify OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-reset-otp')
      .send({ email, otp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.valid).toBe(true);

    // 4. Reset Password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ email, otp, newPassword: 'NewPassword123!' });
    expect(resetRes.status).toBe(200);

    // 5. Login with new password
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'NewPassword123!' });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.token).toBeDefined();
  });
}); 