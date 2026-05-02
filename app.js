/* ============================================
   KOMIKZ — PREMIUM COMIC READER
   Application Logic (ES6+ Modular Pattern)
   ============================================ */

// ==========================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ==========================================

const CONFIG = {
  // Firebase Config (replace with your own)
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "YOUR_APP_ID"
  },
  
  // App Settings
  app: {
    name: 'KOMIKZ',
    version: '1.0.0',
    cachePrefix: 'komikz_',
    cacheExpiry: 1000 * 60 * 30, // 30 minutes
    adInterval: 3, // Show ad every N chapters
    preloadAhead: 2, // Preload next N chapters
    itemsPerPage: 24
  },
  
  // Demo Data (remove when Firebase is connected)
  demoMode: true
};

const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  DETAIL: '/comic',
  READER: '/read',
  LIBRARY: '/library'
};

const READING_DIRECTIONS = {
  VERTICAL: 'vertical',
  MANGA: 'manga'
};

// ==========================================
// SECTION 2: STATE MANAGER
// ==========================================

const State = {
  _data: {
    user: null,
    currentRoute: ROUTES.HOME,
    currentComic: null,
    currentChapter: null,
    readerSettings: {
      direction: READING_DIRECTIONS.VERTICAL,
      fit: 'width',
      bg: 'dark',
      brightness: 100
    },
    bookmarks: new Set(),
    history: [],
    searchFilters: {
      genre: [],
      type: '',
      status: '',
      sort: 'popular'
    },
    adCounter: 0,
    isLoading: false,
    uiVisible: true
  },
  
  _listeners: new Map(),
  
  get(key) {
    return this._data[key];
  },
  
  set(key, value) {
    const oldValue = this._data[key];
    this._data[key] = value;
    this._notify(key, value, oldValue);
  },
  
  update(key, updater) {
    const current = this._data[key];
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    this.set(key, updated);
  },
  
  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key).delete(callback);
  },
  
  _notify(key, newValue, oldValue) {
    if (this._listeners.has(key)) {
      this._listeners.get(key).forEach(cb => cb(newValue, oldValue));
    }
  }
};

// ==========================================
// SECTION 3: CACHE SYSTEM
// ==========================================

