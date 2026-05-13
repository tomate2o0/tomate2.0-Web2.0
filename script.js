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

const adminPassword = '1583ADMIN'; // Mot de passe pour accéder au panneau admin (à changer pour plus de sécurité)
let isAdmin = false;
let posts = [];
let likedPosts = [];
let editingPostId = null;
let contactEmail = localStorage.getItem('contactEmail') || '';
let contactName = localStorage.getItem('contactName') || '';

(function() {
  emailjs.init('YOUR_PUBLIC_KEY'); // Remplacez par votre clé publique EmailJS
})();

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
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
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
  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    from_name: name || contactName,
    from_email: contactEmail,
    message: message,
    to_email: 'lager.thomas38360@gmail.com'
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

// Initialisation
loadPosts();
renderPosts();
updateButtonText();
checkContactLogin();

window.addEventListener('load', () => {
  initGoogleSignIn();
  initFirebase();
});
