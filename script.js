const themeToggle = document.getElementById('themeToggle');
const sendButton = document.getElementById('sendButton');
const adminToggle = document.getElementById('adminToggle');
const adminPanel = document.getElementById('adminPanel');
const adminLoginButton = document.getElementById('adminLoginButton');
const postFormContainer = document.getElementById('postFormContainer');
const addPostButton = document.getElementById('addPostButton');
const postsGrid = document.getElementById('postsGrid');
const contactLogin = document.getElementById('contactLogin');
const contactForm = document.getElementById('contactForm');
const googleSignin = document.getElementById('googleSignin');
const googleStatus = document.getElementById('googleStatus');
const aiToggle = document.getElementById('aiToggle');
const aiChatPanel = document.getElementById('aiChatPanel');
const aiClose = document.getElementById('aiClose');
const aiMessages = document.getElementById('aiMessages');
const aiInput = document.getElementById('aiInput');
const aiSendButton = document.getElementById('aiSendButton');
const aiFileInput = document.getElementById('aiFileInput');
const aiNote = document.getElementById('aiNote');
const gamesToggle = document.getElementById('gamesToggle');
const gamesPanel = document.getElementById('gamesPanel');
const gamesClose = document.getElementById('gamesClose');
const tetrisCanvas = document.getElementById('tetrisCanvas');
const startGameButton = document.getElementById('startGame');
const scoreElement = document.getElementById('score');
const playerNameInput = document.getElementById('playerName');
const leaderboardToggle = document.getElementById('leaderboardToggle');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const leaderboardClose = document.getElementById('leaderboardClose');

let tetrisPointerState = {
  active: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  moved: false,
};
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const leaderboardClose = document.getElementById('leaderboardClose');

const TETRIS_LEADERBOARD_KEY = 'tetrisLeaderboard';
const TETRIS_PLAYER_KEY = 'tetrisPlayer';
let tetrisLeaderboard = [];
let tetrisPlayer = null;

const adminPassword = '1583ADMIN'; // Mot de passe pour accéder au panneau admin (à changer pour plus de sécurité)
let isAdmin = false;
let posts = [];
let likedPosts = [];
let editingPostId = null;
let contactEmail = localStorage.getItem('contactEmail') || '';
let contactName = localStorage.getItem('contactName') || '';

(function() {
  emailjs.init('yryXbsEOJe94IMzDt'); // Remplacez par votre clé publique EmailJS
})();

const OPENAI_API_KEY = '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'; // Clé OpenAI non configurée par défaut, utilisation de l’IA locale.
const OPENAI_MODEL = 'gpt-3.5-turbo';

function updateButtonText() {
  const isDark = document.documentElement.classList.contains('dark');
  themeToggle.textContent = isDark ? 'Mode clair' : 'Mode sombre';
}

function loadPosts() {
  const stored = localStorage.getItem('sitePosts');
  posts = stored ? JSON.parse(stored) : [];
  posts.forEach(post => {
    if (typeof post.likes !== 'number') post.likes = 0;
  });
  likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
}

function savePosts() {
  localStorage.setItem('sitePosts', JSON.stringify(posts));
}

let firestoreReady = false;
let db = null;
let postsCollection = null;

function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyD1MwdQALxSR63rPYVch_p3j-0FrgWOJ04",
    authDomain: "mon-site-web-ec48a.firebaseapp.com",
    projectId: "mon-site-web-ec48a",
    storageBucket: "mon-site-web-ec48a.firebasestorage.app",
    messagingSenderId: "609638615194",
    appId: "1:609638615194:web:427b4ad948931e7481b723"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    postsCollection = db.collection('posts');
    firestoreReady = true;
    subscribePosts();
  } catch (error) {
    console.warn('Firebase n\'a pas pu être initialisé :', error);
  }
}

function subscribePosts() {
  if (!firestoreReady) return;
  postsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title || '',
        text: data.text || '',
        mediaType: data.mediaType || 'none',
        mediaUrl: data.mediaUrl || '',
        likes: typeof data.likes === 'number' ? data.likes : 0,
        createdAt: data.createdAt || ''
      });
    });
    savePosts();
    renderPosts();
  }, error => {
    console.error('Erreur Firestore posts :', error);
  });
}

function saveLikedPosts() {
  localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
}

function checkContactLogin() {
  if (contactEmail) {
    contactLogin.classList.add('hidden');
    contactForm.classList.remove('hidden');
    googleStatus.textContent = `Connecté avec ${contactEmail}`;
  } else {
    contactLogin.classList.remove('hidden');
    contactForm.classList.add('hidden');
    googleStatus.textContent = '';
  }
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (!payload || !payload.email) {
    alert('Impossible de récupérer les informations Google. Réessayez.');
    return;
  }
  contactEmail = payload.email;
  contactName = payload.name || '';
  localStorage.setItem('contactEmail', contactEmail);
  localStorage.setItem('contactName', contactName);
  checkContactLogin();
}

