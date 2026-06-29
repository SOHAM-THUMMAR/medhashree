const db = require('e:/Quiz_Dash/Node_server/config/db');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const hp = await bcrypt.hash('admin123', 10);
        await db.query(
            `INSERT INTO users (full_name, email, username, password_hash, role, is_active) 
             VALUES ('Admin', 'admin@example.com', 'admin_user', $1, 'admin', true) 
             ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin'`,
            [hp]
        );
        console.log("Admin user created/updated successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
