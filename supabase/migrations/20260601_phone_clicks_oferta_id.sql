-- Dodaj kolumne oferta_id do phone_clicks (brakujaca od poczatku)
-- Istniejace wiersze (23 klikniecia bez oferty) dostana oferta_id = NULL
ALTER TABLE phone_clicks
    ADD COLUMN IF NOT EXISTS oferta_id integer REFERENCES oferty(id) ON DELETE SET NULL;
