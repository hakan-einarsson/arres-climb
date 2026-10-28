# Arre's Climb — spelsammanfattning

Ett litet 3D js13k-plattformsspel (WebGL2, egen minimal engine). Spelaren
klättrar genom en procedurellt genererad (Perlin noise + seed), voxelaktig
ö-bana bestående av block. Varje bana har exakt ett mål: hitta
enhörningsmyntet. Presentation: tredje person, billboard-sprite
spelare, orbit-kamera i fasta 90°-steg runt spelaren (ingen fri rotation).

Varje bana definieras av: en seed, en storlek, en maxhöjd (allt går till
Perlin-genereringen) plus en liten lista med manuella modifieringar
(block borttagna/tillagda utöver det som genereras) för att finslipa
layouten till nåt faktiskt pussligt och klarbart.

Det finns en editor för att göra banor. Allt relevant finns i src/editor, och den är fristående från spelet (ingen editor-specifik kod hamnar i js13k-bygget).

Just nu bygger vi spelet. Vi försöker optimera storlek när spelet är i mer eller mindre klart skick.

Spelet får inte bli större än 13 kB (inklusive allt, även ljud och musik). Vi har redan gjort en hel del optimering i storlek, men det finns mer att göra. Vi har en lista med buggar och features

