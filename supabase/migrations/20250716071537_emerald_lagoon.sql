/*
  # Fix Schema - Aggiunta campi mancanti

  1. Nuovi Campi
    - Aggiunto campo `costo` alla tabella Software
    - Aggiunto campo `logo` alla tabella Clienti  
    - Aggiunto campo `sitoWeb` alla tabella Clienti
    - Aggiunto campo `dataOrdine` alla tabella Licenze
    - Aggiunto campo `costoTotale` alla tabella Licenze

  2. Sicurezza
    - Controlli IF NOT EXISTS per evitare errori
    - Aggiornamento dati esistenti
*/

-- Aggiunta campo costo al software (se non esiste)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Software' AND column_name = 'costo'
)
BEGIN
  ALTER TABLE Software ADD costo DECIMAL(10,2);
END;

-- Aggiunta campo logo ai clienti (se non esiste)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'logo'
)
BEGIN
  ALTER TABLE Clienti ADD logo NVARCHAR(MAX);
END;

-- Aggiunta campo sito web ai clienti (se non esiste)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'sitoWeb'
)
BEGIN
  ALTER TABLE Clienti ADD sitoWeb NVARCHAR(500);
END;

-- Aggiunta campo data ordine alle licenze (se non esiste)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Licenze' AND column_name = 'dataOrdine'
)
BEGIN
  ALTER TABLE Licenze ADD dataOrdine DATE;
END;

-- Aggiunta campo costo totale alle licenze (se non esiste)
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Licenze' AND column_name = 'costoTotale'
)
BEGIN
  ALTER TABLE Licenze ADD costoTotale DECIMAL(10,2);
END;

-- Aggiornamento dati di esempio con i nuovi campi (solo se non già presenti)
UPDATE Software SET costo = 12.50 WHERE nomeSoftware = 'Microsoft Office 365' AND costo IS NULL;
UPDATE Software SET costo = 52.99 WHERE nomeSoftware = 'Adobe Creative Cloud' AND costo IS NULL;
UPDATE Software SET costo = 35.99 WHERE nomeSoftware = 'Kaspersky Total Security' AND costo IS NULL;
UPDATE Software SET costo = 185.00 WHERE nomeSoftware = 'AutoCAD' AND costo IS NULL;

-- Aggiornamento licenze con costo totale calcolato
UPDATE l SET 
  costoTotale = l.numeroLicenze * ISNULL(s.costo, 0)
FROM Licenze l
INNER JOIN Software s ON l.softwareId = s.id
WHERE l.costoTotale IS NULL;

-- Creazione indici se non esistono
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenze_DataOrdine')
  CREATE INDEX IX_Licenze_DataOrdine ON Licenze(dataOrdine);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenze_CostoTotale')
  CREATE INDEX IX_Licenze_CostoTotale ON Licenze(costoTotale);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Software_Costo')
  CREATE INDEX IX_Software_Costo ON Software(costo);