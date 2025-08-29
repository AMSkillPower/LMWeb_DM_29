/*
  # Aggiunta nuovi campi alla tabella Software

  1. Nuovi Campi
    - Aggiunto campo `tipoLicenza` con valori limitati ('PLC', 'ALC', 'YLC', 'QLC')
    - Aggiunto campo `codice` per identificativo software
    - Aggiunto campo `categoria` per classificazione

  2. Vincoli
    - Check constraint per tipoLicenza
    - Indici per performance
*/

-- Aggiunta campo tipoLicenza con constraint
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Software' AND column_name = 'tipoLicenza'
)
BEGIN
  ALTER TABLE Software ADD tipoLicenza NVARCHAR(10);
  
  -- Aggiunta constraint per limitare i valori
  ALTER TABLE Software ADD CONSTRAINT CK_Software_TipoLicenza 
    CHECK (tipoLicenza IN ('PLC', 'ALC', 'YLC', 'QLC'));
END;

-- Aggiunta campo codice
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Software' AND column_name = 'codice'
)
BEGIN
  ALTER TABLE Software ADD codice NVARCHAR(100);
END;

-- Aggiunta campo categoria
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Software' AND column_name = 'categoria'
)
BEGIN
  ALTER TABLE Software ADD categoria NVARCHAR(100);
END;

-- Aggiornamento dati esistenti con valori di esempio
UPDATE Software SET 
  tipoLicenza = 'ALC',
  codice = 'MS-OFF-365',
  categoria = 'Produttività'
WHERE nomeSoftware = 'Microsoft Office 365' AND tipoLicenza IS NULL;

UPDATE Software SET 
  tipoLicenza = 'YLC',
  codice = 'ADBE-CC',
  categoria = 'Design'
WHERE nomeSoftware = 'Adobe Creative Cloud' AND tipoLicenza IS NULL;

UPDATE Software SET 
  tipoLicenza = 'ALC',
  codice = 'KASP-TS',
  categoria = 'Sicurezza'
WHERE nomeSoftware = 'Kaspersky Total Security' AND tipoLicenza IS NULL;

UPDATE Software SET 
  tipoLicenza = 'PLC',
  codice = 'ACAD-2023',
  categoria = 'Ingegneria'
WHERE nomeSoftware = 'AutoCAD' AND tipoLicenza IS NULL;

-- Indici per performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Software_TipoLicenza')
  CREATE INDEX IX_Software_TipoLicenza ON Software(tipoLicenza);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Software_Codice')
  CREATE INDEX IX_Software_Codice ON Software(codice);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Software_Categoria')
  CREATE INDEX IX_Software_Categoria ON Software(categoria);