function initGoogleSignIn() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    return;
  }
  google.accounts.id.initialize({
    client_id: '682659403479-gdo2tkatobu289bmet22ev55pm5n6j0b.apps.googleusercontent.com',
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  google.accounts.id.renderButton(googleSignin, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
  });
  google.accounts.id.prompt();
}

function renderPosts() {
  postsGrid.innerHTML = '';
  if (posts.length === 0) {
    postsGrid.innerHTML = '<p>Aucun post pour le moment. Connecte-toi en admin pour en créer.</p>';
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;

    if (post.mediaType === 'image' && post.mediaUrl) {
      const img = document.createElement('img');
      img.src = post.mediaUrl;
      img.alt = post.title;
      card.appendChild(img);
    }

    if (post.mediaType === 'video' && post.mediaUrl) {
      const video = document.createElement('video');
      video.src = post.mediaUrl;
      video.controls = true;
      video.setAttribute('playsinline', '');
      card.appendChild(video);
    }

    const content = document.createElement('div');
    content.className = 'post-card-content';

    const title = document.createElement('h3');
    title.textContent = post.title || 'Post sans titre';
    content.appendChild(title);

    const text = document.createElement('p');
    text.textContent = post.text || '';
    content.appendChild(text);

    // Actions like and share
    const actions = document.createElement('div');
    actions.className = 'post-actions';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.innerHTML = '♥';
    if (likedPosts.includes(post.id)) {
      likeBtn.classList.add('liked');
    }
    likeBtn.addEventListener('click', () => toggleLike(post.id));

    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = post.likes;

    actions.appendChild(likeBtn);
    actions.appendChild(likeCount);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.innerHTML = '➤';
    shareBtn.addEventListener('click', () => sharePost(post));

    actions.appendChild(shareBtn);

    content.appendChild(actions);

    // Ajouter les boutons admin si connecté
    if (isAdmin) {
      const adminActions = document.createElement('div');
      adminActions.className = 'post-admin-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'button button-small button-edit';
      editBtn.textContent = 'Modifier';
      editBtn.addEventListener('click', () => startEditPost(post.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'button button-small button-delete';
      deleteBtn.textContent = 'Supprimer';
      deleteBtn.addEventListener('click', () => deletePost(post.id));

      adminActions.appendChild(editBtn);
      adminActions.appendChild(deleteBtn);
      content.appendChild(adminActions);
    }

    card.appendChild(content);
    postsGrid.appendChild(card);
  });
}

function showAdminPanel() {
  adminPanel.classList.toggle('hidden');
}

function showPostForm() {
  postFormContainer.classList.remove('hidden');
}

function addPost() {
  // Vérifier que l'utilisateur est admin
  if (!isAdmin) {
    alert('Vous devez être connecté en tant qu\'admin pour créer un post.');
    return;
  }

  const title = document.getElementById('postTitle').value.trim();
  const text = document.getElementById('postText').value.trim();
  const mediaType = document.getElementById('postMediaType').value;
  const mediaUrl = document.getElementById('postMediaUrl').value.trim();

  if (!title && !text && mediaType === 'none') {
    alert('Ajoute au moins un titre, du texte ou un média.');
    return;
  }

  if (editingPostId) {
    // Modification d'un post existant
    const postIndex = posts.findIndex(p => p.id === editingPostId);
    if (postIndex !== -1) {
      posts[postIndex] = {
        ...posts[postIndex],
        title,
        text,
        mediaType,
        mediaUrl,
      };
      if (firestoreReady) {
        postsCollection.doc(editingPostId).update({
          title,
          text,
          mediaType,
          mediaUrl,
        }).catch(error => {
          console.error('Erreur mise à jour post Firestore :', error);
        });
      }
    }
    editingPostId = null;
    document.getElementById('addPostButton').textContent = 'Ajouter le post';
  } else {
    // Création d'un nouveau post
    const newPost = {
      id: Date.now().toString(),
      title,
      text,
      mediaType,
      mediaUrl,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    posts.unshift(newPost);
    if (firestoreReady) {
      postsCollection.doc(newPost.id).set({
        title,
        text,
        mediaType,
        mediaUrl,
        likes: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(error => {
        console.error('Erreur création post Firestore :', error);
      });
    }
  }

  savePosts();
  renderPosts();
  document.getElementById('postTitle').value = '';
  document.getElementById('postText').value = '';
  document.getElementById('postMediaType').value = 'none';
  document.getElementById('postMediaUrl').value = '';
}

function startEditPost(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  editingPostId = postId;
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postText').value = post.text || '';
  document.getElementById('postMediaType').value = post.mediaType || 'none';
  document.getElementById('postMediaUrl').value = post.mediaUrl || '';
  document.getElementById('addPostButton').textContent = 'Enregistrer les modifications';
  
  // Scroll vers le formulaire
  document.getElementById('postFormContainer').scrollIntoView({ behavior: 'smooth' });
}

function deletePost(postId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
    posts = posts.filter(p => p.id !== postId);
    if (firestoreReady) {
      postsCollection.doc(postId).delete().catch(error => {
        console.error('Erreur suppression post Firestore :', error);
      });
    }
    savePosts();
    renderPosts();
  }
}

function toggleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const index = likedPosts.indexOf(postId);
  if (index > -1) {
    likedPosts.splice(index, 1);
    post.likes--;
  } else {
    likedPosts.push(postId);
    post.likes++;
  }
  if (firestoreReady) {
    postsCollection.doc(postId).update({ likes: post.likes }).catch(error => {
      console.error('Erreur mise à jour likes Firestore :', error);
    });
  }
  savePosts();
  saveLikedPosts();
  renderPosts();
}

function sharePost(post) {
  const text = `${post.title}\n${post.text}`;
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: text,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Contenu copié dans le presse-papiers !');
    });
  }
}

