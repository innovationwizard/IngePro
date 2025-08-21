-- Remove role columns from junction tables
-- This enforces the rule: "For any user, only one role exists"

-- Remove role column from UserTenant table
ALTER TABLE "UserTenant" DROP COLUMN "role";

-- Remove role column from UserProject table  
ALTER TABLE "UserProject" DROP COLUMN "role";

-- Verify the changes
SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE table_name IN ('UserTenant', 'UserProject') 
    AND column_name = 'role';