const Cache = {
  get(key) {
    try {
      const item = localStorage.getItem(CONFIG.app.cachePrefix + key);
      if (!item) return null;
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > CONFIG.app.cacheExpiry) {
        localStorage.removeItem(CONFIG.app.cachePrefix + key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
  
  set(key, data) {
    try {
      localStorage.setItem(CONFIG.app.cachePrefix + key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  },
  
  remove(key) {
    localStorage.removeItem(CONFIG.app.cachePrefix + key);
  },
  
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CONFIG.app.cachePrefix))
      .forEach(k => localStorage.removeItem(k));
  }
};

// ==========================================
// SECTION 4: DEMO DATA
// ==========================================

const DemoData = {
  comics: [
    {
      id: 'solo-leveling',
      title: 'Solo Leveling',
      description: 'Ten years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as "Hunters". However, not all Hunters are powerful. My name is Sung Jin-Woo, an E-rank Hunter. I\'m someone who has to risk his life in the lowliest of dungeons, the "World\'s Weakest". Having no skills whatsoever to display, I barely earned the required money by fighting in low-leveled dungeons... at least until I found a hidden dungeon with the hardest difficulty within the D-rank dungeons!',
      cover: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=600&fit=crop',
      type: 'manhwa',
      status: 'completed',
      rating: 4.9,
      ratingCount: 125000,
      genres: ['action', 'adventure', 'fantasy', 'supernatural'],
      author: 'Chugong',
      artist: 'DUBU (Redice Studio)',
      year: 2018,
      chapters: 179,
      views: 45000000,
      updatedAt: '2023-12-15'
    },
    {
      id: 'chainsaw-man',
      title: 'Chainsaw Man',
      description: 'Denji has a simple dream—to live a happy, peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts. Using his pet devil Pochita as a weapon, he is ready to do anything for a bit of cash.',
      cover: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop',
      type: 'manga',
      status: 'ongoing',
      rating: 4.8,
      ratingCount: 98000,
      genres: ['action', 'horror', 'supernatural', 'comedy'],
      author: 'Tatsuki Fujimoto',
      artist: 'Tatsuki Fujimoto',
      year: 2018,
      chapters: 153,
      views: 32000000,
      updatedAt: '2024-01-20'
    },
    {
      id: 'omniscient-reader',
      title: 'Omniscient Reader',
      description: 'Dokja was an average office worker whose sole interest was reading his favorite web novel "Three Ways to Survive the Apocalypse." But when the novel suddenly becomes reality, he is the only person who knows how the world will end. Armed with this realization, Dokja uses his understanding to change the course of the story, and the world, as he knows it.',
      cover: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&h=600&fit=crop',
      type: 'manhwa',
      status: 'ongoing',
      rating: 4.7,
      ratingCount: 76000,
      genres: ['action', 'adventure', 'fantasy', 'isekai'],
      author: 'Sing-Shong',
      artist: 'Sleepy-C',
      year: 2020,
      chapters: 185,
      views: 28000000,
      updatedAt: '2024-01-18'
    },
    {
      id: 'jujutsu-kaisen',
      title: 'Jujutsu Kaisen',
      description: 'Yuuji is a genius at track and field. But he has zero interest running around in circles, he\'s happy as a clam in the Occult Research Club. Although he\'s only in the club for kicks, things get serious when a real spirit shows up at school! Life\'s about to get really strange in Sugisawa Town #3 High School!',
      cover: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=600&fit=crop',
      type: 'manga',
      status: 'ongoing',
      rating: 4.8,
      ratingCount: 110000,
      genres: ['action', 'supernatural', 'horror'],
      author: 'Gege Akutami',
      artist: 'Gege Akutami',
      year: 2018,
      chapters: 248,
      views: 38000000,
      updatedAt: '2024-01-15'
    },
    {
      id: 'tower-of-god',
      title: 'Tower of God',
      description: 'What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire—it\'s here.',
      cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop',
      type: 'manhwa',
      status: 'ongoing',
      rating: 4.6,
      ratingCount: 65000,
      genres: ['action', 'adventure', 'fantasy', 'drama'],
      author: 'SIU',
      artist: 'SIU',
      year: 2010,
      chapters: 550,
      views: 22000000,
      updatedAt: '2024-01-10'
    },
    {
      id: 'spy-x-family',
      title: 'SPY x FAMILY',
      description: 'The master spy codenamed <Twilight> has spent his days on undercover missions, all for the dream of a better world. But one day, he receives a particularly difficult new order from command. For his mission, he must form a temporary family and start a new life?!',
      cover: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop',
      type: 'manga',
      status: 'ongoing',
      rating: 4.7,
      ratingCount: 89000,
      genres: ['action', 'comedy', 'slice-of-life'],
      author: 'Tatsuya Endo',
      artist: 'Tatsuya Endo',
      year: 2019,
      chapters: 95,
      views: 25000000,
      updatedAt: '2024-01-12'
    },
    {
      id: 'legend-of-northern-blade',
      title: 'Legend of the Northern Blade',
      description: 'When the world was plunged into darkness martial artists gathered to form the "Northern Heavenly Sect". With the help of the Northern Heavenly Sect people began to enjoy peace again. However, as time passed the martial artists began to conspire against the "Northern Heavenly Sect", and eventually caused the death of the Sect Leader, Jin Kwan-Ho, destroying the sect with it.',
      cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&h=600&fit=crop',
      type: 'manhwa',
      status: 'ongoing',
      rating: 4.8,
      ratingCount: 54000,
      genres: ['action', 'adventure', 'martial-arts', 'fantasy'],
      author: 'Hae-Min',
      artist: 'Woogack',
      year: 2019,
      chapters: 165,
      views: 18000000,
      updatedAt: '2024-01-08'
    },
    {
      id: 'blue-lock',
      title: 'Blue Lock',
      description: 'After reflecting on the current state of Japanese soccer, the Japanese Football Union decides to hire the enigmatic and eccentric coach Jinpachi Ego to achieve their dream of winning the World Cup. Believing that Japan has lacked an egoistic striker hungry for goals, Jinpachi initiates the Blue Lock—a prison-like facility where three hundred talented strikers from high schools all over Japan are isolated and pitted against each other.',
      cover: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&h=800&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop',
      type: 'manga',
      status: 'ongoing',
      rating: 4.6,
      ratingCount: 72000,
      genres: ['sports', 'drama', 'action'],
      author: 'Muneyuki Kaneshiro',
      artist: 'Yusuke Nomura',
      year: 2018,
      chapters: 245,
      views: 21000000,
      updatedAt: '2024-01-16'
    }
  ],
  
  getChapters(comicId, count = 20) {
    const chapters = [];
    const comic = this.comics.find(c => c.id === comicId);
    if (!comic) return chapters;
    
    const total = Math.min(comic.chapters, count);
    for (let i = total; i >= 1; i--) {
      chapters.push({
        id: `${comicId}_ch${i}`,
        number: i,
        title: i === 1 ? 'Prologue' : `Chapter ${i}`,
        date: new Date(Date.now() - (total - i) * 86400000 * 7).toISOString().split('T')[0],
        pages: Math.floor(Math.random() * 20) + 15
      });
    }
    return chapters;
  },
  
  getChapterPages(comicId, chapterNum) {
    const pages = [];
    const pageCount = Math.floor(Math.random() * 15) + 20;
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        id: `${comicId}_ch${chapterNum}_p${i}`,
        url: `https://picsum.photos/seed/${comicId}${chapterNum}${i}/800/1200`,
        width: 800,
        height: 1200
      });
    }
    return pages;
  },
  
  getTrending() {
    return [...this.comics].sort((a, b) => b.views - a.views).slice(0, 6);
  },
  
  getLatest() {
    return [...this.comics].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },
  
  getRecommended() {
    return [...this.comics].sort(() => Math.random() - 0.5);
  },
  
  getById(id) {
    return this.comics.find(c => c.id === id);
  },
  
  search(query, filters = {}) {
    let results = [...this.comics];
    
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.genres.some(g => g.includes(q))
      );
    }
    
    if (filters.genre?.length) {
      results = results.filter(c => 
        filters.genre.some(g => c.genres.includes(g))
      );
    }
    
    if (filters.type) {
      results = results.filter(c => c.type === filters.type);
    }
    
    if (filters.status) {
      results = results.filter(c => c.status === filters.status);
    }
    
    if (filters.sort) {
      switch (filters.sort) {
        case 'latest': results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); break;
        case 'rating': results.sort((a, b) => b.rating - a.rating); break;
        case 'newest': results.sort((a, b) => b.year - a.year); break;
        default: results.sort((a, b) => b.views - a.views);
      }
    }
    
    return results;
  },
  
  getRelated(comicId) {
    const comic = this.getById(comicId);
    if (!comic) return [];
    return this.comics
      .filter(c => c.id !== comicId && c.genres.some(g => comic.genres.includes(g)))
      .slice(0, 4);
  }
};

