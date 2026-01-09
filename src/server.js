const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

db.sequelize.sync() // Or .sync({ force: true }) for dev (drops tables!)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB connection error:', err);
  });