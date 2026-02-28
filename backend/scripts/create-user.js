const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function createUser(username, password, role = 'admin') {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
  };

  const configPath = path.join(__dirname, '..', 'config', 'users.json');

  let config = { users: [] };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  config.users.push(user);

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`User created: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Config saved to: ${configPath}`);
}

// Usage: node scripts/create-user.js <username> <password> <role>
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';
const role = process.argv[4] || 'admin';

createUser(username, password, role);
