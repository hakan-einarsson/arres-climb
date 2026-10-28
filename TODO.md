# Bugs
-[x] När man skjuts upp i luften från ett regnbågsblock och släpper hoppknappen så kortas hoppet, det ska det inte göra.
-[x] Man fastnar ibland i de rörliga blocken om man rör sig mot dem eller hamnar mellan ett sådant och ett annat block. 

# Features
-[x] Editor. Just nu kan man inte generera en bana utan gräsblock, det borde man kunna göra. Just nu kan man inte sätta någon max height map till 0, det borde man kunna göra.
-[x] Editor. Man borde kunna spara banor i local storage och ladda dem igen. Just nu kan man bara exportera dem som JSON och klistra in i levels.js. Ska man editera måste man klistra in JSON i levels.js och ladda om sidan, vilket är lite bökigt. Det är svårt att få en överblick. Man borde kunna sätta ett namn på banan och sen spara den.
-[x] Lägg till en fristående level editor. Se nedan specifikationer.
-[x] Implementera ljud och musik (ZzFX ljudeffekter + upbeat/ambient chiptune BGM)
-[ ] Procedural arpeggiator för musikmotorn (framtida storleksoptimering vid behov)
-[x] Lägg till ljus och skuggor (WebGL2, shadow mapping)
-[ ] Implementera wall jump (skippas/avvaktas tillsvidare för att spara plats och fokusera på spelkänsla)
-[x] Lägg till ett myntobject som när spelaren når det slutför banan. Texturen finns i textures.png vid 16, 16 och är en 16x16 sprite. Myntet ska vara en billboard-sprite som roterar.
-[x] Gör spelet responsivt till fönsterstorleken.
-[x] Lägg till mobile controls (touchscreen buttons)
-[x] Startskärm med spelets titel (textures.png vid 32, 16) och Start/Continue-knapp.
-[x] Local storage för att spara vilken nivå man är på.