// ==========================================
// SECTION 5: FIREBASE INTEGRATION
// ==========================================

const Firebase = {
  app: null,
  auth: null,
  db: null,
  storage: null,
  
  init() {
    if (!CONFIG.demoMode && typeof firebase !== 'undefined') {
      try {
        this.app = firebase.initializeApp(CONFIG.firebase);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.setupAuthListener();
      } catch (e) {
        console.error('Firebase init failed:', e);
      }
    }
  },
  
  setupAuthListener() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged(user => {
      State.set('user', user);
      if (user) {
        this.loadUserData(user.uid);
      }
    });
  },
  
  async signInWithGoogle() {
    if (CONFIG.demoMode) {
      // Demo login
      const demoUser = {
        uid: 'demo_user',
        displayName: 'Demo User',
        email: 'demo@komikz.com',
        photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff'
      };
      State.set('user', demoUser);
      this.loadUserData(demoUser.uid);
      UI.showToast('Welcome to KOMIKZ!', 'success');
      return;
    }
    
    if (!this.auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await this.auth.signInWithPopup(provider);
      UI.showToast(`Welcome, ${result.user.displayName}!`, 'success');
    } catch (e) {
      UI.showToast('Sign in failed', 'error');
      console.error(e);
    }
  },
  
  async signOut() {
    if (CONFIG.demoMode) {
      State.set('user', null);
      UI.showToast('Signed out', 'info');
      return;
    }
    if (this.auth) {
      await this.auth.signOut();
    }
  },
  
  async loadUserData(uid) {
    if (!this.db) return;
    try {
      const doc = await this.db.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        State.set('bookmarks', new Set(data.bookmarks || []));
        State.set('history', data.history || []);
      }
    } catch (e) {
      console.error('Load user data failed:', e);
    }
  },
  
  async saveUserData() {
    const user = State.get('user');
    if (!user || !this.db) return;
    try {
      await this.db.collection('users').doc(user.uid).set({
        bookmarks: Array.from(State.get('bookmarks')),
        history: State.get('history'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error('Save user data failed:', e);
    }
  }
};

// ==========================================
// SECTION 6: ROUTER SYSTEM (SPA)
// ==========================================

const Router = {
  currentRoute: null,
  
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  },
  
  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');
    
    this.hideAllViews();
    
    switch (true) {
      case path === ROUTES.HOME || path === '':
        this.currentRoute = ROUTES.HOME;
        State.set('currentRoute', ROUTES.HOME);
        renderHome();
        break;
        
      case path === ROUTES.SEARCH:
        this.currentRoute = ROUTES.SEARCH;
        State.set('currentRoute', ROUTES.SEARCH);
        renderSearch(params.get('q') || '');
        break;
        
      case path.startsWith(ROUTES.DETAIL):
        const comicId = params.get('id');
        if (comicId) {
          this.currentRoute = ROUTES.DETAIL;
          State.set('currentRoute', ROUTES.DETAIL);
          renderDetail(comicId);
        } else {
          this.navigate(ROUTES.HOME);
        }
        break;
        
      case path.startsWith(ROUTES.READER):
        const readComicId = params.get('id');
        const chapterNum = parseInt(params.get('ch')) || 1;
        if (readComicId) {
          this.currentRoute = ROUTES.READER;
          State.set('currentRoute', ROUTES.READER);
          renderReader(readComicId, chapterNum);
        } else {
          this.navigate(ROUTES.HOME);
        }
        break;
        
      case path === ROUTES.LIBRARY:
        this.currentRoute = ROUTES.LIBRARY;
        State.set('currentRoute', ROUTES.LIBRARY);
        renderLibrary(params.get('tab') || 'bookmarks');
        break;
        
      default:
        this.navigate(ROUTES.HOME);
    }
    
    this.updateActiveNav();
    window.scrollTo(0, 0);
  },
  
  navigate(path) {
    window.location.hash = path;
  },
  
  hideAllViews() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  },
  
  updateActiveNav() {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === this.currentRoute);
    });
  }
};

