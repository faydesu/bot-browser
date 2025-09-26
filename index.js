// Bot's Browser – SillyTavern UI Extension
// สร้างปุ่มบนทูลบาร์ เปิด overlay หน้าจอโทรศัพท์ + ประวัติการค้นหา (จำลองจากบริบทแชท)

(function () {
  // ---- Search topics (ของคุณ) ----
  const searchTopics = {
    date: {
      keywords: ['เดท', 'นัด', 'เที่ยว', 'ดูหนัง', 'กินข้าว', 'เจอกัน'],
      queries: [
        'วิธีพิสูจน์ความรักให้แฟนเชื่อแบบไม่เจ้าชู้',
        'สถานที่เดทโรแมนติกในกรุงเทพ',
        'มุกจีบแฟนให้เขินๆ แต่ไม่เลี่ยน',
        'แต่งตัวไปเดทยังไงให้ดูดี',
        'ร้านอาหารสำหรับเดทแรก'
      ]
    },
    food: {
      keywords: ['กินอะไร', 'หิว', 'ร้านอาหาร', 'ทำอาหาร', 'ของหวาน', 'สูตร'],
      queries: [
        'สูตรต้มยำกุ้งรสเด็ดทำง่าย',
        'ร้านบุฟเฟ่ต์เปิดใหม่ใกล้ฉัน',
        'วิธีทำช็อกโกแลตลาวา',
        '10 เมนูอาหารเย็นทำเอง',
        'คาเฟ่ขนมหวานน่ารักๆ'
      ]
    },
    travel: {
      keywords: ['เที่ยว', 'ทะเล', 'ภูเขา', 'พักผ่อน', 'เดินทาง', 'ทริป'],
      queries: [
        'ที่พักติดทะเลวิวสวยๆ',
        'แพลนเที่ยวเชียงใหม่ 3 วัน 2 คืน',
        'ของที่ต้องเตรียมไปแคมป์ปิ้ง',
        'วิธีจัดกระเป๋าเดินทางให้เบาที่สุด',
        'เกาะสวยน้ำใสคนไม่เยอะ'
      ]
    },
    default: {
      keywords: [],
      queries: [
        'วิธีทำให้แชทสนุกไม่น่าเบื่อ',
        'คำคมความรักบาดใจ',
        'เรื่องตลกสั้นๆ',
        'วิธีพูดให้กำลังใจคนที่เหนื่อย',
        'เพลงฟังสบายๆ'
      ]
    }
  };

  // ---- DOM helpers ----
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

  // ---- UI: create overlay (hidden by default) ----
  function createPhoneUI() {
    if (qs('#bot-search-overlay')) return; // ป้องกันซ้ำ

    const overlay = document.createElement('div');
    overlay.id = 'bot-search-overlay';
    overlay.innerHTML = `
      <div class="phone-screen" role="dialog" aria-modal="true" aria-label="Bot Browser">
        <div class="phone-header">
          <span class="title">โทรศัพท์ของ หลี่ เจียห่าว</span>
          <button class="close-btn" aria-label="Close" title="Close">×</button>
        </div>
        <div class="browser-ui">
          <div class="browser-header">
            <span class="back-arrow">ㄑ</span>
            <span>เบราว์เซอร์</span>
          </div>
          <div class="browser-icon-container">
            <div class="browser-icon">
              <i class="fa-regular fa-compass compass"></i>
            </div>
          </div>
          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>ประวัติการค้นหา</span>
          </div>
          <div class="search-history-list" id="bot-search-history"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'bot-search-overlay') hidePhoneUI();
    });
    overlay.querySelector('.close-btn').addEventListener('click', hidePhoneUI);
    document.addEventListener('keydown', escToClose);
  }

  function escToClose(e) {
    if (e.key === 'Escape') hidePhoneUI();
  }

  function hidePhoneUI() {
    const overlay = qs('#bot-search-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function showPhoneUI() {
    // ดึงแชทล่าสุดจาก context ปัจจุบัน
    const { chat } = SillyTavern.getContext();
    const chatHistoryText = (chat || []).slice(-4).map(m => m?.mes || '').join(' ');

    // หาหัวข้อที่ match
    let relevant = 'default';
    for (const topic of Object.keys(searchTopics)) {
      if (topic === 'default') continue;
      const hit = searchTopics[topic].keywords.some(k => chatHistoryText.includes(k));
      if (hit) { relevant = topic; break; }
    }

    // render รายการ
    const list = qs('#bot-search-history');
    if (list) {
      list.innerHTML = '';
      for (const q of searchTopics[relevant].queries) {
        const item = document.createElement('div');
        item.className = 'search-history-item';
        item.textContent = q;
        list.appendChild(item);
      }
    }

    const overlay = qs('#bot-search-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  // ---- Toolbar button ----
  function mountToolbarButton() {
    if (qs('#bot-browser-button')) return; // กันปุ่มซ้ำ

    const btn = document.createElement('div');
    btn.id = 'bot-browser-button';
    btn.className = 'fa-solid fa-mobile-screen-button custom-icon';
    btn.title = 'ดูเบราว์เซอร์ของบอท';
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;

    btn.addEventListener('click', showPhoneUI);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPhoneUI(); }
    });

    const holder = qs('#extensions_buttons');
    if (holder) holder.appendChild(btn);
  }

  // ---- Boot: wait for SillyTavern app to be ready ----
  const { eventSource, event_types } = SillyTavern.getContext();
  eventSource.on(event_types.APP_READY, () => {
    createPhoneUI();
    mountToolbarButton();
  });

  // ถ้าบางทีโหลดส่วนขยายหลังแอปพร้อมแล้ว
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // เผื่อ APP_READY ผ่านไปแล้ว ให้ลองทำงานทันทีแบบเบาๆ
    setTimeout(() => { try { createPhoneUI(); mountToolbarButton(); } catch (_) {} }, 0);
  }
})();        // ผลการค้นหาเริ่มต้น (ถ้าไม่เจอคีย์เวิร์ด)
        default: {
            keywords: [],
            queries: [
                'วิธีทำให้แชทสนุกไม่น่าเบื่อ',
                'คำคมความรักบาดใจ',
                'เรื่องตลกสั้นๆ',
                'วิธีพูดให้กำลังใจคนที่เหนื่อย',
                'เพลงฟังสบายๆ',
            ],
        },
    };

    // ฟังก์ชันสำหรับสร้าง UI ของโทรศัพท์ (จะถูกสร้างและซ่อนไว้ตอนแรก)
    function createPhoneUI() {
        const overlay = document.createElement('div');
        overlay.id = 'bot-search-overlay';
        
        overlay.innerHTML = `
            <div class="phone-screen">
                <div class="phone-header">
                    <span>โทรศัพท์ของ หลี่ เจียห่าว</span>
                    <span class="close-btn">X</span>
                </div>
                <div class="browser-ui">
                    <div class="browser-header">
                        <span class="back-arrow">ㄑ</span>
                        <span>เบราว์เซอร์</span>
                    </div>
                    <div class="browser-icon-container">
                        <div class="browser-icon">
                            <i class="fa-regular fa-compass compass"></i>
                        </div>
                    </div>
                    <div class="search-bar">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <span>ประวัติการค้นหา</span>
                    </div>
                    <div class="search-history-list" id="bot-search-history">
                        </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);

        // เพิ่ม event listener ให้ปุ่มปิดและพื้นหลัง
        overlay.querySelector('.close-btn').addEventListener('click', hidePhoneUI);
        overlay.addEventListener('click', (event) => {
            if (event.target.id === 'bot-search-overlay') {
                hidePhoneUI();
            }
        });
    }

    // ฟังก์ชันซ่อน UI
    function hidePhoneUI() {
        const overlay = document.getElementById('bot-search-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // ฟังก์ชันแสดง UI และอัปเดตเนื้อหา
    function showPhoneUI() {
        // 1. ดึงประวัติแชทล่าสุด (ประมาณ 4 ข้อความล่าสุด)
        const chatHistory = get_chat_history().slice(-4).map(msg => msg.mes).join(' ');
        
        // 2. หาหัวข้อที่ตรงกับคีย์เวิร์ด
        let relevantTopic = 'default';
        for (const topic in searchTopics) {
            if (topic !== 'default') {
                for (const keyword of searchTopics[topic].keywords) {
                    if (chatHistory.includes(keyword)) {
                        relevantTopic = topic;
                        break;
                    }
                }
            }
            if (relevantTopic !== 'default') break;
        }

        // 3. นำรายการค้นหาของหัวข้อนั้นมาแสดง
        const searchQueries = searchTopics[relevantTopic].queries;
        const historyList = document.getElementById('bot-search-history');
        historyList.innerHTML = ''; // เคลียร์รายการเก่า
        searchQueries.forEach(query => {
            const item = document.createElement('div');
            item.className = 'search-history-item';
            item.textContent = query;
            historyList.appendChild(item);
        });

        // 4. แสดง UI
        const overlay = document.getElementById('bot-search-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    // ฟังก์ชันหลักที่จะทำงานเมื่อ Extension ถูกโหลด
    function onExtensionLoaded() {
        // สร้างปุ่มบนแถบเมนู
        const button = document.createElement('div');
        button.id = 'bot-browser-button';
        button.className = 'fa-solid fa-mobile-screen-button custom-icon'; // ไอคอนรูปโทรศัพท์
        button.title = 'ดูเบราว์เซอร์ของบอท';
        
        button.addEventListener('click', showPhoneUI);

        // เพิ่มปุ่มเข้าไปใน UI
        const extensionsButtons = document.querySelector('#extensions_buttons');
        if (extensionsButtons) {
            extensionsButtons.appendChild(button);
        }

        // สร้าง UI โทรศัพท์เตรียมไว้ (แต่ซ่อนอยู่)
        createPhoneUI();
    }

    // รอให้หน้าเว็บโหลดเสร็จก่อนค่อยทำงาน
    document.addEventListener('DOMContentLoaded', onExtensionLoaded);
})();
