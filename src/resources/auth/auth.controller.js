const authService = require('./auth.service');

const login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await authService.login(email, password);
    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};


const logout = (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};

module.exports = { login, logout };