// ==========================================
// SECTION 7: UI RENDERING FUNCTIONS
// ==========================================
const UI = {
  // DOM Helpers
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  // Loading
  showLoader() {
    const loader = this.$('#app-loader');
    if (loader) loader.classList.remove('hidden');
  },
  
  hideLoader() {
    const loader = this.$('#app-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.classList.add('hidden'), 500);
    }
  },
  
  // Toast
  showToast(message, type = 'info', duration = 3000) {
    const container = this.$('#toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration + 300);
  },
  
  // Stars
  renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) html += '<i class="fas fa-star"></i>';
      else if (i === full && half) html += '<i class="fas fa-star-half-alt"></i>';
      else html += '<i class="far fa-star"></i>';
    }
    return html;
  },
  
  // Format numbers
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },
  
  // Format date
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  
  // Comic card HTML
  createComicCard(comic, variant = 'default') {
    const isBookmarked = State.get('bookmarks').has(comic.id);
    
    if (variant === 'horizontal') {
      return `
        <article class="comic-card" data-id="${comic.id}" onclick="Router.navigate('#/comic?id=${comic.id}')">
          <div class="card-image">
            <img src="${comic.cover}" alt="${comic.title}" loading="lazy" />
            <div class="card-overlay"></div>
            <span class="card-badge">${comic.type}</span>
            <div class="card-rating"><i class="fas fa-star"></i> ${comic.rating}</div>
          </div>
          <div class="card-info">
            <h3 class="card-title">${comic.title}</h3>
            <div class="card-meta">Ch. ${comic.chapters} • ${this.formatDate(comic.updatedAt)}</div>
          </div>
        </article>
      `;
    }
    
    return `
      <article class="comic-card" data-id="${comic.id}" onclick="Router.navigate('#/comic?id=${comic.id}')">
        <div class="card-image">
          <img src="${comic.cover}" alt="${comic.title}" loading="lazy" />
          <div class="card-overlay"></div>
          <span class="card-badge">${comic.type}</span>
          <div class="card-rating"><i class="fas fa-star"></i> ${comic.rating}</div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${comic.title}</h3>
          <div class="card-meta">${comic.genres.slice(0, 2).join(', ')}</div>
        </div>
      </article>
    `;
  }
};

// ==========================================
// SECTION 8: HOME VIEW RENDERER
// ==========================================

