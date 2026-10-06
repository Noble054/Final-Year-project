const { db } = require('./config/db');
const config = require('./config');

const createTables = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS Users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255),
      phone_number VARCHAR(30),
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('EV Driver', 'Station Operator', 'Admin')),
      wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
      approval_status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ChargingStations (
      station_id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      charger_type VARCHAR(50) NOT NULL,
      total_slots INTEGER NOT NULL,
      available_slots INTEGER NOT NULL,
      price_per_kwh DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
      contact_number VARCHAR(20),
      operating_hours VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS BatterySwapStations (
      swap_id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      battery_stock INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
      contact_number VARCHAR(20),
      operating_hours VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS Reservations (
      reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
      station_id INTEGER REFERENCES ChargingStations(station_id) ON DELETE CASCADE,
      slot_time DATETIME NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'missed', 'completed')),
      deposit_amount DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Transactions (
      transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'charge', 'penalty', 'swap')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Batteries (
      battery_id INTEGER PRIMARY KEY AUTOINCREMENT,
      swap_id INTEGER REFERENCES BatterySwapStations(swap_id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
      serial_number VARCHAR(100) UNIQUE NOT NULL,
      battery_type VARCHAR(50) DEFAULT 'Lithium-Ion',
      charge_level INTEGER CHECK (charge_level BETWEEN 0 AND 100),
      health_status INTEGER CHECK (health_status BETWEEN 0 AND 100),
      status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'charging', 'swapped', 'maintenance')),
      bike_type VARCHAR(50),
      bike_model VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS SwapLogs (
      swap_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      swap_id INTEGER REFERENCES BatterySwapStations(swap_id),
      user_id INTEGER REFERENCES Users(user_id),
      battery_out_id INTEGER REFERENCES Batteries(battery_id),
      battery_in_id INTEGER REFERENCES Batteries(battery_id),
      charge_level_in INTEGER,
      charge_level_out INTEGER,
      cost DECIMAL(10, 2),
      swapped_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS SubscriptionPlans (
      plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      booking_discount INTEGER NOT NULL DEFAULT 0,
      swap_discount INTEGER NOT NULL DEFAULT 0,
      monthly_bookings INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS SystemSettings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Complaints (
      complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      subject VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    db.exec(query);

    try {
      db.prepare("ALTER TABLE Users ADD COLUMN phone_number VARCHAR(30)").run();
      console.log('Added phone_number to Users');
    } catch (e) {
      // Ignore if already exists
    }

    const planCount = db.prepare('SELECT COUNT(*) AS count FROM SubscriptionPlans').get().count;
    if (planCount === 0) {
      const insertPlan = db.prepare(`
        INSERT INTO SubscriptionPlans (name, description, monthly_price, booking_discount, swap_discount, monthly_bookings)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const seedPlans = db.transaction(() => {
        insertPlan.run('Pay As You Go', 'Flexible access with no monthly commitment.', 0, 0, 0, 0);
        insertPlan.run('ChargeMate Plus', 'Lower booking costs for regular EV drivers.', 9.99, 10, 10, 10);
        insertPlan.run('ChargeMate Pro', 'Maximum savings for frequent charging and swaps.', 19.99, 20, 20, 30);
      });
      seedPlans();
    }

    const settingCount = db.prepare('SELECT COUNT(*) AS count FROM SystemSettings').get().count;
    if (settingCount === 0) {
      const insertSetting = db.prepare('INSERT INTO SystemSettings (setting_key, setting_value) VALUES (?, ?)');
      const seedSettings = db.transaction(() => {
        insertSetting.run('reservationDeposit', String(config.payment.reservationDeposit));
        insertSetting.run('sessionCompletionFee', String(config.payment.sessionCompletionFee));
        insertSetting.run('batterySwapFee', String(config.payment.batterySwapFee));
        insertSetting.run('penaltyAmount', String(config.payment.penaltyAmount));
        insertSetting.run('penaltyTimeWindowMinutes', String(config.payment.penaltyTimeWindowMinutes));
      });
      seedSettings();
    }

    // Existing accounts predate approval workflow and remain available.
    try {
      db.prepare("ALTER TABLE Users ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'approved'").run();
      console.log('Added approval_status to Users');
    } catch (e) {
      // Ignore if already exists
    }
    
    // Add columns if they do not exist (Migration)
    try {
      db.prepare("ALTER TABLE ChargingStations ADD COLUMN contact_number VARCHAR(20)").run();
      console.log('Added contact_number to ChargingStations');
    } catch (e) {
      // Ignore if already exists
    }
    try {
      db.prepare("ALTER TABLE BatterySwapStations ADD COLUMN contact_number VARCHAR(20)").run();
      console.log('Added contact_number to BatterySwapStations');
    } catch (e) {
      // Ignore if already exists
    }
    try {
      db.prepare("ALTER TABLE ChargingStations ADD COLUMN operating_hours VARCHAR(100)").run();
      console.log('Added operating_hours to ChargingStations');
    } catch (e) {
      // Ignore if already exists
    }
    try {
      db.prepare("ALTER TABLE BatterySwapStations ADD COLUMN operating_hours VARCHAR(100)").run();
      console.log('Added operating_hours to BatterySwapStations');
    } catch (e) {
      // Ignore if already exists
    }
    try {
      db.prepare("ALTER TABLE Batteries ADD COLUMN bike_type VARCHAR(50)").run();
      console.log('Added bike_type to Batteries');
    } catch (e) {
      // Ignore if already exists
    }
    try {
      db.prepare("ALTER TABLE Batteries ADD COLUMN bike_model VARCHAR(100)").run();
      console.log('Added bike_model to Batteries');
    } catch (e) {
      // Ignore if already exists
    }

    // Update status constraints to include maintenance and closed
    try {
      // Check if ChargingStations needs constraint update
      const chargingTable = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='ChargingStations'").get();
      const tempTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ChargingStations_new'").get();
      
      // Clean up any existing temp table first
      if (tempTableExists) {
        db.prepare('DROP TABLE IF EXISTS ChargingStations_new').run();
      }
      
      if (chargingTable && !chargingTable.sql.includes('maintenance')) {
        console.log('Updating ChargingStations status constraint...');
        
        // Step 1: Disable foreign key constraints temporarily
        db.prepare('PRAGMA foreign_keys = OFF').run();
        
        // Step 2: Create new table with updated constraint
        db.prepare(`
          CREATE TABLE ChargingStations_new (
            station_id INTEGER PRIMARY KEY AUTOINCREMENT,
            operator_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            charger_type VARCHAR(50) NOT NULL,
            total_slots INTEGER NOT NULL,
            available_slots INTEGER NOT NULL,
            price_per_kwh DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
            contact_number VARCHAR(20),
            operating_hours VARCHAR(100)
          )
        `).run();
        
        // Step 3: Copy data with status validation
        db.prepare(`
          INSERT INTO ChargingStations_new 
          SELECT station_id, operator_id, name, latitude, longitude, charger_type, total_slots, available_slots, price_per_kwh, 
                 CASE 
                   WHEN status = 'active' THEN 'active'
                   WHEN status = 'inactive' THEN 'inactive'
                   ELSE 'active'
                 END as status,
                 contact_number, operating_hours
          FROM ChargingStations
        `).run();
        
        // Step 4: Drop old table and rename new one
        db.prepare('DROP TABLE ChargingStations').run();
        db.prepare('ALTER TABLE ChargingStations_new RENAME TO ChargingStations').run();
        
        // Step 5: Re-enable foreign key constraints
        db.prepare('PRAGMA foreign_keys = ON').run();
        
        console.log('Updated ChargingStations status constraint');
      }
    } catch (e) {
      console.log('Note: Could not update ChargingStations constraint:', e.message);
      // Ensure foreign keys are re-enabled even if update fails
      db.prepare('PRAGMA foreign_keys = ON').run();
      // Clean up temp table if it exists
      try {
        db.prepare('DROP TABLE IF EXISTS ChargingStations_new').run();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    try {
      // Check if BatterySwapStations needs constraint update
      const swapTable = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='BatterySwapStations'").get();
      const tempTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='BatterySwapStations_new'").get();
      
      // Clean up any existing temp table first
      if (tempTableExists) {
        db.prepare('DROP TABLE IF EXISTS BatterySwapStations_new').run();
      }
      
      if (swapTable && !swapTable.sql.includes('maintenance')) {
        console.log('Updating BatterySwapStations status constraint...');
        
        // Step 1: Disable foreign key constraints temporarily
        db.prepare('PRAGMA foreign_keys = OFF').run();
        
        // Step 2: Create new table with updated constraint
        db.prepare(`
          CREATE TABLE BatterySwapStations_new (
            swap_id INTEGER PRIMARY KEY AUTOINCREMENT,
            operator_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            battery_stock INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
            contact_number VARCHAR(20),
            operating_hours VARCHAR(100)
          )
        `).run();
        
        // Step 3: Copy data with status validation
        db.prepare(`
          INSERT INTO BatterySwapStations_new 
          SELECT swap_id, operator_id, name, latitude, longitude, battery_stock,
                 CASE 
                   WHEN status = 'active' THEN 'active'
                   WHEN status = 'inactive' THEN 'inactive'
                   ELSE 'active'
                 END as status,
                 contact_number, operating_hours
          FROM BatterySwapStations
        `).run();
        
        // Step 4: Drop old table and rename new one
        db.prepare('DROP TABLE BatterySwapStations').run();
        db.prepare('ALTER TABLE BatterySwapStations_new RENAME TO BatterySwapStations').run();
        
        // Step 5: Re-enable foreign key constraints
        db.prepare('PRAGMA foreign_keys = ON').run();
        
        console.log('Updated BatterySwapStations status constraint');
      }
    } catch (e) {
      console.log('Note: Could not update BatterySwapStations constraint:', e.message);
      // Ensure foreign keys are re-enabled even if update fails
      db.prepare('PRAGMA foreign_keys = ON').run();
      // Clean up temp table if it exists
      try {
        db.prepare('DROP TABLE IF EXISTS BatterySwapStations_new').run();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    console.log('Database tables initialized successfully');

    // Seed Mock Batteries
    const batteryCount = db.prepare("SELECT COUNT(*) as count FROM Batteries").get().count;
    if (batteryCount === 0) {
      console.log('Seeding mock batteries...');
      const stations = db.prepare("SELECT swap_id FROM BatterySwapStations").all();
      const bikeTypes = ['Electric Scooter', 'Electric Motorcycle', 'Electric Bicycle', 'Electric Rickshaw', ''];
      const bikeModels = ['Honda PCX', 'Niu NQi', 'Super Soco', 'Bajaj RE', 'Yamaha Neo', ''];
      let count = 1;
      for (const station of stations) {
        for (let i = 0; i < 5; i++) {
          const status = i < 3 ? 'available' : (i === 3 ? 'charging' : 'maintenance');
          const charge = status === 'available' ? 95 + i : (status === 'charging' ? 20 + i * 15 : 45);
          const health = 90 - i * 2;
          const bikeType = bikeTypes[Math.floor(Math.random() * bikeTypes.length)];
          const bikeModel = bikeType ? bikeModels[Math.floor(Math.random() * bikeModels.length)] : '';
          db.prepare(`INSERT INTO Batteries (swap_id, serial_number, charge_level, health_status, status, bike_type, bike_model) VALUES 
            (?, ?, ?, ?, ?, ?, ?)`).run(station.swap_id, `CM-BATT-${1000 + count}`, charge, health, status, bikeType, bikeModel);
          count++;
        }
      }
      const drivers = db.prepare("SELECT user_id FROM Users WHERE role = 'EV Driver'").all();
      for (const driver of drivers) {
        const bikeType = bikeTypes[Math.floor(Math.random() * bikeTypes.length)];
        const bikeModel = bikeType ? bikeModels[Math.floor(Math.random() * bikeModels.length)] : '';
        db.prepare(`INSERT INTO Batteries (user_id, serial_number, charge_level, health_status, status, bike_type, bike_model) VALUES 
          (?, ?, 82, 94, 'swapped', ?, ?)`).run(driver.user_id, `CM-BATT-${1000 + count}`, bikeType, bikeModel);
        count++;
      }
      console.log(`Seeded ${count - 1} mock batteries.`);
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

createTables();
