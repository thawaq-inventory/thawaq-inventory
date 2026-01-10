-- Step 1: Create Branch table
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Step 2: Insert default branch
INSERT INTO "Branch" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
VALUES ('default-branch-id', 'Main Branch', 'MAIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 3: Add branch columns with default value
-- User table (branch can be null for super admins)
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pinCode" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "cliqAlias" TEXT,
    "hourlyRate" REAL DEFAULT 5.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Copy data with default branch for all non-admin users
INSERT INTO "new_User" SELECT "id", "name", "username", "password", "pinCode", "role", "isActive", 
  CASE WHEN "role" = 'ADMIN' THEN NULL ELSE 'default-branch-id' END,
  CASE WHEN "role" = 'ADMIN' THEN true ELSE false END,
  "cliqAlias", "hourlyRate", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_pinCode_key" ON "User"("pinCode");

-- Product table
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "branchId" TEXT NOT NULL,
    "stockLevel" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UNIT',
    "minStock" REAL NOT NULL DEFAULT 0,
    "maxStock" REAL NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "foodicsId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" SELECT "id", "name", "sku", "description", 'default-branch-id', "stockLevel", "unit", "minStock", "maxStock", "cost", "price", "foodicsId", "createdAt", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_foodicsId_key" ON "Product"("foodicsId");

-- Shift table
CREATE TABLE "new_Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Shift" SELECT "id", "userId", 'default-branch-id', "date", "startTime", "endTime", "role", "notes", "status", "createdAt", "updatedAt" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";

-- Location table
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Location" SELECT "id", "name", "address", "phone", "isActive", 'default-branch-id', "createdAt", "updatedAt" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";

-- InventoryLog table
CREATE TABLE "new_InventoryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "changeAmount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryLog" SELECT "id", "productId", 'default-branch-id', "changeAmount", "reason", "userId", "createdAt" FROM "InventoryLog";
DROP TABLE "InventoryLog";
ALTER TABLE "new_InventoryLog" RENAME TO "InventoryLog";

-- WasteLog table
CREATE TABLE "new_WasteLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "costImpact" REAL NOT NULL,
    "notes" TEXT,
    "locationId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WasteLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WasteLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WasteLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WasteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WasteLog" SELECT "id", "productId", 'default-branch-id', "quantity", "reason", "costImpact", "notes", "locationId", "userId", "createdAt" FROM "WasteLog";
DROP TABLE "WasteLog";
ALTER TABLE "new_WasteLog" RENAME TO "WasteLog";

-- Expense table
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "notes" TEXT,
    "branchId" TEXT NOT NULL,
    "categoryId" TEXT,
    "customCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "debitAccountId" TEXT,
    "creditAccountId" TEXT,
    "journalEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Expense" SELECT "id", "amount", "taxRate", "taxAmount", "totalAmount", "description", "expenseDate", "photoUrl", "notes", 'default-branch-id', "categoryId", "customCategory", "status", "rejectionReason", "submittedById", "reviewedById", "reviewedAt", "debitAccountId", "creditAccountId", "journalEntryId", "createdAt", "updatedAt" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE UNIQUE INDEX "Expense_journalEntryId_key" ON "Expense"("journalEntryId");

-- PayrollTransaction table
CREATE TABLE "new_PayrollTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "totalHours" REAL NOT NULL,
    "hourlyRate" REAL NOT NULL,
    "finalAmount" REAL NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "transactionId" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting_bank_approval',
    "accountNumber" TEXT,
    "bankCode" TEXT,
    "notes" TEXT,
    "errorMessage" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PayrollTransaction" SELECT "id", "employeeId", 'default-branch-id', "totalHours", "hourlyRate", "finalAmount", "periodStart", "periodEnd", "transactionId", "reference", "status", "accountNumber", "bankCode", "notes", "errorMessage", "approvedAt", "createdAt", "updatedAt" FROM "PayrollTransaction";
DROP TABLE "PayrollTransaction";
ALTER TABLE "new_PayrollTransaction" RENAME TO "PayrollTransaction";

PRAGMA foreign_keys=ON;

-- Create unique index on Branch code
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");
