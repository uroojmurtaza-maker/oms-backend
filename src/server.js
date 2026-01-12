const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });