<?php
// Dossier courant = /games
$folder = __DIR__;
$dirs   = array_filter(glob($folder . '/*'), 'is_dir');

// Dossiers à ignorer
$ignore = ['.', '..', '.well-known', 'cgi-bin'];

// Overrides manuels (optionnels)
$manualDescriptions = [
    'jeu niaiseux'        => "Petit jeu délire pour passer le temps.",
    'geometry dash like'  => "Runner rythmique inspiré de Geometry Dash."
];

$manualIcons = [
    'jeu niaiseux'        => '🎈',
    'geometry dash like'  => '⚡'
];

$manualCategories = [
    'jeu niaiseux'        => 'funny',
    'geometry dash like'  => 'platformer'
];

// Libellés de catégories
$categoryLabels = [
    'arcade'     => 'Arcade',
    'platformer' => 'Plateforme',
    'funny'      => 'Funny',
    'puzzle'     => 'Puzzle',
    'autres'     => 'Autres'
];

// Fonction : joli nom à partir du dossier
function prettyName($folderName) {
    $name = str_replace(['-', '_'], ' ', $folderName);
    return ucwords($name);
}

// Description automatique si non définie
function autoDescription($folderName) {
    $pretty = prettyName($folderName);
    return "Jeu « $pretty » à découvrir directement dans ton navigateur.";
}

// Deviner la catégorie à partir du nom
function guessCategory($folderName) {
    $name = strtolower($folderName);
    if (str_contains($name, 'dash') || str_contains($name, 'runner') || str_contains($name, 'jump')) {
        return 'platformer';
    }
    if (str_contains($name, 'arcade') || str_contains($name, 'shooter') || str_contains($name, 'space')) {
        return 'arcade';
    }
    if (str_contains($name, 'puzzle') || str_contains($name, 'logic') || str_contains($name, 'brain')) {
        return 'puzzle';
    }
    if (str_contains($name, 'fun') || str_contains($name, 'niaiseux') || str_contains($name, 'meme')) {
        return 'funny';
    }
    return 'autres';
}

// Chercher une vignette dans le dossier du jeu
function findThumbnail($dirPath, $folderName) {
    $candidates = [
        'thumbnail.jpg', 'thumbnail.png',
        'thumb.jpg', 'thumb.png',
        'cover.jpg', 'cover.png',
        'poster.jpg', 'poster.png'
    ];

    foreach ($candidates as $file) {
        $full = $dirPath . '/' . $file;
        if (file_exists($full)) {
            // URL relative : dossierJeu/fichier
            return rawurlencode(basename($dirPath)) . '/' . rawurlencode($file);
        }
    }

    // Fallback : image aléatoire
    return 'https://picsum.photos/seed/' . urlencode($folderName) . '/400/250';
}

// Préparer la liste de jeux
$games = [];

foreach ($dirs as $d) {
    $name = basename($d);
    if (in_array($name, $ignore)) continue;

    $pretty       = prettyName($name);
    $description  = $manualDescriptions[$name] ?? autoDescription($name);
    $icon         = $manualIcons[$name]        ?? '🎮';
    $category     = $manualCategories[$name]   ?? guessCategory($name);
    $thumbnailUrl = findThumbnail($d, $name);

    $games[] = [
        'folder'      => $name,
        'pretty'      => $pretty,
        'description' => $description,
        'icon'        => $icon,
        'category'    => $category,
        'thumb'       => $thumbnailUrl
    ];
}

// Trier les jeux par nom
usort($games, fn($a, $b) => strcmp($a['pretty'], $b['pretty']));
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Game Lobby</title>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

