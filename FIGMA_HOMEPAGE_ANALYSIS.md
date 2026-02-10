# ANALYSE COMPLÈTE - PAGE ACCUEIL KPSULL (Figma)

## 1. LISTE COMPLÈTE DES ENFANTS DIRECTS DE "Acceuil" (1:2)

### [0] BG - Rectangle de fond gris (1:4)
- **Type**: RECTANGLE
- **Position**: x=0, y=1158
- **Dimensions**: 1920 × 5943
- **Couleur**: #D9D9D9 (fond gris)
- **Rôle**: Fond gris de la page sous le hero

### [1] Tartan pattern (1:182)
- **Type**: RECTANGLE
- **Position**: x=0, y=1080
- **Dimensions**: 1920 × 246
- **Rôle**: Motif tartan de séparation

### [2] grauers Rechteck (1:183)
- **Type**: RECTANGLE
- **Position**: x=0, y=1080
- **Dimensions**: 1920 × 246
- **Rôle**: Rectangle gris (même position que tartan)

### [3] Rectangle 72 (2028:740)
- **Type**: RECTANGLE
- **Position**: x=0, y=1080
- **Dimensions**: 1920 × 246
- **Rôle**: Rectangle supplémentaire (même zone)

### [4] Group 6 - CATEGORY SLIDER (13:2047) ⭐
- **Type**: GROUP
- **Position**: x=221, y=195
- **Dimensions**: 1477 × 689
- **Rôle**: Slider de catégories au-dessus du hero
- **Structure interne**:
  - **Item (13:2048)**: FRAME avec mode row, alignement center
  - Dimensions de l'item: width=1324
  - Contient: Calque_1 (2002:493) + Container (13:2049)
  - Boutons de navigation inclus

### [5] Skater guy - IMAGE HERO (1:3)
- **Type**: RECTANGLE
- **Position**: x=0, y=0
- **Dimensions**: 1920 × 1080 (plein écran)
- **Rôle**: Image de fond du hero (skater)

### [6] Group - LOGO "L'ANTIDOTE" (1:36)
- **Type**: IMAGE-SVG
- **Position**: x=83, y=919.45
- **Dimensions**: 643.73 × 43.55
- **Rôle**: Slogan SVG "L'ANTIDOTE" sur le hero

### [7] Texte de présentation (1:164)
- **Type**: TEXT
- **Position**: x=98, y=1195
- **Dimensions**: 1674 × 88
- **Contenu**: "Une plateforme reliant créateurs de mode locaux et passionnés, offrant des pièces uniques et artisanales, accessibles à vous, chaque jour."
- **Rôle**: Description principale sous le hero

### [8] Cleaning icons (1:254)
- **Type**: IMAGE-SVG
- **Position**: x=1635.5, y=1193.49
- **Dimensions**: 175.44 × 61.71
- **Rôle**: Icônes de nettoyage (décoration)

### [9] Footer (13:2013)
- **Type**: GROUP
- **Position**: x=92, y=6351
- **Dimensions**: 1754 × 526
- **Contenu**:
  - Rectangle 11 (fond)
  - "COPYRIGHT 2025"
  - "CONTACT@KPSULL.COM"
  - "Contactez l'équipe KPSULL"
  - Liens: CRÉATEURS, À PROPOS, SÉLECTION DU MOMENT
  - Logos SVG

### [10] Group 12 - Icône 1 (19:131)
- **Type**: IMAGE-SVG
- **Position**: x=1831, y=6485
- **Dimensions**: 15 × 16
- **Rôle**: Petite icône décorative

### [11] Group 12 - Icône 2 (19:132)
- **Type**: IMAGE-SVG
- **Position**: x=1827.5, y=6236.5
- **Dimensions**: 18.5 × 656.5
- **Rôle**: Icône verticale

### [12] Calque_1 - LOGO (2002:603)
- **Type**: IMAGE-SVG
- **Position**: x=89, y=587
- **Dimensions**: 281 × 282
- **Rôle**: Logo KPSULL (au milieu du hero)

### [13] Header (2057:566)
- **Type**: FRAME
- **Position**: x=-3, y=28
- **Dimensions**: 1925 × 70
- **Contenu**:
  - Rectangle 73 (fond)
  - Rectangles de design (25, 74, 71, 75)
  - Navigation: "Créateurs", "À propos", "Sélection du moment"
  - "Account" avec icône panier
  - Logo Calque_1
  - Lines 9 et 10 (décoratifs)

