/*
  # Normalizzazione campi clienti

  1. Modifiche Tabelle
    - Rinominato campo `nomeAzienda` in `ragioneSociale`
    - Aggiunto campo `codiceFiscale`
    - Aggiunto campo `indirizzoPEC`
    - Aggiunto campo `iban`
    - Aggiunto campo `emailFatturazione`
    - Aggiunto campo `sdi`
    - Aggiunto campo `bancaAppoggio`

  2. Sicurezza
    - Controlli per evitare errori su campi esistenti
*/

-- Rinomina campo nomeAzienda in ragioneSociale
IF EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'nomeAzienda'
)
BEGIN
  EXEC sp_rename 'Clienti.nomeAzienda', 'ragioneSociale', 'COLUMN';
END;

-- Aggiunta campo codice fiscale
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'codiceFiscale'
)
BEGIN
  ALTER TABLE Clienti ADD codiceFiscale NVARCHAR(50);
END;

-- Aggiunta campo indirizzo PEC
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'indirizzoPEC'
)
BEGIN
  ALTER TABLE Clienti ADD indirizzoPEC NVARCHAR(255);
END;

-- Aggiunta campo IBAN
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'iban'
)
BEGIN
  ALTER TABLE Clienti ADD iban NVARCHAR(50);
END;

-- Aggiunta campo email fatturazione
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'emailFatturazione'
)
BEGIN
  ALTER TABLE Clienti ADD emailFatturazione NVARCHAR(255);
END;

-- Aggiunta campo SDI
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'sdi'
)
BEGIN
  ALTER TABLE Clienti ADD sdi NVARCHAR(20);
END;

-- Aggiunta campo banca di appoggio
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'Clienti' AND column_name = 'bancaAppoggio'
)
BEGIN
  ALTER TABLE Clienti ADD bancaAppoggio NVARCHAR(255);
END;

-- Indici per performance
CREATE INDEX IX_Clienti_CodiceFiscale ON Clienti(codiceFiscale);
CREATE INDEX IX_Clienti_SDI ON Clienti(sdi);