function renderHome() {
  const view = UI.$('#view-home');
  view.classList.remove('hidden');
  
  // Hero
  const trending = DemoData.getTrending();
  const heroComic = trending[0];
  
  UI.$('#hero-backdrop').style.backgroundImage = `url(${heroComic.backdrop})`;
  UI.$('#hero-title').textContent = heroComic.title;
  UI.$('#hero-desc').textContent = heroComic.description.slice(0, 120) + '...';
  UI.$('#hero-meta').innerHTML = `
    <span><i class="fas fa-star"></i> ${heroComic.rating}</span>
    <span><i class="fas fa-book"></i> ${heroComic.chapters} Chapters</span>
    <span><i class="fas fa-eye"></i> ${UI.formatNumber(heroComic.views)}</span>
  `;
  
  UI.$('#hero-read-btn').onclick = () => Router.navigate(`#/read?id=${heroComic.id}&ch=1`);
  UI.$('#hero-bookmark-btn').onclick = (e) => {
    e.stopPropagation();
    toggleBookmark(heroComic.id);
  };
  
  // Continue Reading
  const history = State.get('history');
  const continueSection = UI.$('#continue-section');
  const continueGrid = UI.$('#continue-grid');
  
  if (history.length > 0) {
    continueSection.style.display = 'block';
    continueGrid.innerHTML = history.slice(0, 4).map(h => {
      const comic = DemoData.getById(h.comicId);
      if (!comic) return '';
      return `
        <div class="continue-card" onclick="Router.navigate('#/read?id=${h.comicId}&ch=${h.chapter}')">
          <div class="card-image">
            <img src="${comic.cover}" alt="${comic.title}" loading="lazy" />
          </div>
          <div class="continue-info">
            <div class="continue-title">${comic.title}</div>
            <div class="continue-chapter">Chapter ${h.chapter}</div>
            <div class="continue-progress">
              <div class="continue-progress-bar" style="width: ${h.progress}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    continueSection.style.display = 'none';
  }
  
  // Trending
  const trendingScroll = UI.$('#trending-scroll');
  trendingScroll.innerHTML = trending.map(c => UI.createComicCard(c, 'horizontal')).join('');
  
  // Latest
  UI.$('#latest-grid').innerHTML = DemoData.getLatest().map(c => UI.createComicCard(c)).join('');
  
  // Recommended
  UI.$('#recommended-grid').innerHTML = DemoData.getRecommended().map(c => UI.createComicCard(c)).join('');
  
  // Type tabs
  UI.$$('.type-tab').forEach(tab => {
    tab.onclick = () => {
      UI.$$('.type-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterHomeByType(tab.dataset.type);
    };
  });
  
  // Scroll buttons
  UI.$$('.scroll-btn').forEach(btn => {
    btn.onclick = () => {
      const target = UI.$(`#${btn.dataset.target}`);
      if (target) {
        const scrollAmount = btn.classList.contains('next') ? 400 : -400;
        target.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };
  });
}

function filterHomeByType(type) {
  const allComics = type === 'all' 
    ? DemoData.getLatest() 
    : DemoData.comics.filter(c => c.type === type);
  
  UI.$('#latest-grid').innerHTML = allComics.map(c => UI.createComicCard(c)).join('');
}

// ==========================================
// SECTION 9: SEARCH VIEW RENDERER
// ==========================================

function renderSearch(initialQuery = '') {
  const view = UI.$('#view-search');
  view.classList.remove('hidden');
  
  const searchInput = UI.$('#search-input');
  const resultsGrid = UI.$('#search-results-grid');
  const resultsCount = UI.$('#results-count');
  const emptyState = UI.$('#search-empty');
  const filterPanel = UI.$('#filter-panel');
  
  searchInput.value = initialQuery;
  
  // Filter toggle
  UI.$('#search-filter-btn').onclick = () => {
    filterPanel.classList.toggle('hidden');
  };
  
  // Genre filters
  UI.$$('.filter-tag[data-filter="genre"]').forEach(tag => {
    tag.onclick = () => {
      tag.classList.toggle('active');
      updateSearchFilters();
      performSearch();
    };
  });
  
  // Dropdown filters
  ['type-filter', 'status-filter', 'sort-filter'].forEach(id => {
    UI.$(`#${id}`).onchange = () => {
      updateSearchFilters();
      performSearch();
    };
  });
  
  // Search input
  let searchTimeout;
  searchInput.oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  };
  
  // View toggle
  UI.$$('.view-btn').forEach(btn => {
    btn.onclick = () => {
      UI.$$('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Toggle grid/list view logic here
    };
  });
  
  // Suggestions
  const suggestions = ['Solo Leveling', 'Action', 'Isekai', 'Manhwa', 'Romance', 'Horror'];
  UI.$('#suggestion-tags').innerHTML = suggestions.map(s => 
    `<button class="filter-tag" onclick="UI.$('#search-input').value='${s}';performSearch()">${s}</button>`
  ).join('');
  
  if (initialQuery) performSearch();
  
  function updateSearchFilters() {
    const activeGenres = Array.from(UI.$$('.filter-tag[data-filter="genre"].active')).map(t => t.dataset.value);
    State.set('searchFilters', {
      genre: activeGenres,
      type: UI.$('#type-filter').value,
      status: UI.$('#status-filter').value,
      sort: UI.$('#sort-filter').value
    });
  }
  
  function performSearch() {
    const query = searchInput.value.trim();
    const filters = State.get('searchFilters');
    const results = DemoData.search(query, filters);
    
    resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
    
    if (results.length === 0) {
      resultsGrid.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      resultsGrid.innerHTML = results.map(c => UI.createComicCard(c)).join('');
    }
  }
}

// ==========================================
// SECTION 10: DETAIL VIEW RENDERER
// ==========================================

function renderDetail(comicId) {
  const view = UI.$('#view-detail');
  view.classList.remove('hidden');
  
  const comic = DemoData.getById(comicId);
  if (!comic) {
    Router.navigate(ROUTES.HOME);
    return;
  }
  
  State.set('currentComic', comic);
  
  // Hero
  UI.$('#detail-backdrop').style.backgroundImage = `url(${comic.backdrop})`;
  UI.$('#detail-cover').src = comic.cover;
  UI.$('#detail-cover').alt = comic.title;
  
  UI.$('#detail-badges').innerHTML = `
    <span class="detail-badge type-${comic.type}">${comic.type}</span>
    <span class="detail-badge status-${comic.status}">${comic.status}</span>
  `;
  
  UI.$('#detail-title').textContent = comic.title;
  UI.$('#detail-meta').innerHTML = `
    <span><i class="fas fa-user"></i> ${comic.author}</span>
    <span><i class="fas fa-paint-brush"></i> ${comic.artist}</span>
    <span><i class="fas fa-calendar"></i> ${comic.year}</span>
  `;
  
  UI.$('#detail-rating').innerHTML = `
    <div class="stars">${UI.renderStars(comic.rating)}</div>
    <span class="rating-value">${comic.rating}</span>
    <span class="rating-count">(${UI.formatNumber(comic.ratingCount)} ratings)</span>
  `;
  
  // Check if in history
  const history = State.get('history');
  const lastRead = history.find(h => h.comicId === comicId);
  const readBtn = UI.$('#detail-read-btn');
  const readText = UI.$('#detail-read-text');
  
  if (lastRead) {
    readText.textContent = `Continue Ch. ${lastRead.chapter}`;
    readBtn.onclick = () => Router.navigate(`#/read?id=${comicId}&ch=${lastRead.chapter}`);
  } else {
    readText.textContent = 'Start Reading';
    readBtn.onclick = () => Router.navigate(`#/read?id=${comicId}&ch=1`);
  }
  
  // Bookmark button
  const bookmarkBtn = UI.$('#detail-bookmark-btn');
  const isBookmarked = State.get('bookmarks').has(comicId);
  bookmarkBtn.innerHTML = `<i class="fas fa-bookmark"></i> <span>${isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>`;
  bookmarkBtn.onclick = () => toggleBookmark(comicId);
  
  // Overview
  UI.$('#detail-description').textContent = comic.description;
  UI.$('#detail-tags').innerHTML = comic.genres.map(g => 
    `<span class="detail-tag">${g.charAt(0).toUpperCase() + g.slice(1)}</span>`
  ).join('');
  
  UI.$('#detail-stats').innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${UI.formatNumber(comic.views)}</div>
      <div class="stat-label">Total Views</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${comic.chapters}</div>
      <div class="stat-label">Chapters</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${comic.rating}</div>
      <div class="stat-label">Rating</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${UI.formatDate(comic.updatedAt)}</div>
      <div class="stat-label">Last Update</div>
    </div>
  `;
  
  // Chapters
  const chapters = DemoData.getChapters(comicId, 50);
  UI.$('#chapters-count').textContent = `${chapters.length} chapters`;
  
  renderChaptersList(chapters, 'desc');
  
  // Chapter sort
  UI.$$('.sort-btn').forEach(btn => {
    btn.onclick = () => {
      UI.$$('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChaptersList(chapters, btn.dataset.sort);
    };
  });
  
  // Tabs
  UI.$$('.detail-tab').forEach(tab => {
    tab.onclick = () => {
      UI.$$('.detail-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      UI.$$('.detail-tab-content').forEach(c => c.classList.remove('active'));
      UI.$(`#tab-${tab.dataset.tab}`).classList.add('active');
    };
  });
  
  // Related
  const related = DemoData.getRelated(comicId);
  UI.$('#related-grid').innerHTML = related.map(c => UI.createComicCard(c)).join('');
}