---

## 2. SECTIONS IDENTIFIABLES (de haut en bas)

### Hero Section (y: 0-1080)
- **Image de fond**: Skater guy (1:3) - 1920×1080
- **Logo central**: Calque_1 (2002:603) - x=89, y=587
- **Slogan**: "L'ANTIDOTE" (1:36) - x=83, y=919.45
- **Header**: (2057:566) - x=-3, y=28

### Category Slider (y: 195-884)
- **Group 6** (13:2047) - x=221, y=195, dimensions 1477×689
- Positionné AU-DESSUS du hero (z-index supérieur)

### Séparation Tartan (y: 1080-1326)
- **Tartan pattern** (1:182) + autres rectangles
- Hauteur: 246px

### Section de présentation (y: 1195-1283)
- **Texte principal** (1:164) - y=1195
- **Icônes** (1:254) - y=1193.49

### Fond gris principal (y: 1158-7101)
- **BG** (1:4) - #D9D9D9
- Contient toutes les sections intermédiaires

### Footer (y: 6351-6877)
- **Footer Group** (13:2013) - y=6351
- Hauteur: 526px

---

## 3. DÉTAILS DU CATEGORY SLIDER (13:2047)

### Position dans la page
- **X**: 221 (centré avec marges latérales ~221px)
- **Y**: 195 (positionné en haut, au-dessus du hero)
- **Largeur totale**: 1477
- **Hauteur**: 689

### Structure de l'Item (13:2048)
- **Type**: FRAME
- **Mode**: row (disposition horizontale)
- **Align items**: center (centrage vertical)
- **Sizing**: fixed horizontal & vertical
- **Position relative**: x=0, y=0
- **Largeur**: 1324
- **Contenu**:
  - Calque_1 (2002:493) - IMAGE SVG
  - Container (13:2049) - FRAME

### Boutons de navigation
- **Button - Navigate to next slide** (inclus dans Group 6)
- **Button - Navigate to next slide** (dupliqué pour gauche/droite)
- Contiennent des Frames "Img"

---

## 4. SECTIONS GRISES (#D9D9D9)

### BG Principal (1:4)
- **Couleur**: #D9D9D9
- **Position**: x=0, y=1158
- **Dimensions**: 1920 × 5943
- **Rôle**: Fond gris de toute la page sous le hero

**NOTE**: C'est la SEULE grande section grise identifiée dans les données.

---

## 5. POSITIONS Y ABSOLUES - RÉCAPITULATIF

| Élément | Y Start | Y End | Hauteur |
|---------|---------|-------|---------|
| Header | 28 | 98 | 70 |
| Category Slider | 195 | 884 | 689 |
| Hero (Skater guy) | 0 | 1080 | 1080 |
| Logo central | 587 | 869 | 282 |
| Slogan "L'ANTIDOTE" | 919.45 | 963 | 43.55 |
| Tartan séparation | 1080 | 1326 | 246 |
| BG Gris (début) | 1158 | 7101 | 5943 |
| Texte présentation | 1195 | 1283 | 88 |
| Icônes cleaning | 1193.49 | 1255.20 | 61.71 |
| Footer | 6351 | 6877 | 526 |

---

## 6. OBSERVATIONS IMPORTANTES

1. **Pas de sections "Offres du moment", "Top créateurs", "Découvrir les styles", "FAQ"** dans les données extraites
   - Ces sections peuvent être dans des enfants plus profonds (niveau 2+) non visibles dans la liste directe
   - Ou dans le contenu du BG gris (1:4) qui est un grand conteneur

2. **Structure en couches**:
   - Hero (0-1080) avec skater, logo, slogan, header
   - Category Slider SUPERPOSÉ (195-884)
   - Fond gris commençant à y=1158
   - Contenu intermédiaire non détaillé dans les enfants directs
   - Footer à y=6351

3. **Hauteur totale de la page**: ~6877px (jusqu'à la fin du footer)

4. **Le BG gris (#D9D9D9)** couvre la majeure partie de la page (y: 1158-7101), soit presque 6000px de hauteur

---

## RECOMMANDATION

Pour extraire les sections "Offres du moment", "Top créateurs", etc., il faudrait:
1. Explorer les enfants du BG (1:4) qui est probablement un conteneur
2. Ou analyser les niveaux de profondeur 2+ dans la hiérarchie Figma
3. Les données actuelles montrent uniquement les 14 enfants DIRECTS de la frame "Acceuil"
