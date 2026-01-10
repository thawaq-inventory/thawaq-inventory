-- CreateTable
CREATE TABLE "PayrollTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
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
    CONSTRAINT "PayrollTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
