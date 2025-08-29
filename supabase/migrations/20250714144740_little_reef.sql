-- Database: homepromise
-- Creazione del database (eseguire come amministratore)
-- CREATE DATABASE homepromise;
-- USE homepromise;

-- Tabella Clienti
CREATE TABLE Clienti (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nomeAzienda NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    telefono NVARCHAR(50),
    nomeReferente NVARCHAR(255),
    telefonoReferente NVARCHAR(50),
    indirizzo NVARCHAR(500),
    partitaIva NVARCHAR(50),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Tabella Software
CREATE TABLE Software (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nomeSoftware NVARCHAR(255) NOT NULL,
    versione NVARCHAR(100),
    logo NVARCHAR(MAX), -- Base64 encoded image
    descrizione NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Tabella Licenze
CREATE TABLE Licenze (
    id INT IDENTITY(1,1) PRIMARY KEY,
    clienteId INT NOT NULL,
    softwareId INT NOT NULL,
    numeroLicenze INT NOT NULL,
    seriali NVARCHAR(MAX), -- Multiple serials stored as text
    dataAttivazione DATE NOT NULL,
    dataScadenza DATE NOT NULL,
    note NVARCHAR(MAX),
    riferimentoContratto NVARCHAR(255),
    stato NVARCHAR(20) DEFAULT 'valida', -- valida, in_scadenza, scaduta
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (clienteId) REFERENCES Clienti(id) ON DELETE CASCADE,
    FOREIGN KEY (softwareId) REFERENCES Software(id) ON DELETE CASCADE
);

-- Indici per migliorare le performance
CREATE INDEX IX_Licenze_ClienteId ON Licenze(clienteId);
CREATE INDEX IX_Licenze_SoftwareId ON Licenze(softwareId);
CREATE INDEX IX_Licenze_DataScadenza ON Licenze(dataScadenza);
CREATE INDEX IX_Licenze_Stato ON Licenze(stato);

-- Trigger per aggiornare updatedAt automaticamente
CREATE TRIGGER TR_Clienti_UpdatedAt ON Clienti
AFTER UPDATE
AS
BEGIN
    UPDATE Clienti 
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;

CREATE TRIGGER TR_Software_UpdatedAt ON Software
AFTER UPDATE
AS
BEGIN
    UPDATE Software 
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;

CREATE TRIGGER TR_Licenze_UpdatedAt ON Licenze
AFTER UPDATE
AS
BEGIN
    UPDATE Licenze 
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;

-- Stored Procedure per aggiornare lo stato delle licenze
CREATE PROCEDURE UpdateLicenseStatus
AS
BEGIN
    UPDATE Licenze 
    SET stato = CASE 
        WHEN dataScadenza < CAST(GETDATE() AS DATE) THEN 'scaduta'
        WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), dataScadenza) <= 30 THEN 'in_scadenza'
        ELSE 'valida'
    END;
END;

-- Dati di esempio
INSERT INTO Clienti (nomeAzienda, email, telefono, nomeReferente, telefonoReferente, indirizzo, partitaIva) VALUES
('ACME Corporation', 'contact@acme.com', '+39 02 1234567', 'Mario Rossi', '+39 333 1234567', 'Via Milano 123, 20121 Milano', '12345678901'),
('Tech Solutions SRL', 'info@techsolutions.it', '+39 06 9876543', 'Giulia Bianchi', '+39 333 9876543', 'Via Roma 456, 00100 Roma', '98765432109'),
('Digital Innovation SpA', 'hello@digitalinnovation.it', '+39 011 5551234', 'Luca Verdi', '+39 333 5551234', 'Corso Torino 789, 10128 Torino', '11223344556');

INSERT INTO Software (nomeSoftware, versione, descrizione) VALUES
('Microsoft Office 365', '2023', 'Suite completa di produttività aziendale'),
('Adobe Creative Cloud', '2023', 'Suite creativa professionale'),
('Kaspersky Total Security', '2023', 'Protezione avanzata per endpoint'),
('AutoCAD', '2023', 'Software CAD professionale');

INSERT INTO Licenze (clienteId, softwareId, numeroLicenze, seriali, dataAttivazione, dataScadenza, note, riferimentoContratto) VALUES
(1, 1, 25, 'MSOF-2023-ACME-001\nMSOF-2023-ACME-002\nMSOF-2023-ACME-003', '2023-01-15', '2024-01-15', 'Licenza volume per tutti i dipendenti', 'CONTR-2023-001'),
(1, 3, 25, 'KASP-2023-ACME-001\nKASP-2023-ACME-002', '2023-02-01', '2024-02-01', 'Protezione endpoint aziendale', 'CONTR-2023-002'),
(2, 2, 5, 'ADBE-2023-TECH-001', '2023-03-01', '2025-03-01', 'Licenza per team creativo', 'CONTR-2023-003'),
(3, 4, 3, 'ACAD-2023-DIGI-001\nACAD-2023-DIGI-002', '2023-04-01', '2024-12-15', 'Licenza per reparto tecnico', 'CONTR-2023-004'),
(2, 1, 15, 'MSOF-2023-TECH-001', '2023-02-15', '2024-12-30', 'Licenza Office per sede principale', 'CONTR-2023-005');

-- Esegui l'aggiornamento dello stato delle licenze
EXEC UpdateLicenseStatus;