function renderChaptersList(chapters, sort) {
  const list = UI.$('#chapters-list');
  const sorted = sort === 'asc' ? [...chapters].reverse() : chapters;
  const history = State.get('history');
  
  list.innerHTML = sorted.map(ch => {
    const isRead = history.some(h => h.comicId === State.get('currentComic')?.id && h.chapter === ch.number);
    return `
      <div class="chapter-item ${isRead ? 'read' : ''}" onclick="Router.navigate('#/read?id=${State.get('currentComic').id}&ch=${ch.number}')">
        <div class="chapter-info">
          <span class="chapter-number">Chapter ${ch.number}</span>
          ${ch.title !== `Chapter ${ch.number}` ? `<span class="chapter-title">${ch.title}</span>` : ''}
        </div>
        <div class="chapter-meta">
          <span class="chapter-date"><i class="far fa-clock"></i> ${UI.formatDate(ch.date)}</span>
          <span><i class="far fa-file-image"></i> ${ch.pages} pages</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// SECTION 11: READER ENGINE (CRITICAL)
// ==========================================

const Reader = {
  comicId: null,
  chapterNum: null,
  pages: [],
  currentPageIndex: 0,
  loadedImages: new Set(),
  preloadedImages: new Set(),
  observer: null,
  
  init(comicId, chapterNum) {
    this.comicId = comicId;
    this.chapterNum = chapterNum;
    this.pages = DemoData.getChapterPages(comicId, chapterNum);
    this.currentPageIndex = 0;
    this.loadedImages.clear();
    this.preloadedImages.clear();
    
    this.setupReader();
    this.loadChapter();
    this.updateHistory();
    
    // Ad check
    State.update('adCounter', c => c + 1);
    if (State.get('adCounter') >= CONFIG.app.adInterval) {
      setTimeout(() => this.showAd(), 1000);
    }
  },
  
  setupReader() {
    const settings = State.get('readerSettings');
    const container = UI.$('#reader-container');
    const pagesContainer = UI.$('#reader-pages');
    const mangaContainer = UI.$('#reader-manga-mode');
    
    // Apply settings
    container.className = 'reader-container';
    if (settings.bg !== 'dark') container.classList.add(`reader-bg-${settings.bg}`);
    container.style.filter = `brightness(${settings.brightness}%)`;
    
    // Direction
    if (settings.direction === READING_DIRECTIONS.MANGA) {
      pagesContainer.classList.add('hidden');
      mangaContainer.classList.remove('hidden');
      this.renderMangaMode();
    } else {
      pagesContainer.classList.remove('hidden');
      mangaContainer.classList.add('hidden');
      this.renderVerticalMode();
    }
    
    // Toolbar toggle
    UI.$('#reader-zone-menu').onclick = () => this.toggleUI();
    UI.$('#reader-back-btn').onclick = () => {
      const comic = State.get('currentComic');
      Router.navigate(comic ? `#/comic?id=${comic.id}` : ROUTES.HOME);
    };
    
    // Settings
    UI.$('#reader-settings-btn').onclick = () => {
      UI.$('#reader-settings').classList.add('active');
    };
    UI.$('#reader-settings').onclick = (e) => {
      if (e.target === UI.$('#reader-settings')) {
        UI.$('#reader-settings').classList.remove('active');
      }
    };
    
    // Settings options
    UI.$$('.setting-option').forEach(opt => {
      opt.onclick = () => {
        const setting = opt.dataset.setting;
        const value = opt.dataset.value;
        
        UI.$$(`.setting-option[data-setting="${setting}"]`).forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        
        State.update('readerSettings', s => ({ ...s, [setting]: value }));
        
        // Re-render if direction changed
        if (setting === 'direction') {
          this.setupReader();
        }
        if (setting === 'bg') {
          container.className = 'reader-container';
          if (value !== 'dark') container.classList.add(`reader-bg-${value}`);
        }
      };
    });
    
    // Brightness
    UI.$('#brightness-slider').oninput = (e) => {
      const val = e.target.value;
      container.style.filter = `brightness(${val}%)`;
      State.update('readerSettings', s => ({ ...s, brightness: val }));
    };
    
    // Bookmark in reader
    UI.$('#reader-bookmark-btn').onclick = () => toggleBookmark(this.comicId);
    
    // Chapter navigation
    UI.$('#reader-prev-chapter').onclick = () => this.navigateChapter(-1);
    UI.$('#reader-next-chapter').onclick = () => this.navigateChapter(1);
    
    // Scroll progress
    UI.$('#reader-container').onscroll = () => this.updateProgress();
  },
  
  renderVerticalMode() {
    const container = UI.$('#reader-pages');
    container.innerHTML = this.pages.map((page, i) => `
      <div class="reader-page" data-index="${i}">
        <div class="page-loader"></div>
        <img 
          data-src="${page.url}" 
          alt="Page ${i + 1}" 
          loading="${i < 3 ? 'eager' : 'lazy'}"
          style="display:none"
          onload="Reader.onImageLoad(this, ${i})"
        />
      </div>
    `).join('');
    
    // Intersection Observer for lazy loading
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img');
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        }
      });
    }, { root: UI.$('#reader-container'), rootMargin: '500px' });
    
    container.querySelectorAll('.reader-page').forEach(page => {
      this.observer.observe(page);
    });
  },
  
  renderMangaMode() {
    const container = UI.$('#manga-pages');
    container.innerHTML = this.pages.map((page, i) => `
      <div class="manga-page" data-index="${i}">
        <img src="${page.url}" alt="Page ${i + 1}" loading="${i < 2 ? 'eager' : 'lazy'}" />
      </div>
    `).join('');
  },
  
  onImageLoad(img, index) {
    img.style.display = 'block';
    const loader = img.previousElementSibling;
    if (loader) loader.style.display = 'none';
    this.loadedImages.add(index);
    
    // Preload next images
    this.preloadNext(index);
  },
  
  preloadNext(currentIndex) {
    const ahead = CONFIG.app.preloadAhead;
    for (let i = 1; i <= ahead; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < this.pages.length && !this.preloadedImages.has(nextIndex)) {
        this.preloadedImages.add(nextIndex);
        const img = new Image();
        img.src = this.pages[nextIndex].url;
      }
    }
  },
  
  updateProgress() {
    if (State.get('readerSettings').direction === READING_DIRECTIONS.MANGA) return;
    
    const container = UI.$('#reader-container');
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    UI.$('#reader-progress-fill').style.width = `${progress}%`;
    
    // Update current page based on scroll
    const pages = UI.$$('.reader-page');
    pages.forEach((page, i) => {
      const rect = page.getBoundingClientRect();
      if (rect.top < window.innerHeight / 2) {
        this.currentPageIndex = i;
      }
    });
  },
  
  toggleUI() {
    const visible = !State.get('uiVisible');
    State.set('uiVisible', visible);
    
    UI.$('#reader-toolbar').classList.toggle('hidden', !visible);
    UI.$('#reader-progress-bar').classList.toggle('hidden', !visible);
    UI.$('#reader-footer').classList.toggle('hidden', !visible);
  },
  
  navigateChapter(direction) {
    const comic = State.get('currentComic');
    if (!comic) return;
    
    const newChapter = this.chapterNum + direction;
    if (newChapter < 1 || newChapter > comic.chapters) return;
    
    Router.navigate(`#/read?id=${this.comicId}&ch=${newChapter}`);
  },
  
  loadChapter() {
    const comic = State.get('currentComic');
    if (!comic) return;
    
    UI.$('#reader-comic-title').textContent = comic.title;
    UI.$('#reader-chapter-title').textContent = `Chapter ${this.chapterNum}`;
    
    // Chapter select
    const select = UI.$('#reader-chapter-select');
    select.innerHTML = Array.from({ length: comic.chapters }, (_, i) => 
      `<option value="${i + 1}" ${i + 1 === this.chapterNum ? 'selected' : ''}>Chapter ${i + 1}</option>`
    ).join('');
    select.onchange = (e) => {
      Router.navigate(`#/read?id=${this.comicId}&ch=${e.target.value}`);
    };
    
    // Nav buttons
    UI.$('#reader-prev-chapter').disabled = this.chapterNum <= 1;
    UI.$('#reader-next-chapter').disabled = this.chapterNum >= comic.chapters;
  },
  
  updateHistory() {
    const history = State.get('history').filter(h => h.comicId !== this.comicId);
    history.unshift({
      comicId: this.comicId,
      chapter: this.chapterNum,
      page: this.currentPageIndex,
      progress: 0,
      timestamp: Date.now()
    });
    State.set('history', history.slice(0, 50));
    Firebase.saveUserData();
  },
  
  showAd() {
    const overlay = UI.$('#ad-overlay');
    const skipBtn = UI.$('#ad-skip-btn');
    const countdown = UI.$('#ad-countdown');
    let seconds = 5;
    
    overlay.classList.add('active');
    State.set('adCounter', 0);
    
    const timer = setInterval(() => {
      seconds--;
      countdown.textContent = seconds;
      
      if (seconds <= 0) {
        clearInterval(timer);
        skipBtn.classList.add('active');
        skipBtn.innerHTML = '<i class="fas fa-forward"></i> Skip Ad';
        skipBtn.onclick = () => {
          overlay.classList.remove('active');
        };
      }
    }, 1000);
  },
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
};

