/*
  # Aggiunta nuovi campi per funzionalità avanzate

  1. Modifiche Tabelle
    - Aggiunto campo `costo` alla tabella Software
    - Aggiunto campo `logo` alla tabella Clienti  
    - Aggiunto campo `sitoWeb` alla tabella Clienti
    - Aggiunto campo `dataOrdine` alla tabella Licenze
    - Aggiunto campo `costoTotale` alla tabella Licenze

  2. Indici
    - Aggiunto indice per dataOrdine
    - Aggiunto indice per costoTotale
*/

-- Aggiunta campo costo al software
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Software' AND column_name = 'costo'
)
BEGIN
  ALTER TABLE Software ADD costo DECIMAL(10,2);
END;

-- Aggiunta campo logo ai clienti
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'logo'
)
BEGIN
  ALTER TABLE Clienti ADD logo NVARCHAR(MAX);
END;

-- Aggiunta campo sito web ai clienti
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'sitoWeb'
)
BEGIN
  ALTER TABLE Clienti ADD sitoWeb NVARCHAR(500);
END;

-- Aggiunta campo data ordine alle licenze
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Licenze' AND column_name = 'dataOrdine'
)
BEGIN
  ALTER TABLE Licenze ADD dataOrdine DATE;
END;

-- Aggiunta campo costo totale alle licenze
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Licenze' AND column_name = 'costoTotale'
)
BEGIN
  ALTER TABLE Licenze ADD costoTotale DECIMAL(10,2);
END;

-- Aggiornamento dati di esempio con i nuovi campi
UPDATE Software SET costo = 12.50 WHERE nomeSoftware = 'Microsoft Office 365';
UPDATE Software SET costo = 52.99 WHERE nomeSoftware = 'Adobe Creative Cloud';
UPDATE Software SET costo = 35.99 WHERE nomeSoftware = 'Kaspersky Total Security';
UPDATE Software SET costo = 185.00 WHERE nomeSoftware = 'AutoCAD';

UPDATE Clienti SET sitoWeb = 'https://www.acme.com' WHERE nomeAzienda = 'ACME Corporation';
UPDATE Clienti SET sitoWeb = 'https://www.techsolutions.it' WHERE nomeAzienda = 'Tech Solutions SRL';
UPDATE Clienti SET sitoWeb = 'https://www.digitalinnovation.it' WHERE nomeAzienda = 'Digital Innovation SpA';

-- Aggiornamento licenze con data ordine e costo totale
UPDATE l SET 
  dataOrdine = DATEADD(day, -7, l.dataAttivazione),
  costoTotale = l.numeroLicenze * ISNULL(s.costo, 0)
FROM Licenze l
INNER JOIN Software s ON l.softwareId = s.id;

-- Indici per performance
CREATE INDEX IX_Licenze_DataOrdine ON Licenze(dataOrdine);
CREATE INDEX IX_Licenze_CostoTotale ON Licenze(costoTotale);
CREATE INDEX IX_Software_Costo ON Software(costo);