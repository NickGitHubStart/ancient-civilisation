# Quellen — Giza, Phase 1

Jede Zahl im Modell zeigt auf eine `source.id` plus Stelle (`loc`). Public-Domain-Auszüge liegen in `excerpts/`. Geschützte Werke nur als Zitat.

## Vermessung (Geometrie)

| id | Werk | Wofür | Lizenz |
|---|---|---|---|
| petrie-1883 | W. M. Flinders Petrie, *The Pyramids and Temples of Gizeh*, Field & Tuer, London 1883 | Inneres, Elle, Winkel, Höhe. Maße in Zoll. | Public Domain. https://www.ronaldbirdsall.com/gizeh/petrie/ |
| cole-1925 | J. H. Cole, *Determination of the Exact Size and Orientation of the Great Pyramid of Gîza*, Survey of Egypt Paper No. 39, Cairo 1925 | Basisseiten in Metern, True-North 3′ 06″. | Public Domain |
| dash-2015 | Glen Dash, *Where, Precisely, are the Three Pyramids of Giza?* (rev. 2017) | Relative Lagen Khufu / Khafre / Menkaure. | Cite-only |
| lehner-1997 | Mark Lehner, *The Complete Pyramids*, Thames & Hudson 1997 | Heutige Höhe, Khafre/Menkaure-Maße. | Cite-only |

## Entdeckungen und Deutungen (Hotspots, nicht Geometrie)

| id | Werk | Wofür | Lizenz |
|---|---|---|---|
| scanpyramids-2017 | Morishima et al., *Nature* 552 (2017), doi:10.1038/nature24647 | Big Void ≥ 30 m über der Galerie. | Cite-only |
| stecchini-hancock | Stecchini; Hancock, *Fingerprints of the Gods* (1995) | 1:43 200 Erde-Maßstab. Theorie. | Cite-only |
| bauval-1994 | Bauval & Gilbert, *The Orion Mystery* (1994) | Orion-Gürtel, Schacht-Sterne. Theorie. | Cite-only |
| dunn-1998 | Christopher Dunn, *The Giza Power Plant* (1998) | Königskammer als Maschine. Theorie. | Cite-only |
| collins-2019 | Andrew Collins, Ancient Origins 2019 | Gemessene Raummoden (~49,5 Hz). Experiment. | Cite-only |

## Konvention

- Kanonisch ist die Zahl, die der Vermesser aufgeschrieben hat (`original.value` + `original.unit`).
- Meter und Königselle werden zur Laufzeit gerechnet (`src/giza/units.js`).
- Die Königselle ist 20,632 ± 0,004 Zoll (Petrie §52, Königskammer-Basis).
