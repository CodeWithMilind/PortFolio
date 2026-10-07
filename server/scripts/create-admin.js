const bcrypt = require('bcryptjs');
const readline = require('readline');
const { db } = require('../src/config/database');

function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askSecret(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.stdin;
    const stdout = process.stdout;

    const wasRaw = typeof stdin.isTTY === 'boolean' && stdin.isTTY && stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      stdout.write(question);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    let value = '';

    const handler = (chunk) => {
      const char = chunk.toString();
      if (char === '\r' || char === '\n') {
        stdout.write('\n');
        stdin.removeListener('data', handler);
        stdin.setRawMode(wasRaw);
        rl.close();
        resolve(value);
        return;
      }

      if (char === '\u0003') {
        stdout.write('\n');
        stdin.removeListener('data', handler);
        stdin.setRawMode(wasRaw);
        rl.close();
        resolve('');
        return;
      }

      if (char === '\u007f' || char === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      value += char;
      stdout.write('*');
    };

    stdin.on('data', handler);
  });
}

async function createAdminUser(username, password) {
  if (!username || !password) {
    throw new Error('Both username and password are required.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  db.prepare(`INSERT INTO admin_users (username, password_hash) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP`).run(username, passwordHash);
  return db.prepare('SELECT id, username FROM admin_users WHERE username = ?').get(username);
}

async function main() {
  let username = process.argv[2] || process.env.ADMIN_USERNAME;
  let password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!username) {
    username = await askQuestion('Admin username: ');
  }

  if (!password) {
    password = await askSecret('Admin password: ');
  }

  if (!username || !password) {
    console.error('Username and password are both required.');
    process.exit(1);
  }

  try {
    const user = await createAdminUser(username, password);
    console.log(`Admin user ready: ${user.username} (id=${user.id})`);
    db.close();
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    db.close();
    process.exit(1);
  }
}

main();