function openAiChat() {
  aiChatPanel.classList.remove('hidden');
  aiChatPanel.style.display = '';
  aiInput.focus();
}

function closeAiChat() {
  aiChatPanel.classList.add('hidden');
  aiChatPanel.style.display = 'none';
}

function openGames() {
  gamesPanel.classList.remove('hidden');
  gamesPanel.style.display = '';
}

function closeGames() {
  gamesPanel.classList.add('hidden');
  gamesPanel.style.display = 'none';
  stopTetris();
}

function loadTetrisLeaderboard() {
  try {
    const stored = localStorage.getItem(TETRIS_LEADERBOARD_KEY);
    tetrisLeaderboard = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Impossible de charger le classement Tetris :', error);
    tetrisLeaderboard = [];
  }
}

function saveTetrisLeaderboard() {
  localStorage.setItem(TETRIS_LEADERBOARD_KEY, JSON.stringify(tetrisLeaderboard));
}

function loadTetrisPlayer() {
  try {
    const stored = localStorage.getItem(TETRIS_PLAYER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const id = parsed && parsed.id ? parsed.id : createNewTetrisPlayer().id;
      const name = parsed && typeof parsed.name === 'string' ? parsed.name : 'Joueur';
      tetrisPlayer = {
        id,
        name: name.trim().slice(0, 20) || 'Joueur',
      };
    } else {
      tetrisPlayer = createNewTetrisPlayer();
    }
  } catch (error) {
    console.warn('Impossible de charger le joueur Tetris :', error);
    tetrisPlayer = createNewTetrisPlayer();
  }
  localStorage.setItem(TETRIS_PLAYER_KEY, JSON.stringify(tetrisPlayer));
  if (playerNameInput) {
    playerNameInput.value = tetrisPlayer.name;
  }
}

