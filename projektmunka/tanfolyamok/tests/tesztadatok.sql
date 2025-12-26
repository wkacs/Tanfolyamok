-- database: c:\Users\konig\OneDrive\Asztali gép\projektmunka\tanfolyamok\tanfolyamok.db

SELECT * FROM "table-name";
-- database: ../tanfolyamok.db
-- Engedélyezzük a foreign key kényszereket SQLite-ban (munkamenetenként szükséges lehet)
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

--
-- Tábla szerkezet ehhez a táblához `kepzesek`
--
CREATE TABLE IF NOT EXISTS `kepzesek` (
  `kid` INTEGER PRIMARY KEY AUTOINCREMENT,
  `knev` TEXT NOT NULL,
  `oraszam` INTEGER NOT NULL
);

--
-- A tábla adatainak kiíratása `kepzesek`
--
INSERT INTO `kepzesek` (`kid`, `knev`, `oraszam`) VALUES
(1, 'Digitális alapok - Teljesen nulláról', 40),
(2, 'Digitális alapok - Mindennapi internethasználat', 40),
(3, 'Digitális alapok - Tudatos és biztonságos internet', 80);

--
-- Tábla szerkezet ehhez a táblához `csoportok`
--
CREATE TABLE IF NOT EXISTS `csoportok` (
  `csid` INTEGER PRIMARY KEY AUTOINCREMENT,
  `kid` INTEGER NOT NULL,
  `indulas` TEXT NOT NULL, -- Dátum TEXT típusként (YYYY-MM-DD formátumban)
  `beosztas` TEXT NOT NULL,
  `helyszin` TEXT NOT NULL,
  `ar` INTEGER NOT NULL,
  FOREIGN KEY (`kid`) REFERENCES `kepzesek` (`kid`)
);

--
-- A `csoportok` tábla adatainak feltöltése
--
INSERT INTO `csoportok` (`csid`, `kid`, `indulas`, `beosztas`, `helyszin`, `ar`) VALUES
(1, 1, '2024-09-08', 'szerda-péntek 17-20 óráig', 'tanterem', 39000),
(2, 1, '2024-09-11', 'szombatonként 10-16 óráig', 'online', 29000),
(3, 2, '2026-01-07', 'szerda-péntek 17-20 óráig', 'tanterem', 39000),
(4, 2, '2026-04-10', 'szombatonként 10-16 óráig', 'online', 29000),
(5, 3, '2026-09-10', 'szombatonként 10-16 óráig', 'online', 49000);

--
-- Tábla szerkezet ehhez a táblához `jelentkezok`
--
CREATE TABLE IF NOT EXISTS `jelentkezok` (
  `jid` INTEGER PRIMARY KEY AUTOINCREMENT,
  `csid` INTEGER NOT NULL,
  `jnev` TEXT NOT NULL,
  `szulnev` TEXT DEFAULT NULL,
  `szulido` TEXT NOT NULL, -- Dátum TEXT típusként (YYYY-MM-DD formátumban)
  `szulhely` TEXT NOT NULL,
  `anyjaneve` TEXT NOT NULL,
  `cim` TEXT NOT NULL,
  `telefon` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  FOREIGN KEY (`csid`) REFERENCES `csoportok` (`csid`)
);

