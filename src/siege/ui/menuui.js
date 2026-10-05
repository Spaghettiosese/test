// The menu controller: draws the current page from screens.js, binds every button, keeps the
// 3D hero in step with the page, and runs the modals (playlists, squad, settings...).
import { OPS_BY_ID, OPERATORS, PRICE } from '../data/operators.js';
import { WEAPONS } from '../data/weapons.js';
import { shopItems, passRewards, UNIFORMS, HEADGEAR, WEAPON_SKINS, TITLES, BANNERS, CHARMS } from '../data/progression.js';
import { DEFAULT_KEYS } from '../game/player.js';
import * as S from './screens.js';

const PAGES = { play: S.mainMenu, operators: S.operatorsPage, pass: S.passPage, locker: S.lockerPage, career: S.careerPage, esports: S.esportsPage, shop: S.shopPage };

export class MenuUI {
  constructor(app) {
    this.app = app; this.store = app.store; this.page = 'play'; this.menuTab = 'newcomer'; this.opFilter = 'all'; this.opSel = null; this.lockCat = 'uniform'; this.lockOp = null; this.shopCat = 'operator'; this.pickem = {};
    this.el = document.createElement('div'); this.el.className = 'scr dim'; this.el.hidden = true;
    this.modalEl = document.createElement('div'); this.modal = null; this.listen = null; this.confirmReset = false;
    app.layer.append(this.el, this.modalEl);
    this.el.addEventListener('click', (e) => this.click(e));
    this.modalEl.addEventListener('click', (e) => this.click(e));
    this.modalEl.addEventListener('input', (e) => this.change(e)); this.modalEl.addEventListener('change', (e) => this.change(e));
    this.el.addEventListener('mouseover', (e) => { const t = e.target.closest('button'); if (t && t !== this.lastHover) { this.lastHover = t; app.audio.ui('hover'); } });
    app.mouseTrack = (nx, ny) => { if (app.menu) app.menu.parallax = [nx, ny]; };
  }
  unread() { return Math.max(0, 9 - (this.store.profile.notifRead || 0)); }
  show(v) { this.el.hidden = !v; if (!v) this.closeModal(); }
  favOp(side = 'atk') { const id = this.store.profile.fav[side]; return OPS_BY_ID[id] && this.store.owns('operator', id) ? OPS_BY_ID[id] : OPERATORS.find((o) => o.side === side && this.store.owns('operator', o.id)); }

  // ---------------------------------------------------------------- pages and the hero
  setPage(p) {
    this.page = p; if (!this.opSel) this.opSel = this.favOp('atk').id; if (!this.lockOp) this.lockOp = this.favOp('atk').id;
    this.render(); this.hero(); this.app.audio.ui('click');
  }
  hero() {
    const m = this.app.menu, st = this.store;
    if (this.page === 'operators' || this.page === 'locker') {
      const op = OPS_BY_ID[this.page === 'locker' ? this.lockOp : this.opSel], w = WEAPONS[op.primary[0]];
      m.setMode('studio'); m.setOperator(op, st.look(op.look), { gun: w.rig, twoHanded: w.cls !== 'HG' }); m.targetYaw = -10; m.yaw = -10;
    } else {
      const op = this.favOp('atk'); m.setMode('hangar'); m.setOperator(op, st.look(op.look), { gun: 'deagle', twoHanded: false }); m.targetYaw = 0;
    }
    this.app.menuOffset = this.page === 'operators' || this.page === 'locker' ? 1.25 : 0;
  }
  render() {
    const fn = PAGES[this.page], pg = this.el.querySelector('.page'), keep = pg ? pg.scrollTop : 0, tier = this.el.querySelector('.tierrow'), kl = tier ? tier.scrollLeft : 0;
    this.el.className = 'scr' + (this.page === 'play' ? ' dim' : '');
    this.el.innerHTML = fn(this);
    const np = this.el.querySelector('.page'); if (np) np.scrollTop = keep; const nt = this.el.querySelector('.tierrow'); if (nt) nt.scrollLeft = kl;
    const qr = this.el.querySelector('#qrc'); if (qr) S.drawQr(qr);
  }

  // ---------------------------------------------------------------- modals
  openModal(kind, arg) {
    this.modal = { kind, arg }; const html = { playlists: S.playlistsModal, squad: S.squadModal, notif: S.notifModal, access: S.accessModal }[kind];
    if (kind === 'notif') { this.store.profile.notifRead = 9; this.store.save(); }
    this.modalEl.innerHTML = kind === 'settings' ? S.settingsModal(this, arg || 'gameplay') : html(this);
    if (kind === 'notif') this.render();
  }
  closeModal() { this.modal = null; this.listen = null; this.modalEl.innerHTML = ''; }
  captureKey(name) {
    if (!this.listen) return false;
    const a = this.listen; this.listen = null;
    if (name !== 'escape') { this.store.settings.keys[a] = name; this.store.save(); }
    this.openModal('settings', 'controls'); return true;
  }

