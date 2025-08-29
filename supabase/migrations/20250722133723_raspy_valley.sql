/*
  # Aggiunta campi localizzazione clienti

  1. Nuovi Campi
    - Aggiunto campo `comune` alla tabella Clienti
    - Aggiunto campo `cap` alla tabella Clienti  
    - Aggiunto campo `provincia` alla tabella Clienti
    - Aggiunto campo `paese` alla tabella Clienti

  2. Indici
    - Aggiunto indice per comune
    - Aggiunto indice per provincia
    - Aggiunto indice per paese
*/

-- Aggiunta campo comune
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'comune'
)
BEGIN
  ALTER TABLE Clienti ADD comune NVARCHAR(100);
END;

-- Aggiunta campo CAP
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'cap'
)
BEGIN
  ALTER TABLE Clienti ADD cap NVARCHAR(10);
END;

-- Aggiunta campo provincia
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'provincia'
)
BEGIN
  ALTER TABLE Clienti ADD provincia NVARCHAR(50);
END;

-- Aggiunta campo paese
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'paese'
)
BEGIN
  ALTER TABLE Clienti ADD paese NVARCHAR(100) DEFAULT 'Italia';
END;

-- Aggiornamento dati esistenti con valori di default per l'Italia
UPDATE Clienti SET paese = 'Italia' WHERE paese IS NULL;

-- Indici per performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clienti_Comune')
  CREATE INDEX IX_Clienti_Comune ON Clienti(comune);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clienti_Provincia')
  CREATE INDEX IX_Clienti_Provincia ON Clienti(provincia);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clienti_Paese')
  CREATE INDEX IX_Clienti_Paese ON Clienti(paese);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clienti_CAP')
  CREATE INDEX IX_Clienti_CAP ON Clienti(cap);