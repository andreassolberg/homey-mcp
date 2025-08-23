import duckdb from "duckdb";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, "..", "..", "status.db");
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new duckdb.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
          return;
        }
        
        // Create status table if it doesn't exist
        this.db.run(`
          CREATE SEQUENCE IF NOT EXISTS device_status_seq START 1;
          CREATE TABLE IF NOT EXISTS device_status (
            id INTEGER PRIMARY KEY DEFAULT nextval('device_status_seq'),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            device_id VARCHAR(255) NOT NULL,
            device_name VARCHAR(255) NOT NULL,
            zone VARCHAR(255),
            device_class VARCHAR(255),
            is_ok BOOLEAN NOT NULL,
            status_details JSON,
            battery_level INTEGER,
            last_update_hours_ago REAL,
            is_offline BOOLEAN,
            is_stale BOOLEAN,
            is_low_battery BOOLEAN
          )
        `, (err) => {
          if (err) {
            console.error("Error creating table:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async recordDeviceStatus(deviceId, deviceName, zone, deviceClass, isOk, statusDetails) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO device_status 
        (device_id, device_name, zone, device_class, is_ok, status_details, 
         battery_level, last_update_hours_ago, is_offline, is_stale, is_low_battery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        deviceId,
        deviceName,
        zone,
        deviceClass,
        isOk,
        JSON.stringify(statusDetails),
        statusDetails.batteryLevel,
        statusDetails.lastUpdateHoursAgo,
        statusDetails.isOffline,
        statusDetails.isStale,
        statusDetails.isLowBattery,
        (err) => {
          if (err) {
            console.error("Error inserting device status:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );

      stmt.finalize();
    });
  }

  async getDevicesWithRecentIssues(daysBack = 7) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT device_id, device_name, zone, device_class,
               MIN(timestamp) as first_issue,
               MAX(timestamp) as last_seen
        FROM device_status 
        WHERE is_ok = false 
          AND timestamp >= (CURRENT_TIMESTAMP - INTERVAL '${daysBack} days')
        GROUP BY device_id, device_name, zone, device_class
        ORDER BY device_name
      `;

      this.db.all(query, (err, rows) => {
        if (err) {
          console.error("Error querying recent issues:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getRecoveredDevices(daysBack = 7) {
    return new Promise((resolve, reject) => {
      const query = `
        WITH recent_status AS (
          SELECT device_id, device_name, zone, device_class, is_ok, timestamp,
                 ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
          FROM device_status
          WHERE timestamp >= (CURRENT_TIMESTAMP - INTERVAL '${daysBack} days')
        ),
        older_issues AS (
          SELECT DISTINCT device_id, device_name, zone, device_class,
                 MAX(timestamp) as last_issue
          FROM device_status
          WHERE is_ok = false 
            AND timestamp < (CURRENT_TIMESTAMP - INTERVAL '${daysBack} days')
          GROUP BY device_id, device_name, zone, device_class
        )
        SELECT o.device_id, o.device_name, o.zone, o.device_class, o.last_issue
        FROM older_issues o
        WHERE NOT EXISTS (
          SELECT 1 FROM recent_status r 
          WHERE r.device_id = o.device_id AND r.rn = 1 AND r.is_ok = false
        )
        AND EXISTS (
          SELECT 1 FROM recent_status r 
          WHERE r.device_id = o.device_id AND r.rn = 1 AND r.is_ok = true
        )
        ORDER BY o.device_name
      `;

      this.db.all(query, (err, rows) => {
        if (err) {
          console.error("Error querying recovered devices:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async hasRecentIssue(deviceId, daysBack = 7) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count
        FROM device_status 
        WHERE device_id = ? 
          AND is_ok = false 
          AND timestamp >= (CURRENT_TIMESTAMP - INTERVAL '${daysBack} days')
      `;

      this.db.get(query, [deviceId], (err, row) => {
        if (err) {
          console.error("Error checking recent issues:", err);
          reject(err);
        } else {
          resolve((row?.count || 0) > 0);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default Database;