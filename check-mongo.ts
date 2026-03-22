import connectDB from './src/lib/mongodb';
import Profile from './src/models/Profile';
import { AuditLog } from './src/models/Public';

async function check() {
  await connectDB();
  const profiles = await Profile.countDocuments();
  const logs = await AuditLog.countDocuments();
  console.log(`Profiles: ${profiles}, Logs: ${logs}`);
  process.exit(0);
}
check();
