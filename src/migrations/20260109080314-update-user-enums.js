'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the actual enum type names in the database
    const [designationTypes] = await queryInterface.sequelize.query(`
      SELECT DISTINCT t.typname 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%designation%';
    `);

    const [departmentTypes] = await queryInterface.sequelize.query(`
      SELECT DISTINCT t.typname 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%department%';
    `);

    const designationTypeName = designationTypes[0]?.typname || 'enum_users_designation';
    const departmentTypeName = departmentTypes[0]?.typname || 'enum_users_department';

    // Get existing enum values to avoid duplicates
    const [existingDesignations] = await queryInterface.sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${designationTypeName}');
    `);

    const [existingDepartments] = await queryInterface.sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${departmentTypeName}');
    `);

    const existingDesignationValues = existingDesignations.map((e) => e.enumlabel);
    const existingDepartmentValues = existingDepartments.map((e) => e.enumlabel);

    // New designation values to add
    const designationValues = [
      'Software Engineer',
      'QA Engineer',
      'DevOps Engineer',
      'HR Specialist',
      'HR Manager',
      'Product Manager',
      'UI/UX Designer',
      'Graphic Designer',
      'Data Analyst',
      'Marketing Executive',
      'Finance Analyst',
      'Content Writer',
      'Support Engineer',
      'Lead Developer',
      'Business Analyst',
    ];

    // Add designation values that don't exist yet
    for (const value of designationValues) {
      if (!existingDesignationValues.includes(value)) {
        try {
          const escapedValue = value.replace(/'/g, "''");
          // Use a simpler approach - try with IF NOT EXISTS first
          await queryInterface.sequelize.query(
            `DO $$ BEGIN ALTER TYPE "${designationTypeName}" ADD VALUE IF NOT EXISTS '${escapedValue}'; EXCEPTION WHEN OTHERS THEN NULL; END $$;`
          );
        } catch (error) {
          // If that doesn't work, try direct ALTER (might fail if value exists, which is ok)
          try {
            const escapedValue = value.replace(/'/g, "''");
            await queryInterface.sequelize.query(
              `ALTER TYPE "${designationTypeName}" ADD VALUE '${escapedValue}';`
            );
          } catch (e) {
            // Ignore "already exists" errors
            if (!e.message.includes('already exists')) {
              console.warn(`Warning: Could not add designation "${value}": ${e.message}`);
            }
          }
        }
      }
    }

    // New department values to add
    const departmentValues = [
      'Quality Assurance',
      'Human Resources',
      'Product',
      'Design',
      'Analytics',
      'Finance',
      'Content',
      'Support',
      'Business',
    ];

    // Add department values that don't exist yet
    for (const value of departmentValues) {
      if (!existingDepartmentValues.includes(value)) {
        try {
          const escapedValue = value.replace(/'/g, "''");
          await queryInterface.sequelize.query(
            `DO $$ BEGIN ALTER TYPE "${departmentTypeName}" ADD VALUE IF NOT EXISTS '${escapedValue}'; EXCEPTION WHEN OTHERS THEN NULL; END $$;`
          );
        } catch (error) {
          try {
            const escapedValue = value.replace(/'/g, "''");
            await queryInterface.sequelize.query(
              `ALTER TYPE "${departmentTypeName}" ADD VALUE '${escapedValue}';`
            );
          } catch (e) {
            if (!e.message.includes('already exists')) {
              console.warn(`Warning: Could not add department "${value}": ${e.message}`);
            }
          }
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing enum values directly
    // This migration cannot be safely rolled back automatically
    console.log(
      'WARNING: Enum values cannot be removed automatically. ' +
      'To rollback, you must manually recreate the enum types with only the original values.'
    );
  },
};
