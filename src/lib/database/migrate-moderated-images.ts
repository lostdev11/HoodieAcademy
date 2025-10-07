import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function migrateModeratedImagesTables() {
  try {
    console.log('🔄 Starting moderated images tables migration...');
    
    // Read the SQL migration file
    const migrationPath = join(process.cwd(), 'src/lib/database/migrations/create-moderated-images-tables.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like table already exists)
            if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
              console.log(`⚠️  Statement ${i + 1} skipped (already exists):`, error.message);
            } else {
              console.error(`❌ Error executing statement ${i + 1}:`, error);
              throw error;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, err);
          throw err;
        }
      }
    }
    
    console.log('🎉 Moderated images tables migration completed successfully!');
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to check if tables exist
export async function checkModeratedImagesTables() {
  try {
    const { data, error } = await supabase
      .from('moderated_images')
      .select('id')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, message: 'Tables exist and are accessible' };
  } catch (error) {
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to get table statistics
export async function getModeratedImagesStats() {
  try {
    const { data: stats, error } = await supabase
      .from('moderated_images')
      .select('status')
      .then(result => {
        if (result.data) {
          const statusCounts = result.data.reduce((acc: Record<string, number>, img: { status: string }) => {
            acc[img.status] = (acc[img.status] || 0) + 1;
            return acc;
          }, {});
          return { data: statusCounts };
        }
        return { data: {} };
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true, statistics: stats };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