function renderReader(comicId, chapterNum) {
  const view = UI.$('#view-reader');
  view.classList.remove('hidden');
  
  // Load comic if not loaded
  if (!State.get('currentComic') || State.get('currentComic').id !== comicId) {
    const comic = DemoData.getById(comicId);
    if (comic) State.set('currentComic', comic);
  }
  
  Reader.destroy();
  Reader.init(comicId, chapterNum);
}

// ==========================================
// SECTION 12: LIBRARY VIEW RENDERER
// ==========================================

function renderLibrary(activeTab = 'bookmarks') {
  const view = UI.$('#view-library');
  view.classList.remove('hidden');
  
  // Tabs
  UI.$$('.lib-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.lib === activeTab);
    tab.onclick = () => renderLibrary(tab.dataset.lib);
  });
  
  const content = UI.$('#library-content');
  const empty = UI.$('#library-empty');
  
  if (activeTab === 'bookmarks') {
    const bookmarks = Array.from(State.get('bookmarks'));
    if (bookmarks.length === 0) {
      content.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      content.innerHTML = bookmarks.map(id => {
        const comic = DemoData.getById(id);
        return comic ? UI.createComicCard(comic) : '';
      }).join('');
    }
  } else {
    const history = State.get('history');
    if (history.length === 0) {
      content.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      const uniqueComics = [...new Map(history.map(h => [h.comicId, h])).values()];
      content.innerHTML = uniqueComics.map(h => {
        const comic = DemoData.getById(h.comicId);
        return comic ? UI.createComicCard(comic) : '';
      }).join('');
    }
  }
}