body {
  background: radial-gradient(circle at top, #101424, #05060d);
  color: #fff;
  min-height: 100vh;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 6%;
}

.header-title {
  font-size: 2.2rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: 1px solid rgba(255,255,255,0.25);
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.btn:hover {
  background: rgba(255,255,255,0.12);
}

/* Filters */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 6% 15px;
}

.filter-btn {
  border-radius: 999px;
  padding: 6px 14px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
}

.filter-btn.active {
  background: linear-gradient(135deg, #4f8bff, #6cc7ff);
  border-color: transparent;
  color: #000;
}

/* Grid */
.container {
  width: 88%;
  max-width: 1200px;
  margin: 10px auto 60px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
}

/* Card */
.card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  text-decoration: none;
  color: white;
  transform: translateY(10px);
  opacity: 0;
  animation: fadeUp 0.5s forwards;
}

.card-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card:hover {
  transform: translateY(-8px) scale(1.03);
  border-color: #4f8bff;
  box-shadow: 0 0 30px #4f8bff55;
}

.card-img {
  width: 100%;
  height: 170px;
  background-size: cover;
  background-position: center;
}

.card-content {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-desc {
  font-size: 0.9rem;
  opacity: 0.8;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-pill {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.9;
}

.play-btn {
  padding: 7px 14px;
  background: linear-gradient(135deg, #4f8bff, #6cc7ff);
  border: none;
  border-radius: 999px;
  color: #000;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
}

.play-btn:hover {
  filter: brightness(1.15);
}

/* Animations */
@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
</head>
<body>

<!-- Musique de fond (mets un fichier lobby-music.mp3 dans /games/) -->
<audio id="bgm" src="lobby-music.mp3" loop></audio>

<header class="header">
  <div class="header-title">🎮 Game Lobby</div>
  <div class="header-actions">
    <button class="btn" id="musicToggle">🔇 Musique</button>
  </div>
</header>

<div class="filters">
  <button class="filter-btn active" data-filter="all">Tous les jeux</button>
  <?php foreach ($categoryLabels as $key => $label): ?>
    <button class="filter-btn" data-filter="<?php echo htmlspecialchars($key); ?>">
      <?php echo htmlspecialchars($label); ?>
    </button>
  <?php endforeach; ?>
</div>

<div class="container">
<?php
$index = 0;
foreach ($games as $game):
    $delay = 0.05 * $index; // petit délai d'apparition
    $index++;
    $catKey = $game['category'];
    $catLabel = $categoryLabels[$catKey] ?? $categoryLabels['autres'];
?>
  <a href="<?php echo rawurlencode($game['folder']); ?>/"
     class="card"
     data-category="<?php echo htmlspecialchars($catKey); ?>"
     style="animation-delay: <?php echo number_format($delay, 2); ?>s;">
    <div class="card-inner">
      <div class="card-img" style="background-image:url('<?php echo htmlspecialchars($game['thumb']); ?>');"></div>
      <div class="card-content">
        <div class="card-title">
          <span><?php echo htmlspecialchars($game['icon']); ?></span>
          <span><?php echo htmlspecialchars($game['pretty']); ?></span>
        </div>
        <div class="card-desc">
          <?php echo htmlspecialchars($game['description']); ?>
        </div>
        <div class="card-footer">
          <span class="category-pill"><?php echo htmlspecialchars($catLabel); ?></span>
          <button class="play-btn">Jouer</button>
        </div>
      </div>
    </div>
  </a>
<?php endforeach; ?>
</div>

<script>
// Filtre par catégories
const filterButtons = document.querySelectorAll('.filter-btn');
const cards         = document.querySelectorAll('.card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    cards.forEach(card => {
      const cat = card.dataset.category;
      if (filter === 'all' || filter === cat) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Musique : play / pause
const bgm   = document.getElementById('bgm');
const toggle = document.getElementById('musicToggle');
let musicOn = false;

toggle.addEventListener('click', () => {
  musicOn = !musicOn;
  if (musicOn) {
    bgm.volume = 0.35;
    bgm.play().catch(() => {});
    toggle.textContent = '🔊 Musique';
  } else {
    bgm.pause();
    toggle.textContent = '🔇 Musique';
  }
});
</script>

</body>
</html>