function createNewTetrisPlayer() {
  return {
    id: `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Joueur',
  };
}

function saveTetrisPlayerName(name) {
  if (!tetrisPlayer) {
    loadTetrisPlayer();
  }
  const trimmedName = (name || 'Joueur').trim().slice(0, 20) || 'Joueur';
  tetrisPlayer.name = trimmedName;
  localStorage.setItem(TETRIS_PLAYER_KEY, JSON.stringify(tetrisPlayer));
  if (playerNameInput) {
    playerNameInput.value = trimmedName;
  }
  return trimmedName;
}

function renderTetrisLeaderboard() {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = '';
  if (tetrisLeaderboard.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Aucun score enregistré pour le moment.';
    leaderboardList.appendChild(item);
    return;
  }
  tetrisLeaderboard.slice(0, 5).forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = `${entry.name} — ${entry.score} pts`;
    leaderboardList.appendChild(item);
  });
}

function updateTetrisLeaderboard(name, score) {
  const trimmedName = saveTetrisPlayerName(name);
  if (!tetrisPlayer) {
    loadTetrisPlayer();
  }
  const playerId = tetrisPlayer.id;
  let existingIndex = tetrisLeaderboard.findIndex(entry => entry.id === playerId);
  if (existingIndex === -1) {
    existingIndex = tetrisLeaderboard.findIndex(entry => entry.name === trimmedName && !entry.id);
  }

  if (existingIndex !== -1) {
    const existingEntry = tetrisLeaderboard[existingIndex];
    existingEntry.name = trimmedName;
    existingEntry.id = playerId;
    if (score > existingEntry.score) {
      existingEntry.score = score;
    }
  } else {
    tetrisLeaderboard.push({ id: playerId, name: trimmedName, score });
  }

  tetrisLeaderboard.sort((a, b) => b.score - a.score);
  tetrisLeaderboard = tetrisLeaderboard.slice(0, 5);
  saveTetrisLeaderboard();
  renderTetrisLeaderboard();
}

function panelDragStart(event) {
  if (event.button !== 0) return;
  const panel = event.currentTarget.closest('.ai-chat-panel, .games-panel, .leaderboard-panel');
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  panelDragState.active = true;
  panelDragState.panel = panel;
  panelDragState.startX = event.clientX;
  panelDragState.startY = event.clientY;
  panelDragState.panelStartLeft = rect.left;
  panelDragState.panelStartTop = rect.top;

  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
  document.body.style.userSelect = 'none';
}

function panelResizeStart(event) {
  event.stopPropagation();
  if (event.button !== 0) return;
  const panel = event.currentTarget.closest('.ai-chat-panel, .games-panel, .leaderboard-panel');
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  panelResizeState.active = true;
  panelResizeState.panel = panel;
  panelResizeState.startX = event.clientX;
  panelResizeState.startY = event.clientY;
  panelResizeState.panelStartWidth = rect.width;
  panelResizeState.panelStartHeight = rect.height;

  document.body.style.userSelect = 'none';
}

function panelPointerMove(event) {
  if (panelDragState.active && panelDragState.panel) {
    const dx = event.clientX - panelDragState.startX;
    const dy = event.clientY - panelDragState.startY;
    panelDragState.panel.style.left = `${Math.max(10, panelDragState.panelStartLeft + dx)}px`;
    panelDragState.panel.style.top = `${Math.max(10, panelDragState.panelStartTop + dy)}px`;
  }

  if (panelResizeState.active && panelResizeState.panel) {
    const dx = event.clientX - panelResizeState.startX;
    const dy = event.clientY - panelResizeState.startY;
    panelResizeState.panel.style.width = `${Math.max(280, panelResizeState.panelStartWidth + dx)}px`;
    panelResizeState.panel.style.height = `${Math.max(260, panelResizeState.panelStartHeight + dy)}px`;
  }
}

function panelPointerUp() {
  panelDragState.active = false;
  panelResizeState.active = false;
  panelDragState.panel = null;
  panelResizeState.panel = null;
  document.body.style.userSelect = '';
}

function initPanelInteractions() {
  const panels = [aiChatPanel, gamesPanel, leaderboardPanel];
  panels.forEach(panel => {
    if (!panel) return;
    const header = panel.querySelector('.ai-chat-header, .games-header');
    const resizer = panel.querySelector('.panel-resizer');
    if (header) {
      header.classList.add('panel-draggable');
      header.addEventListener('mousedown', panelDragStart);
    }
    if (resizer) {
      resizer.addEventListener('mousedown', panelResizeStart);
    }
  });

  document.addEventListener('mousemove', panelPointerMove);
  document.addEventListener('mouseup', panelPointerUp);
  document.addEventListener('mouseleave', panelPointerUp);
}

const panelDragState = {
  active: false,
  panel: null,
  startX: 0,
  startY: 0,
  panelStartLeft: 0,
  panelStartTop: 0
};

const panelResizeState = {
  active: false,
  panel: null,
  startX: 0,
  startY: 0,
  panelStartWidth: 0,
  panelStartHeight: 0
};

function appendAiMessage(role, text, imageUrl) {
  const message = document.createElement('div');
  message.className = `ai-message ai-${role}`;
  if (text) {
    message.innerHTML = `<p>${text}</p>`;
  }
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = 'Image envoyée';
    message.appendChild(image);
  }
  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function setAiStatus(message) {
  if (aiNote) {
    aiNote.textContent = message;
  }
}

function isRequestAllowed(text) {
  const forbidden = ['sexe', 'porn', 'viol', 'drugs', 'kill', 'bomb', 'terror', 'hack', 'pirate', 'racist', 'insult', 'crime'];
  const normalized = text.toLowerCase();
  return !forbidden.some(word => normalized.includes(word));
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function fetchOpenAiResponse(prompt, hasImage) {
  if (!OPENAI_API_KEY.trim()) {
    console.warn('Clé OpenAI absente : utilisation de l’IA locale.');
    return generateAiResponse(prompt, hasImage);
  }

  const systemMessage = {
    role: 'system',
    content: 'Tu es un assistant utile et respectueux. Tu réponds aux demandes simples et appropriées sans entrer dans des sujets inappropriés.'
  };
  let userContent = prompt || '';
  if (hasImage) {
    userContent += (userContent ? '\n' : '') + 'Une image a été envoyée avec cette demande. Réponds de manière claire et simple en tenant compte de cette information.';
  }
  if (!userContent) {
    userContent = 'L’utilisateur a envoyé une image sans texte. Réponds de manière simple et utile.';
  }
  if (hasImage) {
    userContent += ' Note : l’image est reçue, mais je ne peux analyser que le contexte textuel dans cette interface.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [systemMessage, { role: 'user', content: userContent }],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return generateAiResponse(prompt, hasImage);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || 'Désolé, je n’ai pas obtenu de réponse. Essaie une autre question simple.';
  } catch (error) {
    console.error('OpenAI fetch error:', error);
    return 'Désolé, il y a eu un problème avec l’IA. Réessaye dans quelques instants.';
  }
}

function generateAiResponse(text, hasImage) {
  const normalized = (text || '').trim().toLowerCase();
  const greetings = ['bonjour', 'salut', 'coucou', 'hey', 'hello'];
  const farewells = ['au revoir', 'à bientôt', 'bye', 'salut'];
  const thanks = ['merci', 'thanks', 'super', 'top', 'cool'];

  if (hasImage && !normalized) {
    return randomChoice([
      'J’ai bien reçu ton image. Dis-moi ce que tu veux savoir ou ce que tu cherches.',
      'Image reçue ! Tu peux maintenant me poser une question simple sur ce que tu as envoyé.',
      'Merci pour l’image. Si tu veux, décris ce que tu veux que je regarde ou que je t’explique.'
    ]);
  }

  if (!normalized) {
    return randomChoice([
      'Écris-moi une question simple ou envoie une image pour commencer.',
      'Je suis prêt, pose-moi une question claire et je te réponds simplement.',
      'Je peux t’aider sur un sujet simple — essaie une question courte.'
    ]);
  }

  if (greetings.some(word => normalized.includes(word))) {
    return randomChoice([
      'Salut ! Que veux-tu savoir aujourd’hui ?',
      'Bonjour ! Pose-moi une question simple ou envoie une image.',
      'Salut ! Je suis là pour t’aider sur des sujets simples.'
    ]);
  }

  if (farewells.some(word => normalized.includes(word))) {
    return randomChoice([
      'À bientôt ! N’hésite pas à revenir si tu as d’autres questions.',
      'Au revoir ! Je suis là si tu veux poser une autre question.',
      'À plus tard ! Reviens quand tu veux pour une autre question simple.'
    ]);
  }

  if (thanks.some(word => normalized.includes(word))) {
    return randomChoice([
      'Avec plaisir ! Si tu veux, tu peux me poser autre chose.',
      'Merci ! Dis-moi si tu veux un autre renseignement.',
      'Content d’avoir pu aider. Pose-moi une autre question si tu veux.'
    ]);
  }

  if (normalized.includes('qui es') || normalized.includes('tu es')) {
    return randomChoice([
      'Je suis une IA locale simple intégrée à ce site. Je réponds aux questions claires et respectueuses.',
      'Je suis le chat IA du site. Je peux répondre à des questions simples et donner des conseils basiques.',
      'Je suis un assistant du site, conçu pour aider sur des sujets simples sans clé API.'
    ]);
  }

  if (normalized.includes('aide') || normalized.includes('comment') || normalized.includes('peux-tu') || normalized.includes('peux tu')) {
    return randomChoice([
      'Je suis là pour t’aider. Pose-moi une question simple sur un sujet clair.',
      'Demande-moi quelque chose de simple, comme une explication courte ou un conseil basique.',
      'Je peux te donner une réponse simple si tu formules une question claire.'
    ]);
  }

  if (normalized.includes('image') || normalized.includes('photo')) {
    return randomChoice([
      'Je reçois ton image, mais je traite surtout le texte. Dis-moi ce que tu veux savoir à propos de l’image.',
      'Ton image est bien reçue. Pose-moi une question claire sur son contenu ou son usage.',
      'Je peux t’aider à décrire une image si tu me dis ce que tu veux en savoir.'
    ]);
  }

  if (normalized.includes('site') || normalized.includes('web') || normalized.includes('page')) {
    return randomChoice([
      'Ce site présente un chat IA local et un espace de posts. Je peux répondre à des questions simples dessus.',
      'Je suis intégré à cette page web pour aider à répondre à des questions simples sans API externe.',
      'Le site contient un chat IA et des posts, et je suis là pour te répondre avec des réponses simples.'
    ]);
  }

  if (normalized.includes('heure') || normalized.includes('météo') || normalized.includes('temps')) {
    return randomChoice([
      'Je ne peux pas lire la météo en direct, mais je peux te donner une réponse simple sur les sujets que tu demandes.',
      'Je n’ai pas accès au temps réel ici, mais je peux t’aider avec une réponse générale ou des conseils.',
      'Je ne vois pas la météo actuelle. Pose-moi une autre question simple si tu veux.'
    ]);
  }

  if (normalized.includes('blague') || normalized.includes('humour') || normalized.includes('drôle')) {
    return randomChoice([
      'Pourquoi les programmeurs confondent Halloween et Noël ? Parce que OCT 31 = DEC 25.',
      'Voici une blague simple : pourquoi l’ordinateur était fatigué ? Parce qu’il avait trop de bits à traiter.',
      'Je peux te faire rire un peu : un bug entre dans un bar et le barman dit "Pas de blague".'
    ]);
  }

  if (normalized.includes('pourquoi') || normalized.includes('pq')) {
    return randomChoice([
      'C\'est une bonne question. La réponse dépend souvent du contexte. Peux-tu donner plus de détails ?',
      'Pourquoi ? C\'est une question profonde. En général, les choses arrivent pour des raisons variées.',
      'Je ne peux pas lire dans les pensées, mais je peux essayer de t\'expliquer si tu précises.'
    ]);
  }

  // Réponses basiques à des sujets courants
  if (normalized.includes('ciel') || normalized.includes('bleu')) {
    return 'Le ciel apparaît bleu parce que la lumière du soleil se diffuse dans l\'atmosphère terrestre.';
  }

  if (normalized.includes('ordinateur') || normalized.includes('pc') || normalized.includes('informatique')) {
    return 'Les ordinateurs sont des machines qui traitent des informations. Ils utilisent un processeur, de la mémoire RAM, un disque dur, etc.';
  }

  if (normalized.includes('internet') || normalized.includes('web')) {
    return 'Internet est un réseau mondial qui connecte des milliards d\'ordinateurs. Il permet de partager des informations et communiquer.';
  }

  if (normalized.includes('couleur') || normalized.includes('couleurs')) {
    return 'Les couleurs sont créées par la lumière. Les couleurs primaires sont le rouge, le bleu et le vert.';
  }

  if (normalized.includes('animaux') || normalized.includes('animal')) {
    return 'Les animaux sont des êtres vivants qui ne sont pas des plantes. Il existe des mammifères, oiseaux, reptiles, etc.';
  }

  if (normalized.includes('nourriture') || normalized.includes('manger')) {
    return 'La nourriture est essentielle pour la santé. Mangez équilibré : fruits, légumes, protéines, glucides et matières grasses.';
  }

  if (normalized.includes('sport') || normalized.includes('sports')) {
    return 'Le sport est bon pour la santé. Il y a le football, le basket, la natation, etc. Choisis celui que tu aimes !';
  }

  if (normalized.includes('musique') || normalized.includes('chanson')) {
    return 'La musique est un art qui utilise le son. Il y a du rock, du pop, du classique, etc. Quelle est ta préférée ?';
  }

  // Fallback plus varié et utile
  return randomChoice([
    'Je ne suis pas sûr de comprendre ta question. Peux-tu la reformuler de manière plus simple ?',
    'Essaie de poser une question plus claire ou sur un sujet que je connais.',
    'Je réponds mieux aux questions simples. Dis-moi ce que tu veux savoir exactement.',
    'Pose-moi une question sur le site, une blague ou un sujet basique.',
    'Je peux t’aider avec des conseils simples ou des explications courtes. Essaie autre chose.'
  ]);
}

// Tetris Game
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['#000', '#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fff'];

let board = [];
let currentPiece = null;
let currentPieceId = 1;
let currentX = 0;
let currentY = 0;
let score = 0;
let gameInterval = null;
let ctx = null;

const PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]]  // Z
];

function initBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      board[r][c] = 0;
    }
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        ctx.fillStyle = COLORS[board[r][c]];
        ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
  // Draw current piece
  if (currentPiece) {
    for (let r = 0; r < currentPiece.length; r++) {
      for (let c = 0; c < currentPiece[r].length; c++) {
        if (currentPiece[r][c]) {
          ctx.fillStyle = COLORS[currentPieceId];
          ctx.fillRect((currentX + c) * BLOCK_SIZE, (currentY + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#000';
          ctx.strokeRect((currentX + c) * BLOCK_SIZE, (currentY + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
  }
}

function newPiece() {
  const type = Math.floor(Math.random() * PIECES.length);
  currentPieceId = type + 1;
  currentPiece = PIECES[type].map(row => [...row]);
  currentX = Math.floor(COLS / 2) - 1;
  currentY = 0;
  if (collision()) {
    gameOver();
  }
}

function collision() {
  for (let r = 0; r < currentPiece.length; r++) {
    for (let c = 0; c < currentPiece[r].length; c++) {
      if (currentPiece[r][c]) {
        const newX = currentX + c;
        const newY = currentY + r;
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
          return true;
        }
      }
    }
  }
  return false;
}

function placePiece() {
  for (let r = 0; r < currentPiece.length; r++) {
    for (let c = 0; c < currentPiece[r].length; c++) {
      if (currentPiece[r][c]) {
        board[currentY + r][currentX + c] = currentPieceId;
      }
    }
  }
  clearLines();
  newPiece();
}

function clearLines() {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      score += 100;
      scoreElement.textContent = `Score: ${score}`;
      r++; // Check the same row again
    }
  }
}

function rotatePiece() {
  const rotated = currentPiece[0].map((_, index) => currentPiece.map(row => row[index]).reverse());
  const oldPiece = currentPiece;
  currentPiece = rotated;
  if (collision()) {
    currentPiece = oldPiece;
  }
}

function movePiece(dx, dy) {
  currentX += dx;
  currentY += dy;
  if (collision()) {
    currentX -= dx;
    currentY -= dy;
    if (dy > 0) {
      placePiece();
    }
  }
}

function dropPiece() {
  while (!collision()) {
    currentY++;
  }
  currentY--;
  placePiece();
}

function gameLoop() {
  movePiece(0, 1);
  drawBoard();
}

function startTetris() {
  if (gameInterval) return;
  initBoard();
  score = 0;
  scoreElement.textContent = 'Score: 0';
  ctx = tetrisCanvas.getContext('2d');
  newPiece();
  gameInterval = setInterval(gameLoop, 500);
  startGameButton.textContent = 'Arrêter';
}

function stopTetris() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
    startGameButton.textContent = 'Démarrer';
  }
}

function gameOver() {
  stopTetris();
  updateTetrisLeaderboard(playerNameInput?.value || 'Joueur', score);
  alert('Game Over! Score: ' + score);
}

function onTetrisPointerDown(event) {
  if (!gameInterval || !tetrisCanvas) return;
  event.preventDefault();
  tetrisPointerState.active = true;
  tetrisPointerState.startX = event.clientX;
  tetrisPointerState.startY = event.clientY;
  tetrisPointerState.lastX = event.clientX;
  tetrisPointerState.lastY = event.clientY;
  tetrisPointerState.moved = false;
  tetrisCanvas.setPointerCapture(event.pointerId);
}

function onTetrisPointerMove(event) {
  if (!tetrisPointerState.active) return;
  const dx = event.clientX - tetrisPointerState.lastX;
  const dy = event.clientY - tetrisPointerState.lastY;
  if (Math.abs(dx) >= 20) {
    movePiece(dx > 0 ? 1 : -1, 0);
    tetrisPointerState.lastX = event.clientX;
    tetrisPointerState.moved = true;
    drawBoard();
  } else if (dy >= 25) {
    movePiece(0, 1);
    tetrisPointerState.lastY = event.clientY;
    tetrisPointerState.moved = true;
    drawBoard();
  }
}

function onTetrisPointerUp(event) {
  if (!tetrisPointerState.active) return;
  const totalDx = event.clientX - tetrisPointerState.startX;
  const totalDy = event.clientY - tetrisPointerState.startY;
  if (!tetrisPointerState.moved && Math.abs(totalDx) < 15 && Math.abs(totalDy) < 15) {
    rotatePiece();
    drawBoard();
  }
  tetrisPointerState.active = false;
  tetrisPointerState.moved = false;
  if (tetrisCanvas && tetrisCanvas.hasPointerCapture(event.pointerId)) {
    tetrisCanvas.releasePointerCapture(event.pointerId);
  }
}

if (tetrisCanvas) {
  tetrisCanvas.addEventListener('pointerdown', onTetrisPointerDown);
  tetrisCanvas.addEventListener('pointermove', onTetrisPointerMove);
  tetrisCanvas.addEventListener('pointerup', onTetrisPointerUp);
  tetrisCanvas.addEventListener('pointercancel', onTetrisPointerUp);
}

// Controls
document.addEventListener('keydown', (e) => {
  if (!gameInterval) return;
  switch (e.key) {
    case 'ArrowLeft':
      movePiece(-1, 0);
      break;
    case 'ArrowRight':
      movePiece(1, 0);
      break;
    case 'ArrowDown':
      movePiece(0, 1);
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
    case ' ':
      e.preventDefault();
      dropPiece();
      break;
  }
  drawBoard();
});

async function handleAiSend() {
  const userText = aiInput.value.trim();
  const file = aiFileInput.files[0];
  if (!userText && !file) {
    setAiStatus('Écris une demande ou ajoute une image.');
    return;
  }
  if (userText && !isRequestAllowed(userText)) {
    appendAiMessage('user', userText);
    appendAiMessage('bot', 'Cette demande n’est pas autorisée. Pose une question simple, respectueuse et claire.');
    aiInput.value = '';
    aiFileInput.value = '';
    aiFileInput.previousElementSibling.textContent = '+ Image';
    setAiStatus('Demande non autorisée.');
    return;
  }

  const userLabel = userText || (file ? 'J’ai envoyé une image.' : '');
  if (userLabel) {
    appendAiMessage('user', userLabel);
  }
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      appendAiMessage('user', '', reader.result);
    };
    reader.readAsDataURL(file);
  }

  aiSendButton.disabled = true;
  setAiStatus('Envoi à l’IA...');

  const response = await fetchOpenAiResponse(userText, Boolean(file));
  appendAiMessage('bot', response);

  aiSendButton.disabled = false;
  setAiStatus('L’IA répond à des demandes simples et respectueuses. Pas de questions étranges.');

  aiInput.value = '';
  aiFileInput.value = '';
  aiFileInput.previousElementSibling.textContent = '+ Image';
}

function loginAdmin() {
  const passwordInput = document.getElementById('adminPassword').value;
  if (passwordInput === adminPassword) {
    isAdmin = true;
    showPostForm();
    adminLoginButton.textContent = 'Admin connecté';
    adminLoginButton.disabled = true;
    document.getElementById('adminPassword').disabled = true;
    return;
  }
  alert('Mot de passe incorrect.');
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  updateButtonText();
});

sendButton.addEventListener('click', () => {
  if (!contactEmail) {
    alert('Veuillez vous connecter avec Google.');
    return;
  }
  const name = document.getElementById('name').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!name || !message) {
    alert('Veuillez remplir tous les champs.');
    return;
  }
  emailjs.send('service_2xb0xvc', 'template_vvnsjwy', {
    from_name: name || contactName,
    from_email: contactEmail,
    message: message,
    to_email: 'fntomate3.0@gmail.com'
  }).then(() => {
    alert('Message envoyé avec succès !');
    document.getElementById('name').value = '';
    document.getElementById('message').value = '';
  }).catch((error) => {
    alert('Erreur lors de l\'envoi : ' + (error.text || 'Une erreur est survenue.'));
  });
});

adminToggle.addEventListener('click', showAdminPanel);
adminLoginButton.addEventListener('click', loginAdmin);
addPostButton.addEventListener('click', addPost);
aiToggle.addEventListener('click', openAiChat);
if (aiClose) {
  aiClose.addEventListener('click', (event) => {
    event.preventDefault();
    closeAiChat();
  });
} else {
  console.warn('aiClose button not found');
}
aiSendButton.addEventListener('click', handleAiSend);
aiInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleAiSend();
  }
});
aiFileInput.addEventListener('change', () => {
  if (aiFileInput.files.length > 0) {
    aiFileInput.previousElementSibling.textContent = 'Image sélectionnée';
  }
});
gamesToggle.addEventListener('click', openGames);
gamesClose.addEventListener('click', (event) => {
  event.preventDefault();
  closeGames();
});
startGameButton.addEventListener('click', () => {
  if (gameInterval) {
    stopTetris();
  } else {
    startTetris();
  }
});

if (leaderboardToggle) {
  leaderboardToggle.addEventListener('click', () => {
    if (!leaderboardPanel) return;
    leaderboardPanel.classList.toggle('hidden');
  });
}

if (leaderboardClose) {
  leaderboardClose.addEventListener('click', () => {
    if (!leaderboardPanel) return;
    leaderboardPanel.classList.add('hidden');
  });
}

// Initialisation
loadPosts();
renderPosts();
updateButtonText();
checkContactLogin();
loadTetrisLeaderboard();
loadTetrisPlayer();
if (playerNameInput) {
  playerNameInput.addEventListener('blur', () => saveTetrisPlayerName(playerNameInput.value));
}
renderTetrisLeaderboard();

window.addEventListener('load', () => {
  initGoogleSignIn();
  initFirebase();
  initPanelInteractions();
});
