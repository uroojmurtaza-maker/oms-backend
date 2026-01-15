const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {  getTemporarySignedUrl } = require('../../utils/s3SignedUrl.utils');


class AuthService {
  async login(email, password) {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // Token valid for 7 days
    );

    if (user.profilePictureKey) {
      user.profilePictureUrl = await getTemporarySignedUrl(user.profilePictureKey);
    } else {
      user.profilePictureUrl = null;
    }

    // Return  user data + token
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        profileImageUrl: user.profilePictureUrl,
      },
    };
  }

  async updatePassword(currentUserId, oldPassword, newPassword) {
    // Validate inputs
    if (!oldPassword || !oldPassword.trim()) {
      throw new Error('Old password is required');
    }

    if (!newPassword || !newPassword.trim()) {
      throw new Error('New password is required');
    }

    // Find user
    const user = await User.findOne({ where: { id: currentUserId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword.trim(), user.password);
    if (!isOldPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    // Hash and update to new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await user.update({ password: hashedPassword });

    return {
      message: 'Password updated successfully',
      id: currentUserId,
    };
  }

}

module.exports = new AuthService();