  // ---------------------------------------------------------------- events
  click(e) {
    const t = e.target.closest('[data-nav],[data-act],[data-play],[data-claim],[data-claimd],[data-tab],[data-op],[data-ofilter],[data-buyop],[data-buy],[data-pclaim],[data-lock],[data-lcat],[data-lop],[data-scat],[data-stab],[data-rebind],[data-close],[data-pick]');
    if (!t) return;
    const d = t.dataset, app = this.app, st = this.store, au = app.audio;
    au.unlock();
    if (d.close !== undefined) { if (t === e.target || t.tagName === 'BUTTON') { au.ui('back'); this.closeModal(); } return; }
    au.ui('click');
    if (d.nav) return this.setPage(d.nav);
    if (d.act) return this.act(d.act, d);
    if (d.play) { this.closeModal(); return app.startPlaylist(d.play); }
    if (d.claim) { const ups = st.newcomerReward(d.claim); st.profile.newcomer['claimed_' + d.claim] = true; st.save(); this.rewarded(ups, 'Mission reward claimed'); return this.render(); }
    if (d.claimd) { const ups = st.claimDaily(d.claimd); this.rewarded(ups || [], 'Daily reward claimed'); return this.render(); }
    if (d.tab) { this.menuTab = d.tab; return this.render(); }
    if (d.ofilter) { this.opFilter = d.ofilter; return this.render(); }
    if (d.op) { this.opSel = d.op; this.render(); return this.hero(); }
    if (d.buyop) return this.buy('op:' + d.buyop);
    if (d.buy) return this.buy(d.buy);
    if (d.pclaim) { const [tier, track] = d.pclaim.split(':'); const rw = st.claimPass(+tier, track); if (rw) { app.toast(`Tier ${tier}: ${rw.name || rw.type}`); au.ui('confirm'); } this.render(); return; }
    if (d.lock) return this.equip(d.lock);
    if (d.lcat) { this.lockCat = d.lcat; return this.render(); }
    if (d.lop) { this.lockOp = d.lop; this.render(); return this.hero(); }
    if (d.scat) { this.shopCat = d.scat; return this.render(); }
    if (d.stab) return this.openModal('settings', d.stab);
    if (d.rebind) { this.listen = d.rebind; const b = this.modalEl.querySelector(`[data-rebind="${d.rebind}"]`); if (b) { b.textContent = 'PRESS A KEY'; b.classList.add('listen'); } return; }
    if (d.pick) { const [i, side] = d.pick.split(':'); this.pickem[+i] = +side; return this.render(); }
  }
  act(a, d) {
    const app = this.app, st = this.store;
    switch (a) {
      case 'profile': return this.setPage('career');
      case 'settings': return this.openModal('settings', 'gameplay');
      case 'skirmish': return app.startPlaylist('skirmish');
      case 'squad': return this.openModal('squad');
      case 'tutorial': return app.startTutorial();
      case 'playlists': return this.openModal('playlists');
      case 'news': case 'notif': return this.openModal('notif');
      case 'access': return this.openModal('access');
      case 'setfav': { const op = OPS_BY_ID[d.op]; st.profile.fav[op.side] = op.id; st.save(); app.toast(`${op.name} is now your favourite ${op.side === 'atk' ? 'attacker' : 'defender'}`); return this.hero(); }
      case 'resetkeys': st.settings.keys = { ...DEFAULT_KEYS }; st.save(); return this.openModal('settings', 'controls');
      case 'resetprofile': {
        if (!this.confirmReset) { this.confirmReset = true; const b = this.modalEl.querySelector('[data-act="resetprofile"]'); if (b) b.textContent = 'Click again to erase everything'; return; }
        this.confirmReset = false; st.reset(); this.closeModal(); this.render(); this.hero(); return app.toast('Progress reset');
      }
      case 'watch': return app.watch(Object.keys(this.pickem)[0] !== undefined ? +Object.keys(this.pickem)[0] : 0, this.pickem);
      default:
    }
  }
  change(e) {
    const t = e.target, app = this.app, st = this.store;
    if (t.id === 'pname') { st.settings.playerName = (t.value || 'Operator').slice(0, 14); st.save(); return; }
    const k = t.dataset && t.dataset.set; if (!k) return;
    let v = t.type === 'checkbox' ? t.checked : t.type === 'range' ? +t.value : t.value;
    if (k === 'difficulty') v = +v;
    st.settings[k] = v; st.save();
    if (t.type === 'range' && t.nextElementSibling) t.nextElementSibling.textContent = v;
    app.applySettings();
  }
  // ---------------------------------------------------------------- purchases and cosmetics
  rewarded(ups, text) {
    const app = this.app; app.toast(text); app.audio.ui('confirm');
    for (const u of ups || []) setTimeout(() => { app.toast(`Clearance level ${u.level}! +${u.renown} renown`); app.audio.ui('levelup'); }, 900);
  }
  buy(id) {
    const it = shopItems().find((x) => x.id === id); if (!it) return;
    const err = this.store.buy(it);
    if (err) { this.app.toast(err); this.app.audio.ui('error'); } else { this.app.toast(`Purchased: ${it.name}`); this.app.audio.ui('confirm'); }
    this.render();
  }
  equip(id) {
    const st = this.store, cat = this.lockCat, p = st.profile, defs = { uniform: UNIFORMS, headgear: HEADGEAR, skin: WEAPON_SKINS, charm: CHARMS, title: TITLES, banner: BANNERS }[cat];
    const d = defs.find((x) => x.id === id); if (!d) return;
    const owned = d.price === 0 || (p.owned[cat] || []).includes(id);
    if (!owned) { this.app.toast('Not owned yet. Buy it in the Shop or earn it from the Battle Pass'); this.app.audio.ui('error'); return; }
    if (cat === 'title') p.title = id; else if (cat === 'banner') p.banner = id; else p.equipped[cat] = id;
    st.save(); this.render(); this.hero(); this.app.audio.ui('confirm');
  }
}
void PRICE; void passRewards;