--
-- A `jelentkezok` tábla adatainak feltöltése
--
INSERT INTO `jelentkezok` (`jid`, `csid`, `jnev`, `szulnev`, `szulido`, `szulhely`, `anyjaneve`, `cim`, `telefon`, `email`) VALUES
(1, 1, 'Kiss Gizella', 'Kiss Gizella', '2000-06-02', 'Budapest', 'Németh Gizella', '1011 Budapest, Vár u. 11.', '+36702996724', 'kissg@freemail.hu'),
(2, 1, 'Nagy Béla', 'Nagy Béla', '1991-01-12', 'Budapest', 'Kovács Lujza', '1022 Budapest, Hegy u. 22.', '+36302986724', 'nagyb@freemail.hu'),
(3, 2, 'Kovács Lajos', 'Kovács Lajos', '1986-07-30', 'Miskolc', 'Fekete Erzsébet', '1033 Budapest, Flórián tér 13.', '+36202976724', 'kovacslajos@gmail.hu'),
(4, 2, 'Szabó Géza', 'Szabó Géza', '2001-03-12', 'Budapest', 'Piros Piroska', '1044 Budapest, Váci út 201.', '+36301996724', 'gezasz@gmail.hu'),
(5, 2, 'Fekete Mihály', 'Fekete Mihály', '1993-11-23', 'Budapest', 'Kék Klára', '1055 Budapest, Deák tér 55. 1/3', '+36201996723', 'fekete@freemail.hu'),
(6, 3, 'Kovácsné Fehér Ágnes', 'Fehér Ágnes', '1978-01-30', 'Eger', 'Barna Éva', '1066 Budapest, Király u. 36. 5/16', '+3670196724', 'kfeheragi@freemail.hu'),
(7, 3, 'Magyar Márton', 'Magyar Márton', '2000-09-01', 'Budapest', 'Kiss Virág', '1077 Budapest, Nyugati u. 77.', '+36302996724', 'magyarm@gmail.hu'),
(8, 3, 'Németh István', 'Németh István', '1998-04-01', 'Budapest', 'Bazsa Rózsa', '1088 Budapest, Rákóczi tér 8.', '+36302996724', 'nemeth.istvan@gmail.hu'),
(9, 3, 'Orosz Gabriella', 'Orosz Gabriella', '2000-06-02', 'Budapest', 'Tóth Ibolya', '1099 Budapest, Ecseri út 99.', '+36202996724', 'oroszg@gmail.hu'),
(10, 3, 'Széles Gáborné', 'Keskeny Klára', '1982-06-12', 'Budapest', 'Nagy Katalin', '1101 Budapest, Kozma u. 100.', '+36202996724', 'szeles@gmail.hu'),
(11, 3, 'Kocka József', 'Kocka József', '1992-10-13', 'Szeged', 'Szabó Sarolta', '1111 Budapest, Irinyi J. u. 11.', '+36702997724', 'kocka2@gmail.hu'),
(12, 3, 'Fazekas Attila', 'Fazekas Attila', '2001-12-02', 'Budapest', 'Tóth Zoé', '1121 Budapest, Virág u. 12.', '+36702996720', 'fazekas@freemail.hu'),
(13, 3, 'Asztalos Szilvia', 'Asztalos Szilvia', '2000-05-01', 'Győr', 'Fazekas Anna', '1133 Budapest, Angyal . 13.', '+36302996714', 'asztalos@freemail.hu'),
(14, 4, 'Tóth Krisztina', 'Tóth Krisztina', '1991-11-07', 'Budapest', 'Papp Ildikó', '1144 Budapest, Róna u. 144.', '+36702996725', 'kriszti1991@gmail.hu'),
(15, 4, 'Nagy János', 'Nagy János', '1989-06-20', 'Budapest', 'Horváth Orsolya', '2119 Pécel, Thököly u. 15.', '+36302996711', 'nagyjanos@gmail.hu'),
(16, 4, 'Soós Sándor', 'Soós Sándor', '2000-07-29', 'Budapest', 'Román Róbert', '1162 Budapest, Sas u. 116.', '+36302996713', 'sooss@freemail.hu'),
(17, 4, 'Kis Zsolt', 'Kis Zsolt', '1994-02-10', 'Debrecen', 'Kósa Renáta', '1173 Budapest, Borsó u. 17. 1/7', '+36202995724', 'kiszsolt@gmail.hu'),
(18, 4, 'Simon Lajos', 'Simon Lajos', '1965-04-18', 'Budapest', 'Homoki Andrea', '1183 Budapest, Nefelejcs u. 18.', '+36202994724', 'simonlajos@gmail.hu'),
(21, 4, 'Kovács Zsolt', 'Kovács Zsolt', '1969-02-05', 'Budapest', 'Kiss Borbála', '1191 Budapest, Kossuth tér 19.', '+36501234567', 'kozso@hotmail.com');

--
-- Indexek a kiírt táblákhoz (opcionális, de hasznos a teljesítményhez)
--
CREATE INDEX IF NOT EXISTS `idx_csoportok_kid` ON `csoportok` (`kid`);
CREATE INDEX IF NOT EXISTS `idx_jelentkezok_csid` ON `jelentkezok` (`csid`);

COMMIT;