// ==========================================
// SECTION 13: USER SYSTEM
// ==========================================

function toggleBookmark(comicId) {
  const bookmarks = State.get('bookmarks');
  const newBookmarks = new Set(bookmarks);
  
  if (newBookmarks.has(comicId)) {
    newBookmarks.delete(comicId);
    UI.showToast('Removed from bookmarks', 'info');
  } else {
    newBookmarks.add(comicId);
    UI.showToast('Added to bookmarks', 'success');
  }
  
  State.set('bookmarks', newBookmarks);
  Firebase.saveUserData();
  
  // Update UI
  updateBookmarkUI(comicId);
}

function updateBookmarkUI(comicId) {
  const isBookmarked = State.get('bookmarks').has(comicId);
  const count = State.get('bookmarks').size;
  
  // Nav badge
  const badge = UI.$('#bookmark-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Detail button
  const detailBtn = UI.$('#detail-bookmark-btn');
  if (detailBtn && State.get('currentComic')?.id === comicId) {
    detailBtn.innerHTML = `<i class="fas fa-bookmark"></i> <span>${isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>`;
  }
  
  // Reader button
  const readerBtn = UI.$('#reader-bookmark-btn');
  if (readerBtn) {
    readerBtn.style.color = isBookmarked ? 'var(--accent-primary)' : '';
  }
}

function updateUserUI() {
  const user = State.get('user');
  const navUser = UI.$('#nav-user');
  const dropdown = UI.$('#user-dropdown');
  
  if (user) {
    navUser.innerHTML = `
      <button class="user-avatar-btn" id="user-menu-btn">
        <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3B82F6&color=fff`}" alt="${user.displayName}" />
      </button>
    `;
    
    UI.$('#user-name').textContent = user.displayName || 'User';
    UI.$('#user-email').textContent = user.email || '';
    UI.$('#user-avatar').src = user.photoURL || '';
    
    UI.$('#user-menu-btn').onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    };
  } else {
    navUser.innerHTML = `
      <button class="user-avatar-btn" id="login-btn">
        <i class="fas fa-user"></i>
      </button>
    `;
    UI.$('#login-btn').onclick = () => UI.$('#auth-modal').classList.add('active');
  }
}

// ==========================================
// SECTION 14: EVENT HANDLERS
// ==========================================

function setupEventListeners() {
  // Auth modal
  UI.$('#auth-close').onclick = () => UI.$('#auth-modal').classList.remove('active');
  UI.$('#google-signin-btn').onclick = () => Firebase.signInWithGoogle();
  
  // Sign out
  UI.$('#signout-btn').onclick = () => {
    Firebase.signOut();
    UI.$('#user-dropdown').classList.remove('active');
  };
  
  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nav-user')) {
      UI.$('#user-dropdown').classList.remove('active');
    }
  });
  
  // Mobile user button
  UI.$('#mobile-user-btn').onclick = () => {
    const user = State.get('user');
    if (user) {
      UI.$('#user-dropdown').classList.toggle('active');
    } else {
      UI.$('#auth-modal').classList.add('active');
    }
  };
  
  // Search toggle (mobile)
  UI.$('#search-toggle-btn').onclick = () => {
    Router.navigate(ROUTES.SEARCH);
  };
  
  // Bookmark toggle nav
  UI.$('#bookmark-toggle-btn').onclick = () => {
    Router.navigate(ROUTES.LIBRARY);
  };
  
  // History toggle nav
  UI.$('#history-toggle-btn').onclick = () => {
    Router.navigate('#/library?tab=history');
  };
  
  // Nav search
  const navSearch = UI.$('#nav-search-input');
  if (navSearch) {
    navSearch.onkeydown = (e) => {
      if (e.key === 'Enter') {
        Router.navigate(`#/search?q=${encodeURIComponent(navSearch.value)}`);
      }
    };
  }
  
  // State subscriptions
  State.subscribe('user', () => updateUserUI());
  State.subscribe('bookmarks', () => {
    const currentComic = State.get('currentComic');
    if (currentComic) updateBookmarkUI(currentComic.id);
  });
}

// ==========================================
// SECTION 15: INITIALIZATION
// ==========================================

function init() {
  // Load cached data
  const cachedBookmarks = Cache.get('bookmarks');
  const cachedHistory = Cache.get('history');
  const cachedSettings = Cache.get('readerSettings');
  
  if (cachedBookmarks) State.set('bookmarks', new Set(cachedBookmarks));
  if (cachedHistory) State.set('history', cachedHistory);
  if (cachedSettings) State.set('readerSettings', { ...State.get('readerSettings'), ...cachedSettings });
  
  // Subscribe to persist cache
  State.subscribe('bookmarks', (val) => Cache.set('bookmarks', Array.from(val)));
  State.subscribe('history', (val) => Cache.set('history', val));
  State.subscribe('readerSettings', (val) => Cache.set('readerSettings', val));
  
  // Init Firebase
  Firebase.init();
  
  // Setup events
  setupEventListeners();
  
  // Init router
  Router.init();
  
  // Hide loader
  setTimeout(() => UI.hideLoader(), 800);
  
  // Update UI
  updateUserUI();
}

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}