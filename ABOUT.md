# Arre's Climb — spelsammanfattning

Ett litet 3D-plattformsspel (WebGL2, egen minimal engine), ursprungligen
skapat för js13kGames och nu vidareutvecklat och publicerat på Wavedash.
Spelaren
klättrar genom en procedurellt genererad (Perlin noise + seed), voxelaktig
ö-bana bestående av block. Varje bana har exakt ett mål: hitta
enhörningsmyntet. Presentation: tredje person, billboard-sprite
spelare, orbit-kamera i fasta 90°-steg runt spelaren (ingen fri rotation).

Varje bana definieras av: en seed, en storlek, en maxhöjd (allt går till
Perlin-genereringen) plus en liten lista med manuella modifieringar
(block borttagna/tillagda utöver det som genereras) för att finslipa
layouten till nåt faktiskt pussligt och klarbart.

Det finns en editor för att göra banor. Allt relevant finns i src/editor, och den är fristående från spelet (ingen editor-specifik kod hamnar i spelbygget).

Spelet är inte längre bundet av 13 kB-gränsen från js13kGames. Den gäller inte
längre och ska inte styra utvecklingen: välj lösningar efter kvalitet och
underhållbarhet, inte efter storlek. Det gamla js13k-zipbygget finns kvar som
referens men används inte för den publicerade versionen (se README).

