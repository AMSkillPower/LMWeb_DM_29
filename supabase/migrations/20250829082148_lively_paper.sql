/*
  # Sistema di Autenticazione e Logging

  1. Nuove Tabelle
    - `Users` nel database skpw_TaskManager per gestione utenti
    - `ActivityLogs` nel database skpw_LicenseManager per audit trail

  2. Sicurezza
    - Password hashate con bcrypt
    - Ruoli User e Admin
    - Logging completo delle operazioni CRUD

  3. Funzionalità
    - Login/logout con sessioni
    - Controllo accessi basato su ruoli
    - Tracciamento attività utente
*/

-- Connessione al database TaskManager per tabella Users
USE skpw_TaskManager;

-- Creazione tabella Users se non esiste
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
  CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(10) NOT NULL CHECK (role IN ('User', 'Admin')),
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
  );

  -- Indici per performance
  CREATE INDEX IX_Users_Username ON Users(username);
  CREATE INDEX IX_Users_Role ON Users(role);
  CREATE INDEX IX_Users_IsActive ON Users(isActive);
  CREATE INDEX IX_Users_Email ON Users(email);

  -- Trigger per aggiornare updatedAt
  CREATE TRIGGER TR_Users_UpdatedAt ON Users
  AFTER UPDATE
  AS
  BEGIN
    UPDATE Users 
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
  END;

  -- Utente admin di default (password: admin123)
  INSERT INTO Users (username, password, role, fullName, email, isActive) VALUES
  ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Amministratore Sistema', 'admin@licensemanager.com', 1),
  ('user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'User', 'Utente Standard', 'user@licensemanager.com', 1);
END;

-- Connessione al database LicenseManager per tabella ActivityLogs
USE skpw_LicenseManager;

-- Creazione tabella ActivityLogs se non esiste
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLogs' AND xtype='U')
BEGIN
  CREATE TABLE ActivityLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    username NVARCHAR(50) NOT NULL,
    action NVARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entityType NVARCHAR(20) NOT NULL CHECK (entityType IN ('Cliente', 'Software', 'Licenza', 'DocumentManager')),
    entityId INT NOT NULL,
    entityName NVARCHAR(255) NOT NULL,
    oldValues NVARCHAR(MAX) NULL,
    newValues NVARCHAR(MAX) NULL,
    ipAddress NVARCHAR(45) NULL,
    userAgent NVARCHAR(500) NULL,
    createdAt DATETIME2 DEFAULT GETDATE()
  );

  -- Indici per performance
  CREATE INDEX IX_ActivityLogs_UserId ON ActivityLogs(userId);
  CREATE INDEX IX_ActivityLogs_Action ON ActivityLogs(action);
  CREATE INDEX IX_ActivityLogs_EntityType ON ActivityLogs(entityType);
  CREATE INDEX IX_ActivityLogs_EntityId ON ActivityLogs(entityId);
  CREATE INDEX IX_ActivityLogs_CreatedAt ON ActivityLogs(createdAt);
  CREATE INDEX IX_ActivityLogs_Username ON ActivityLogs(username);
END;