# Tanfolyamok
Tanfolyamok projektmunka Andorfer Vendel, Babai Máté, Varga Mátyás


# Hogy inditsd el
1. Hozz létre egy .env fájlt a gyökérkönyvtárban a következő tartalommal
```env
   ADMIN="bcrypt_hash_az_admin_jelszohoz"
   TOKEN_SECRET="nagyon_titkos_kulcs_a_jwt_tokenhez"
   ```
 (Az ADMIN értékét cseréld le a jelszó hash-re, a TOKEN_SECRET értékét pedig egytitkos kulcsra)

2. Hozz létre egy adatbázist `tanfolyamok.db` néven majd a test mappából töltsd fel a teszt adatokkal
3. Powershell: `npm install`
4. Powershel: `node app.js`
(elérhető lesz a http://localhost:5000 címen).
