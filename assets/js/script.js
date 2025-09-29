// Application State
        let state = {
            auth: { isLoggedIn: false, email: '', name: '' },
            profile: { name: '', email: '', dob: '', school: '', grade: '', field: '' },
            missions: {
                s1: [false, false, false],
                s2: [false, false, false],
                goalsSaved: false,
                cvBuilt: false,
                explorerCompleted: false,
                fieldSelected: false,
                pathwaySelected: false
            },
            pathway: '',
            goals: { academic: '', horizon: '', content: '' },
            cv: { headline: '', location: '', summary: '', education: '', skills: '' },
            navigation: { previousScreen: 'learning' },
            careerQuiz: { taken: false, result: null, favorites: [] }
        };

        //Tukar saveState sebab nak buat autosave ke dalam Google Sheet secara auto kalau pelajar selesai mana-mana mission atau update field


        /*function saveState() {
          localStorage.setItem('tvetmara_state', JSON.stringify(state));
          window.state = state; // penting utk modul data-save
        }*/

        function saveState() {
          try { localStorage.setItem('tvetmara_state', JSON.stringify(state)); } catch (_) {}
          window.state = state; // penting utk modul lain
        }


          /*function saveState() {
  // — kod asal simpan state —
  try {
    localStorage.setItem('tvetmara_state', JSON.stringify(state));
  } catch (_) {}
  window.state = state;  // penting supaya modul lain nampak state

  // === AUTOSAVE HOOK (cooldown 2s supaya tak spam baris) ===
  if (!window.__autoSaveCooldown || Date.now() > window.__autoSaveCooldown) {
    window.__autoSaveCooldown = Date.now() + 2000;
    try {                     // isi hidden inputs (8 lajur)
      if (typeof window.syncSaveFields === 'function') window.syncSaveFields();
    } catch (e) { console.warn('syncSaveFields:', e); }

    const send = window.sendToSheetSafe || window.sendToSheet;  // fungsi hantar sedia ada
    //const send = window.sendToSheetSafe;
    if (typeof send === 'function') {
      setTimeout(() => {   // async supaya tak block UI
        try { send(); console.log('[AUTO] saveState -> send'); } 
        catch (e) { console.warn('sendToSheet failed', e); }
      }, 0);
    } else {
      console.warn('sendToSheet function not found');
    }
  }
}*/




        function loadState() {
          const saved = localStorage.getItem('tvetmara_state');
          if (saved) state = { ...state, ...JSON.parse(saved) };
          window.state = state; // penting utk modul data-save
        }



        /* ----------------- LOCK / VISIBILITY HELPERS ----------------- */
/* Anggapkan: 
   - “Section 2 siap” = semua mission s2 true
   - “Choose Your Direction siap” = fieldSelected && pathwaySelected
   - “Passport boleh” = cvBuilt true
*/

function isSection2Done() {
  return Array.isArray(state?.missions?.s2) && state.missions.s2.every(Boolean);
}
function isDirectionChosen() {
  return !!(state?.missions?.fieldSelected && state?.missions?.pathwaySelected);
}
function canOpenPassport() {
  return !!state?.missions?.cvBuilt;
}

/* 1) Footer: sembunyi ikon/btn Passport selagi belum save CV */
function updateFooterLocks() {
  // Cuba beberapa id/selector yang mungkin digunakan pada footer
  const elCandidates = [
    document.getElementById('footerPassport'),
    document.getElementById('footer-passport'),
    document.querySelector('[data-footer="passport"]'),
    document.querySelector('#footer a[href="#passport"]'),
    document.querySelector('#footer button[data-target="passport"]')
  ].filter(Boolean);

  const hide = !canOpenPassport();
  elCandidates.forEach(el => el.classList.toggle('hidden', hide));
}

/* 2) Hamburger menu: lock Goals & CV Builder sampai syarat dipenuhi */
function updateHamburgerLocks() {
  // Item menu utk Goals
  const goalsItems = [
    document.querySelector('[data-menu="goals"]'),
    document.getElementById('menu-goals')
  ].filter(Boolean);

  // Item menu utk CV Builder
  const cvItems = [
    document.querySelector('[data-menu="cvbuilder"]'),
    document.getElementById('menu-cvbuilder')
  ].filter(Boolean);

  // Item menu utk Passport (tunjuk icon kunci kalau belum)
  const passportItems = [
    document.querySelector('[data-menu="passport"]'),
    document.getElementById('menu-passport')
  ].filter(Boolean);

  const lockGoalsAndCV = !(isSection2Done() && isDirectionChosen());
  const lockPassport = !canOpenPassport();

  lockMenuSet(goalsItems, lockGoalsAndCV, 'Complete Section 2 & Choose Your Direction first');
  lockMenuSet(cvItems, lockGoalsAndCV, 'Complete Section 2 & Choose Your Direction first');
  lockMenuSet(passportItems, lockPassport, 'Save your CV first');

  // jika ada footer, samakan state
  updateFooterLocks();
}

function lockMenuSet(nodes, locked, hint) {
  nodes.forEach(node => {
    if (!node) return;
    node.classList.toggle('locked', locked);
    node.setAttribute('aria-disabled', locked ? 'true' : 'false');

    // Letak/membuang hint kecil (sekiranya kita ada span.hint di dalam)
    let hintSpan = node.querySelector('.lock-hint');
    if (locked) {
      if (!hintSpan) {
        hintSpan = document.createElement('div');
        hintSpan.className = 'lock-hint';
        hintSpan.textContent = '🔒 ' + hint;
        node.appendChild(hintSpan);
      }
    } else if (hintSpan) {
      hintSpan.remove();
    }
  });
}

/* Pastikan dipanggil bila state berubah */








        // Quiz Navigation State
        let currentQuiz = {
            questions: [],
            currentIndex: 0,
            answers: [],
            section: '',
            mission: 0
        };

        // Career Quiz Navigation State
        let currentCareerQuiz = {
            questions: [],
            currentIndex: 0,
            answers: [],
            scores: {}
        };

        // Goals state
        let goalsPageState = {
            selectedAcademic: '',
            selectedHorizon: '',
            isCustom: false,
            customContent: '',
            isEditing: false,
            editedGoals: {
                careerVision: '',
                keyMilestones: '',
                targetPosition: '',
                leadershipGoals: ''
            }
        };

        // TVETMARA Programs Database
        const tvetmaraPrograms = {
            'oil-gas': [
                { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Piping)' },
                { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Mechanical)' },
                { institution: 'KKTM Kemaman', program: 'Diploma in Electrical Engineering Technology (Plant Operation)' },
                { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Offshore Structure)' },
                { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Instrumentation and Control)' },
                { institution: 'KKTM Kemaman', program: 'Diploma in Petroleum Engineering Technology (Onshore Operation)' }
            ],
            'electrical': [
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Electrical Engineering Technology (Power)' },
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Electrical Engineering Technology (Domestic and Industry)' }
            ],
            'electronics': [
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Electronic Engineering Technology (Industry)' },
                { institution: 'KKTM Petaling Jaya', program: 'Diploma in Electronic Engineering (Internet Of Things)' },
                { institution: 'MJII', program: 'Diploma in Electronic Engineering (Robotic & Automation)' },
                { institution: 'MJII', program: 'Diploma in Electronic Engineering (Embedded System)' },
                { institution: 'MJII', program: 'Diploma in Electronic Engineering (Microelectronic)' },
                { institution: 'MJII', program: 'Diploma in Electronic Engineering (Electronics Measurement & Control)' },
                { institution: 'MJII', program: 'Diploma in Electronic Engineering (Data Transmission & Network)' }
            ],
            'biotech': [
                { institution: 'KKTM Lenggong', program: 'Diploma in Herbal and Natural Products (Herbal Science)' },
                { institution: 'KKTM Lenggong', program: 'Diploma in Herbal and Natural Products (Manufacturing)' },
                { institution: 'KKTM Lenggong', program: 'Diploma in Engineering Technology Plant Maintenance' },
                { institution: 'KKTM Lenggong', program: 'Diploma in Packaging Technology and Design' },
                { institution: 'KKTM Lenggong', program: 'Diploma in Biochemical Engineering Technology (Food)' }
            ],
            'civil': [
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Building Engineering Technology' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Advanced System)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Geo-Structure)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology Building (Forensic and Maintenance)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Highway and Transportation)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Building Services and Maintenance)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Building Information Modelling)' },
                { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Green Buildings)' }
            ],
            'manufacturing': [
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology' },
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Stamping Die)' },
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Plastic Injection Mould)' },
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Product Design)' },
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Technology' },
                { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Technology (RUTP)' },
                { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Technology and Process)' },
                { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Industrial Automation and Robotic)' },
                { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Manufacturing Design)' },
                { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Automotive Manufacturing)' },
                { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Quality and Productivity)' },
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Mechanical Design Engineering Technology' }
            ],
            'arts': [
                { institution: 'KKTM Rembau', program: 'Diploma in Furniture Design' },
                { institution: 'KKTM Rembau', program: 'Diploma in Fashion Design' },
                { institution: 'KKTM Rembau', program: 'Diploma in Digital Filmmaking' },
                { institution: 'KKTM Rembau', program: 'Diploma in Digital Media Design' },
                { institution: 'KKTM Rembau', program: 'Diploma in Interior Design' },
                { institution: 'KKTM Rembau', program: 'Diploma of Technopreneurship In Fashion' }
            ],
            'built-env': [
                { institution: 'KKTM Pasir Mas', program: 'Diploma in Architecture' }
            ],
            'materials': [
                { institution: 'KKTM Masjid Tanah', program: 'Diploma in Polymer Composite Processing Engineering Technology' },
                { institution: 'KKTM Masjid Tanah', program: 'Diploma in Ceramic Processing Engineering Technology' },
                { institution: 'KKTM Masjid Tanah', program: 'Diploma in Plastic Processing Engineering Technology' },
                { institution: 'KKTM Masjid Tanah', program: 'Diploma of Industry in Aerospace Composite Manufacturing' }
            ],
            'automotive': [
                { institution: 'KKTM Masjid Tanah', program: 'Diploma in Automotive Engineering Technology' }
            ],
            'biomedical': [
                { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Therapeutic)' },
                { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Diagnostic)' },
                { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Radiology and Imaging)' },
                { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Laboratory)' },
                { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Information and Communication Technology)' },
                { institution: 'KKTM Ledang', program: 'Diploma of Competency in Computer Networking and System Administration' }
            ]
        };

        // Field Data
        const fieldsData = {
            'oil-gas': { 
                name: 'Oil & Gas', 
                icon: '⛽',
                institution: 'KKTM Kemaman',
                companies: ['Petronas', 'Shell Malaysia', 'ExxonMobil', 'Murphy Oil'],
                skills: ['Process Engineering', 'Safety Management', 'Drilling Operations', 'Refinery Technology']
            },
            'electrical': { 
                name: 'Electrical', 
                icon: '⚡',
                institution: 'KKTM Pasir Mas',
                companies: ['Tenaga Nasional', 'Siemens', 'ABB Malaysia', 'Schneider Electric'],
                skills: ['Power Systems', 'Electrical Design', 'Motor Control', 'PLC Programming']
            },
            'electronics': { 
                name: 'Electronics', 
                icon: '🔌',
                institution: 'KKTM Pasir Mas, KKTM Petaling Jaya, MJII',
                companies: ['Intel Malaysia', 'Infineon', 'Bosch Malaysia', 'Flextronics'],
                skills: ['Circuit Design', 'Microcontrollers', 'PCB Layout', 'Embedded Systems']
            },
            'biotech': { 
                name: 'Biotechnology', 
                icon: '🧬',
                institution: 'KKTM Lenggong',
                companies: ['Genting Plantations', 'Sime Darby', 'Bio-X Malaysia', 'Pharmaniaga'],
                skills: ['Cell Culture', 'Genetic Engineering', 'Bioinformatics', 'Quality Control']
            },
            'civil': { 
                name: 'Civil', 
                icon: '🏗️',
                institution: 'KKTM Pasir Mas, KKTM Sri Gading',
                companies: ['IJM Corporation', 'Gamuda', 'MMC Corporation', 'WCT Holdings'],
                skills: ['Structural Design', 'Project Management', 'AutoCAD', 'Construction Planning']
            },
            'manufacturing': { 
                name: 'Manufacturing Mechanical', 
                icon: '⚙️',
                institution: 'KKTM Balik Pulau, KKTM Kuantan, KKTM Pasir Mas',
                companies: ['Proton', 'Genting Malaysia', 'Top Glove', 'Hartalega'],
                skills: ['CNC Machining', 'Quality Assurance', 'Lean Manufacturing', 'CAD Design']
            },
            'arts': { 
                name: 'Arts & Design', 
                icon: '🎨',
                institution: 'KKTM Rembau',
                companies: ['Media Prima', 'Astro Malaysia', 'Naga DDB', 'Leo Burnett'],
                skills: ['Graphic Design', 'Digital Marketing', 'UI/UX Design', 'Brand Development']
            },
            'built-env': { 
                name: 'Built Environment', 
                icon: '🏢',
                institution: 'KKTM Pasir Mas',
                companies: ['Sunway Group', 'SP Setia', 'UEM Sunrise', 'Eco World'],
                skills: ['Building Information Modeling', 'Sustainable Design', 'Urban Planning', 'Green Building']
            },
            'materials': { 
                name: 'Materials Processing', 
                icon: '🔬',
                institution: 'KKTM Masjid Tanah',
                companies: ['Genting Plantations', 'MISC Berhad', 'Petronas Chemicals', 'Lion Industries'],
                skills: ['Material Testing', 'Process Optimization', 'Quality Control', 'Chemical Analysis']
            },
            'automotive': { 
                name: 'Automotive', 
                icon: '🚗',
                institution: 'KKTM Masjid Tanah',
                companies: ['Proton', 'Perodua', 'Honda Malaysia', 'Toyota Malaysia'],
                skills: ['Engine Technology', 'Vehicle Diagnostics', 'Automotive Electronics', 'Hybrid Systems']
            },
            'biomedical': { 
                name: 'Biomedical', 
                icon: '🏥',
                institution: 'KKTM Ledang',
                companies: ['Mindray Malaysia', 'Siemens Healthineers', 'GE Healthcare', 'Philips Healthcare'],
                skills: ['Medical Device Design', 'Biomedical Instrumentation', 'Healthcare Technology', 'Regulatory Compliance']
            }
        };
window.fieldsData = fieldsData; // make globally accessible


        // Career Quiz Questions
        const careerQuizQuestions = [
            {
                question: "What type of activities do you enjoy most?",
                options: [
                    { text: "Building and fixing things", icon: "🔧", fields: ['manufacturing', 'automotive', 'civil'] },
                    { text: "Working with technology and computers", icon: "💻", fields: ['electronics', 'electrical', 'biomedical'] },
                    { text: "Creating and designing", icon: "🎨", fields: ['arts', 'built-env'] },
                    { text: "Researching and experimenting", icon: "🔬", fields: ['biotech', 'materials', 'oil-gas'] }
                ]
            },
            {
                question: "Which work environment appeals to you?",
                options: [
                    { text: "Laboratory or research facility", icon: "🧪", fields: ['biotech', 'materials', 'biomedical'] },
                    { text: "Factory or manufacturing plant", icon: "🏭", fields: ['manufacturing', 'automotive', 'oil-gas'] },
                    { text: "Office with design software", icon: "🖥️", fields: ['arts', 'built-env', 'electronics'] },
                    { text: "Construction sites or outdoors", icon: "🏗️", fields: ['civil', 'oil-gas', 'electrical'] }
                ]
            },
            {
                question: "What motivates you most?",
                options: [
                    { text: "Solving complex problems", icon: "🧩", fields: ['electrical', 'electronics', 'biomedical'] },
                    { text: "Creating beautiful things", icon: "✨", fields: ['arts', 'built-env'] },
                    { text: "Making things work efficiently", icon: "⚙️", fields: ['manufacturing', 'automotive', 'materials'] },
                    { text: "Discovering new knowledge", icon: "🔍", fields: ['biotech', 'oil-gas', 'civil'] }
                ]
            },
            {
                question: "Which subjects did you enjoy in school?",
                options: [
                    { text: "Mathematics and Physics", icon: "📐", fields: ['electrical', 'electronics', 'civil'] },
                    { text: "Chemistry and Biology", icon: "🧬", fields: ['biotech', 'materials', 'oil-gas'] },
                    { text: "Art and Design", icon: "🎭", fields: ['arts', 'built-env'] },
                    { text: "Engineering and Technology", icon: "⚡", fields: ['manufacturing', 'automotive', 'biomedical'] }
                ]
            },
            {
                question: "What type of projects excite you?",
                options: [
                    { text: "Developing new products", icon: "💡", fields: ['electronics', 'biomedical', 'materials'] },
                    { text: "Building infrastructure", icon: "🌉", fields: ['civil', 'built-env', 'electrical'] },
                    { text: "Creating visual content", icon: "🎬", fields: ['arts'] },
                    { text: "Improving processes", icon: "📈", fields: ['manufacturing', 'automotive', 'oil-gas', 'biotech'] }
                ]
            },
            {
                question: "How do you prefer to work?",
                options: [
                    { text: "With my hands and tools", icon: "🛠️", fields: ['manufacturing', 'automotive', 'civil'] },
                    { text: "With computers and software", icon: "💾", fields: ['electronics', 'arts', 'biomedical'] },
                    { text: "With people and teams", icon: "👥", fields: ['built-env', 'materials'] },
                    { text: "With data and analysis", icon: "📊", fields: ['biotech', 'oil-gas', 'electrical'] }
                ]
            },
            {
                question: "What impact do you want to make?",
                options: [
                    { text: "Improve people's health", icon: "❤️", fields: ['biotech', 'biomedical'] },
                    { text: "Build sustainable future", icon: "🌱", fields: ['built-env', 'materials', 'oil-gas'] },
                    { text: "Advance technology", icon: "🚀", fields: ['electronics', 'electrical', 'automotive'] },
                    { text: "Create and inspire", icon: "🌟", fields: ['arts', 'civil', 'manufacturing'] }
                ]
            }
        ];

        // Mission Questions
        const missionQuestions = {
            s1: {
                1: [
                    {
                        question: "What is the primary driver of innovation?",
                        options: ["Advanced technology only", "Curiosity and problem-solving mindset", "Large budgets", "Competition pressure"],
                        correct: 1
                    },
                    {
                        question: "Which approach best describes design thinking?",
                        options: ["Focus only on aesthetics", "Technical specifications first", "User-centered problem solving", "Cost reduction priority"],
                        correct: 2
                    },
                    {
                        question: "What makes a solution truly innovative?",
                        options: ["It uses the latest technology", "It's the most expensive option", "It follows traditional methods", "It solves real problems effectively"],
                        correct: 3
                    },
                    {
                        question: "How do successful innovators approach failure?",
                        options: ["Learn from it and iterate", "Avoid it at all costs", "Blame external factors", "Give up immediately"],
                        correct: 0
                    },
                    {
                        question: "What is the key to discovering new opportunities?",
                        options: ["Following trends blindly", "Copying competitors", "Observing problems and asking 'what if?'", "Waiting for inspiration"],
                        correct: 2
                    }
                ],
                2: [
                    {
                        question: "What is the foundation of good design?",
                        options: ["Using trendy colors", "Understanding user needs", "Complex features", "Personal preferences"],
                        correct: 1
                    },
                    {
                        question: "How do you build strong professional connections?",
                        options: ["Only network with senior people", "Focus solely on personal gain", "Be genuine and offer mutual value", "Avoid sharing knowledge"],
                        correct: 2
                    },
                    {
                        question: "What is design thinking's main benefit?",
                        options: ["Makes products look better", "Reduces development time", "Eliminates all risks", "Solves complex problems systematically"],
                        correct: 3
                    },
                    {
                        question: "How should you connect with your target audience?",
                        options: ["Listen actively and empathize", "Assume what they want", "Use complex technical language", "Focus only on features"],
                        correct: 0
                    },
                    {
                        question: "What makes design truly effective?",
                        options: ["Aesthetic appeal only", "Latest technology integration", "Functionality and user experience", "Minimal cost"],
                        correct: 2
                    }
                ],
                3: [
                    {
                        question: "What is the most important quality of a good leader?",
                        options: ["Being the smartest person", "Making all decisions alone", "Inspiring and empowering others", "Having the highest position"],
                        correct: 2
                    },
                    {
                        question: "How should project success be measured?",
                        options: ["By meeting objectives and stakeholder satisfaction", "Only by profit margins", "By speed of completion", "By individual recognition"],
                        correct: 0
                    },
                    {
                        question: "What's the key difference between managing and leading?",
                        options: ["Managers have higher salaries", "There's no difference", "Leaders work less hours", "Leaders inspire vision, managers execute processes"],
                        correct: 3
                    },
                    {
                        question: "How do effective leaders handle team conflicts?",
                        options: ["Ignore them until they resolve", "Take sides immediately", "Address them directly and fairly", "Avoid the team members"],
                        correct: 2
                    },
                    {
                        question: "What defines a clear project vision?",
                        options: ["Detailed technical specifications", "Complex strategic documents", "Individual task assignments", "Inspiring goals everyone understands"],
                        correct: 3
                    }
                ]
            },
            s2: {
                1: [
                    {
                        question: "What's the best way to identify your academic strengths?",
                        options: ["Only look at grades", "Ask others to decide for you", "Reflect on subjects you enjoy and excel in", "Choose the easiest subjects"],
                        correct: 2
                    },
                    {
                        question: "How should you approach continuous learning?",
                        options: ["Stop after formal education", "Only learn when required", "Embrace lifelong learning and skill development", "Focus on one skill forever"],
                        correct: 2
                    },
                    {
                        question: "What makes a subject truly interesting to study?",
                        options: ["Personal passion and curiosity", "High salary potential only", "Peer pressure", "Easy grading"],
                        correct: 0
                    },
                    {
                        question: "How do you choose the right academic pathway?",
                        options: ["Follow family expectations", "Pick the most popular field", "Choose based on difficulty level", "Align with your interests and career goals"],
                        correct: 3
                    },
                    {
                        question: "What's the key to academic success?",
                        options: ["Natural talent only", "Memorizing everything", "Consistent effort and effective study habits", "Competing with others"],
                        correct: 2
                    }
                ],
                2: [
                    {
                        question: "What should drive your career path choice?",
                        options: ["Only salary considerations", "Family expectations only", "Alignment with interests, values, and skills", "Current job market trends only"],
                        correct: 2
                    },
                    {
                        question: "Which skills are most important in any field?",
                        options: ["Combination of technical and soft skills", "Only technical skills", "Only communication skills", "Only leadership skills"],
                        correct: 0
                    },
                    {
                        question: "How should you plan career development?",
                        options: ["Let it happen naturally", "Change careers frequently", "Set clear goals and actively work toward them", "Avoid any planning"],
                        correct: 2
                    },
                    {
                        question: "What's the best way to explore career options?",
                        options: ["Read job descriptions only", "Rely on online quizzes", "Talk to professionals and gain hands-on experience", "Follow social media influencers"],
                        correct: 2
                    },
                    {
                        question: "How do you build a strong professional reputation?",
                        options: ["Self-promotion only", "Networking at events only", "Consistent quality work and ethical behavior", "Avoiding challenging projects"],
                        correct: 2
                    }
                ],
                3: [
                    {
                        question: "What makes a good business idea?",
                        options: ["It's completely original", "It requires no investment", "It solves a real problem for customers", "It guarantees immediate profit"],
                        correct: 2
                    },
                    {
                        question: "How do entrepreneurs identify problems to solve?",
                        options: ["Observe market needs and customer pain points", "Guess randomly", "Copy existing solutions", "Focus only on technology trends"],
                        correct: 0
                    },
                    {
                        question: "What's the best way to identify market opportunities?",
                        options: ["Ignore market research", "Follow competitors exactly", "Research customer needs and market gaps", "Rely only on intuition"],
                        correct: 2
                    },
                    {
                        question: "What's essential for entrepreneurial success?",
                        options: ["Having unlimited funding", "Perfect business plan", "Persistence and adaptability", "Avoiding all risks"],
                        correct: 2
                    },
                    {
                        question: "How should entrepreneurs approach customer feedback?",
                        options: ["Ignore negative feedback", "Only accept positive feedback", "Listen actively and adapt accordingly", "Defend your original idea"],
                        correct: 2
                    }
                ]
            }
        };

        



        // === data-save autosave (dipindahkan dari index.html) ===
(function(){
  if (window.__DATA_SAVE_WIRED__) return;           // elak gandaan
  window.__DATA_SAVE_WIRED__ = true;

  function setByPath(obj, path, val){
    const keys = path.split('.');
    let cur = obj;
    for (let i=0;i<keys.length-1;i++){
      const k=keys[i]; if(!cur[k]) cur[k]={}; cur=cur[k];
    }
    cur[keys[keys.length-1]] = val;
  }
  function getByPath(obj, path){
    return path.split('.').reduce((a,k)=> (a ? a[k] : undefined), obj);
  }
  function toStatePath(key){
    // Jika tiada dot, auto letak bawah profile.*
    return key.includes('.') ? key : ('profile.'+key);
  }

  function onChange(e){
    const el = e.target;
    const key = el.getAttribute('data-save');
    if (!key || !window.state) return;
    const path  = toStatePath(key);
    const value = (el.type === 'checkbox') ? el.checked : el.value;

    setByPath(window.state, path, value);
    try { localStorage.setItem('tvetmara_state', JSON.stringify(window.state)); } catch(_){}

    // Segera kemas kini nama di header bila nama tukar
    if (path === 'profile.name') {
      const h = document.getElementById('headerRegName'); if (h) h.textContent = value || '-';
      const p = document.getElementById('passportName');  if (p) p.textContent = value || '-';
    }
  }

  // Boleh dipanggil semula selepas tukar skrin
  window.hydrateDataSave = function hydrateDataSave(){
    if (!window.state) return;
    document.querySelectorAll('[data-save]').forEach(function(el){
      const key = toStatePath(el.getAttribute('data-save'));
      const val = getByPath(window.state, key);
      if (val !== undefined){
        if (el.type === 'checkbox') el.checked = !!val;
        else el.value = val;
      }
      el.removeEventListener('input', onChange);
      el.removeEventListener('change', onChange);
      el.addEventListener('input', onChange);
      el.addEventListener('change', onChange);
    });
  };
})();








        // State Management
        /*function saveState() {
            localStorage.setItem('tvetmara_state', JSON.stringify(state));
        }

        function loadState() {
            const saved = localStorage.getItem('tvetmara_state');
            if (saved) {
                state = { ...state, ...JSON.parse(saved) };
            }
        }*/

        // Authentication
        function toggleForm() {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (loginForm.classList.contains('hidden')) {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        }

        /*function register() {
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            state.auth = { isLoggedIn: true, email, name };
            state.profile.name = name;
            state.profile.email = email;
            
            saveState();
            updateUI();
            showScreen('welcome');
            
            enableAppUIAfterLogin();
            updateHeaderName();
            setTimeout(() => { try { syncSaveFields(); } catch (e) { console.warn('syncSaveFields fail', e); } }, 0);
            

        }*/

async function register(){





  /*const name  = document.getElementById('regName')?.value?.trim() || '';
  const email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
  const pwd   = document.getElementById('regPassword')?.value || '';
  if (!email || !pwd || !name) { alert('Please fill name, email & password'); return; }
  */

  clearValidationErrors?.();

  const name  = document.getElementById('regName')?.value?.trim() || '';
  const email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
  const pwd   = document.getElementById('regPassword')?.value || '';

  let hasErrors = false; const missing = [];

  // Email mesti ada @ (dan format asas)
  const emailOk = !!email && email.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk){
    showFieldError?.('regEmail', 'Please enter a valid email');
    missing.push('Email'); hasErrors = true;
  }

  // Password min 8 aksara
  if (!pwd || pwd.length < 8){
    showFieldError?.('regPassword', 'Password must be at least 8 characters');
    missing.push('Password'); hasErrors = true;
  }

  if (!name){
    showFieldError?.('regName', 'Name is required');
    missing.push('Name'); hasErrors = true;
  }

  if (hasErrors){
    (showErrorMessage?.(`Please complete: ${missing.join(', ')}`)) || alert(`Please complete: ${missing.join(', ')}`);
    return;
  }

  try{
    const { endpoint, token } = GAS_CONFIG;
    const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({ token, action:'registerAccount', data:{ email, name, password: pwd } }) });
    const json = await res.json();

    if (!json.ok) { alert(json.error || 'Register failed'); return; }

    // login terus (token sesi – laju)
    state.auth = { isLoggedIn:true, email, name };
    state.profile = { ...(state.profile||{}), name, email };
    localStorage.setItem('tvetmara_token', json.token);

    saveState();
    updateUI?.(); updateHeaderName?.();
    state.navigation = { ...(state.navigation||{}), onboarding:true }; // untuk alur profile->learning
    showScreen('welcome');

    // (opsyen) autosave snapshot
    setTimeout(()=>{ try{ autoSaveToSheet?.('register'); }catch(_){} }, 0);

  }catch(e){ console.error(e); alert('Register failed'); }
}
window.register = register;




        /*async function login(){
  const emailEl = document.getElementById('loginEmail');
  const email = (emailEl?.value || '').trim().toLowerCase();
  if (!email) { alert('Please enter your email.'); return; }

  try{
    const { endpoint, token } = window.GAS_CONFIG || {};
    if (!endpoint || !token) { alert('Server not configured.'); return; }

    const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({ token, action:'checkEmail', data:{ email } }) });
    const text = await res.text(); let json = {}; try { json = JSON.parse(text); } catch(_){}
    if (!res.ok || json.ok === false) throw new Error(json.error || ('HTTP '+res.status));

    if (!json.exists){
      alert('This email doesn’t exist. Please register!');
      return;
    }

    // ====== gunakan rekod TERKINI ======
    const r = json.row || {};

    // senyapkan autosave masa login supaya tak tambah baris
    const prevNoSheet = window.__noSheet; window.__noSheet = true;

    // isi auth & profile daripada row terbaru
    state.auth = { isLoggedIn:true, email, name: r['Name'] || state.auth?.name || '' };

    // jika anda perlukan 'field' (key), cuba padankan SelectedField (nama) kepada key dalam fieldsData
    let fieldKey = state.profile?.field || '';
    if (!fieldKey && r['SelectedField'] && window.fieldsData){
      for (const [k,v] of Object.entries(window.fieldsData)){
        if ((v?.name||'').trim().toLowerCase() === String(r['SelectedField']).trim().toLowerCase()){
          fieldKey = k; break;
        }
      }
    }

    state.profile = {
      ...(state.profile||{}),
      name:   r['Name']        || state.profile?.name   || state.auth?.name || '',
      email:  r['Email']       || email,
      dob:    r['DOB']         || state.profile?.dob    || '',
      school: r['School']      || state.profile?.school || '',
      grade:  r['GradeLevel']  || state.profile?.grade  || '',
      field:  fieldKey || state.profile?.field || ''
    };

    // pathway & lain-lain jika berguna di UI
    state.pathway = r['Pathway'] || state.pathway || '';

    saveState();
    updateUI?.();
    updateHeaderName?.();

    showScreen( document.getElementById('welcome') ? 'welcome' : 'learning' );

    // buka semula autosave
    setTimeout(()=>{ window.__noSheet = prevNoSheet || false; }, 400);

  }catch(e){
    console.error('Login error:', e);
    alert('Login failed: ' + (e.message || e));
  }
}

window.login = login;  // pastikan global

*/


        /*function logout() {
            state.auth = { isLoggedIn: false, email: '', name: '' };
            saveState();
            showScreen('cover');
            showFooterMenu(false);
            markActiveFooter('');

        }*/

// Initialize Application
        async function init(){
          // --- kekalkan inisialisasi sedia ada
          loadState();
          updateUI();
          populateFields();
          updateHamburgerLocks?.();
          updateFooterLocks?.();
          updateHeaderName?.();
          if (typeof hydrateDataSave === 'function') hydrateDataSave();

          // --- LOGIN PANTAS DENGAN TOKEN
          const sess = localStorage.getItem('tvetmara_token');
          if (sess) {
            // masuk terus (elak tunggu 3-5s); sahkan di belakang tab
            state.auth = { ...(state.auth||{}), isLoggedIn: true };
            saveState();
            showScreen(document.getElementById('welcome') ? 'welcome' : 'learning');

            // sahkan token secara async; kalau tidak sah → logout
            validateToken(sess).catch(() => { logout(); });
            return; // hentikan init di sini
          }

          // --- fallback biasa jika tiada token
          if (state.auth?.isLoggedIn) {
            showScreen('welcome');
          } else {
            showScreen('cover');
          }
        }

        // pemanggil kecil untuk sahkan token
        async function validateToken(token){
          const { endpoint, token: apiToken } = GAS_CONFIG || {};
          const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({
            token: apiToken, action: 'validateToken', data: { token }
          })});
          const json = await res.json();
          if (!json.ok || !json.valid) throw new Error('Invalid session');
        }




        async function login(){
          const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
          const pwd   = document.getElementById('loginPassword')?.value || '';
          if (!email || !pwd) { alert('Enter email & password'); return; }

          try{
            const { endpoint, token } = GAS_CONFIG;
            const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({ token, action:'loginAccount', data:{ email, password: pwd } }) });
            const json = await res.json();
            if (!json.ok) { alert(json.error || 'Login failed'); return; }

            // login segera + simpan token
            localStorage.setItem('tvetmara_token', json.token);
            state.auth    = { isLoggedIn:true, email, name: json.name || state.auth?.name || '' };
            state.profile = { ...(state.profile||{}), email, name: json.name || state.profile?.name || '' };

            saveState(); updateUI?.(); updateHeaderName?.();
            showScreen('welcome');
          }catch(e){ console.error(e); alert('Login failed'); }
        }
        window.login = login;




        function logout(){
          // senyapkan autosave sepanjang reset
          window.__noSheet = true;

          // buang token sesi
          localStorage.removeItem('tvetmara_token');

          // reset state minimum
          state = {
            auth: { isLoggedIn: false, email: '', name: '' },
            profile: {},
            missions: { s1:[false,false,false], s2:[false,false,false],
              goalsSaved:false, cvBuilt:false, explorerCompleted:false,
              fieldSelected:false, pathwaySelected:false },
            pathway: '',
            navigation: {}
          };

          saveState();
          updateUI?.();
          updateHeaderName?.();
          showScreen('cover');

          // buka semula autosave selepas UI stabil
          setTimeout(() => { window.__noSheet = false; }, 400);
        }

        // Forgot password

        async function startForgot(){
            const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
            if (!email) { alert('Enter your email first.'); return; }
            try{
                const { endpoint, token } = GAS_CONFIG;
                const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({ token, action:'startPasswordReset', data:{ email } }) });
                const json = await res.json();
                if (!json.ok) { alert(json.error || 'Failed'); return; }
                alert('A reset code has been emailed to you. Please check your inbox.');
                document.getElementById('fpArea')?.classList.remove('hidden');
            }catch(e){ console.error(e); alert('Failed to start reset'); }
            }
            window.startForgot = startForgot;

            async function confirmForgot(){
            const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
            const code  = (document.getElementById('fpCode')?.value || '').trim();
            const newPw = document.getElementById('fpNew')?.value || '';
            if (!email || !code || !newPw){ alert('Fill email, code & new password'); return; }
            try{
                const { endpoint, token } = GAS_CONFIG;
                const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify({ token, action:'confirmPasswordReset', data:{ email, code, newPassword:newPw } }) });
                const json = await res.json();
                if (!json.ok) { alert(json.error || 'Failed'); return; }
                alert('Password updated. Please login.');
            }catch(e){ console.error(e); alert('Failed to reset'); }
        }
        window.confirmForgot = confirmForgot;





        // Screen Management
        /*function showScreen(screenName, fromScreen = null) {
            // Track previous screen for navigation
            if (fromScreen) {
                state.navigation.previousScreen = fromScreen;
            } else if (screenName === 'fields' || screenName === 'pathway') {
                // When going to fields or pathway, remember where we came from
                const currentScreen = document.querySelector('.screen:not(.hidden)');
                if (currentScreen) {
                    state.navigation.previousScreen = currentScreen.id;
                }
            }
            
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.add('hidden');
            });
            
            document.getElementById(screenName).classList.remove('hidden');
            
            const nav = document.getElementById('navigation');
            if (screenName === 'cover') {
                nav.classList.add('hidden');
            } else {
                nav.classList.remove('hidden');
            }
            
            if (screenName === 'profile') loadProfile();
            if (screenName === 'learning') updateLearningScreen();
            if (screenName === 'dashboard') {
                updateDashboard();
                updatePathwayTimeline();
            }
            if (screenName === 'skills') updateSkillsScreen();
            if (screenName === 'passport') updatePassport();
            if (screenName === 'goals') loadGoalsPage();
            if (screenName === 'cvbuilder') loadCVBuilderPage();

            setTimeout(()=>{ try { hydrateDataSave(); } catch(_) {} }, 0);
        }*/

            function showScreen(screenName, fromScreen = null) {
  const was = state.navigation?.currentScreen ||
              (document.querySelector('.screen:not(.hidden)')?.id || null);

  // ▼ bila pergi ke 'profile', rekod skrin asal untuk patah balik
  if (screenName === 'profile') {
    state.navigation.previousScreen =
      was && was !== 'cover' ? was : (state.navigation?.previousScreen || 'dashboard');
  } else if (fromScreen) {
    state.navigation.previousScreen = fromScreen;
  } else if (screenName === 'fields' || screenName === 'pathway') {
    state.navigation.previousScreen = was;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  (document.getElementById(screenName) || document.getElementById('welcome') || document.getElementById('cover'))
    .classList.remove('hidden');

  const nav = document.getElementById('navigation');
  if (nav) (screenName === 'cover') ? nav.classList.add('hidden') : nav.classList.remove('hidden');

  if (screenName === 'profile')   loadProfile();
  if (screenName === 'learning')  updateLearningScreen();
  if (screenName === 'dashboard') { updateDashboard(); updatePathwayTimeline(); }
  if (screenName === 'skills')    updateSkillsScreen();
  if (screenName === 'passport')  updatePassport();
  if (screenName === 'goals')     loadGoalsPage();
  if (screenName === 'cvbuilder') loadCVBuilderPage();

  state.navigation.currentScreen = screenName;
  setTimeout(()=>{ try { hydrateDataSave?.(); } catch(_) {} }, 0);
}




        // Profile Management
        function loadProfile() {
            document.getElementById('profileName').value = state.profile.name || '';
            document.getElementById('profileEmail').value = state.profile.email || '';
            document.getElementById('profileDob').value = state.profile.dob || '';
            document.getElementById('profileSchool').value = state.profile.school || '';
            document.getElementById('profileGrade').value = state.profile.grade || '';
            document.getElementById('profileField').value = state.profile.field || '';
            
            // Load profile picture if exists
            if (state.profile.profilePicture) {
                const display = document.getElementById('profilePictureDisplay');
                display.innerHTML = `<img src="${state.profile.profilePicture}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
            }
        }

        function handleProfilePictureChange(input) {
            const file = input.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert('File size should be less than 2MB');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const display = document.getElementById('profilePictureDisplay');
                    display.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
                    
                    // Save to both profile and CV state for consistency
                    state.profile.profilePicture = e.target.result;
                    if (!state.cv) state.cv = {};
                    state.cv.profilePicture = e.target.result;
                    saveState();
                };
                reader.readAsDataURL(file);
            }
        }

        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            field.classList.add('border-red-500', 'bg-red-50');
            field.classList.remove('border-gray-300');
        }
        
        function showErrorMessage(message) {
            const errorDiv = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
        }
        
        function clearValidationErrors() {
            document.querySelectorAll('#profile input, #profile select').forEach(field => {
                field.classList.remove('border-red-500', 'bg-red-50');
                field.classList.add('border-gray-300');
            });
            
            document.getElementById('errorMessage').classList.add('hidden');
        }

        function saveProfile() {
            clearValidationErrors();
            
            const name = document.getElementById('profileName').value.trim();
            const dob = document.getElementById('profileDob').value;
            const school = document.getElementById('profileSchool').value.trim();
            const grade = document.getElementById('profileGrade').value;
            
            let hasErrors = false;
            const missingFields = [];
            
            if (!name) {
                showFieldError('profileName', 'Full Name is required');
                missingFields.push('Full Name');
                hasErrors = true;
            }
            
            if (!dob) {
                showFieldError('profileDob', 'Date of Birth is required');
                missingFields.push('Date of Birth');
                hasErrors = true;
            }
            
            if (!school) {
                showFieldError('profileSchool', 'School/Institution is required');
                missingFields.push('School/Institution');
                hasErrors = true;
            }
            
            if (!grade) {
                showFieldError('profileGrade', 'Grade Level is required');
                missingFields.push('Grade Level');
                hasErrors = true;
            }
            
            if (hasErrors) {
                showErrorMessage(`Please complete the following required fields: ${missingFields.join(', ')}`);
                return;
            }
            
            // GANTI bahagian ini dalam saveProfile()
            state.profile = {
                ...(state.profile || {}),
                name,
                email: document.getElementById('profileEmail').value,
                dob,
                school,
                grade,
                field: document.getElementById('profileField').value
                };

            saveState();
            updateUI();
            updateHeaderName?.();
            
                // ▼ Tentukan destinasi
const cameFrom = state.navigation?.previousScreen || 'dashboard';
if (state.navigation?.onboarding) {
  // onboard sekali je → ke #learning
  state.navigation.onboarding = false;       // reset flag
  showScreen('learning');
} else {
  // kalau datang dari dashboard/apa-apa skrin, patah balik ke situ
  showScreen(cameFrom === 'profile' ? 'dashboard' : cameFrom);
}

// ▼ Pastikan setiap klik "Save Profile" hantar ke Google Sheet
setTimeout(() => {
  try { syncSaveFields?.(); } catch(_) {}
  try { (window.sendToSheetSafe || window.sendToSheet)?.(); } catch(_) {}
}, 0);

        }

        // Timeline System
        function updatePathwayTimeline() {
            const hasField = state.profile.field;
            const hasPathway = state.pathway;
            
            const timelineDefault = document.getElementById('timelineDefault');
            const timelineSteps = document.getElementById('timelineSteps');
            
            if (!hasField || !hasPathway) {
                timelineDefault.classList.remove('hidden');
                timelineSteps.classList.add('hidden');
                return;
            }
            
            timelineDefault.classList.add('hidden');
            timelineSteps.classList.remove('hidden');
            
            const field = (window.fieldsData || fieldsData)[state.profile.field];
            const pathway = state.pathway;
            const currentGrade = state.profile.grade || 'Form 1';
            
            // Update Step 1 - Current Education
            document.getElementById('step1Title').textContent = currentGrade;
            document.getElementById('step1Desc').textContent = state.profile.school || 'Current School';
            
            // Update Step 2 - TVET Institution
            document.getElementById('step2Title').textContent = 'TVET';
            document.getElementById('step2Desc').textContent = field.institution;
            
            // Update Step 3 & 4 based on pathway
            if (pathway === 'Academic') {
                document.getElementById('step3Icon').textContent = '🏛️';
                document.getElementById('step3Title').textContent = 'University';
                document.getElementById('step3Desc').textContent = `${field.name} Degree to Master/PhD`;
                document.getElementById('step3Years').textContent = '4-8 years';
                
                document.getElementById('step4Title').textContent = 'Research/Academia';
                document.getElementById('step4Desc').textContent = `${field.name} Researcher/Professor`;
                
                document.getElementById('pathwaySummaryType').textContent = 'Academic';
                document.getElementById('pathwaySummary').textContent = `Follow the academic pathway to become a ${field.name} researcher, professor, or academic expert contributing to knowledge and innovation.`;
                
            } else if (pathway === 'Career') {
                document.getElementById('step3Icon').textContent = '🏢';
                document.getElementById('step3Title').textContent = 'Industry';
                document.getElementById('step3Desc').textContent = `${field.name} Professional Role`;
                document.getElementById('step3Years').textContent = 'Direct entry';
                
                document.getElementById('step4Title').textContent = 'Senior Career';
                document.getElementById('step4Desc').textContent = `${field.name} Manager/Expert`;
                
                document.getElementById('pathwaySummaryType').textContent = 'Career';
                document.getElementById('pathwaySummary').textContent = `Follow the career pathway to become a skilled ${field.name} professional working in leading companies and advancing to senior positions.`;
                
            } else if (pathway === 'Entrepreneur') {
                document.getElementById('step3Icon').textContent = '🚀';
                document.getElementById('step3Title').textContent = 'Startup';
                document.getElementById('step3Desc').textContent = `${field.name} Business Venture`;
                document.getElementById('step3Years').textContent = 'Immediate';
                
                document.getElementById('step4Title').textContent = 'Business Leader';
                document.getElementById('step4Desc').textContent = `${field.name} Entrepreneur/CEO`;
                
                document.getElementById('pathwaySummaryType').textContent = 'Entrepreneurship';
                document.getElementById('pathwaySummary').textContent = `Follow the entrepreneurship pathway to create innovative ${field.name} businesses and become a leader in industry transformation.`;
            }
            
            // Update summary badges
            document.getElementById('summaryField').textContent = field.name;
            document.getElementById('summaryPathway').textContent = pathway;
            
            // Show TVETMARA programs section
            const tvetmaraSection = document.getElementById('tvetmaraPrograms');
            const programsList = document.getElementById('programsList');
            
            if (tvetmaraPrograms[state.profile.field] && tvetmaraPrograms[state.profile.field].length > 0) {
                const programs = tvetmaraPrograms[state.profile.field];
                
                // Group programs by institution
                const programsByInstitution = {};
                programs.forEach(program => {
                    if (!programsByInstitution[program.institution]) {
                        programsByInstitution[program.institution] = [];
                    }
                    programsByInstitution[program.institution].push(program.program);
                });
                
                // Generate HTML for programs
                let programsHTML = '';
                Object.entries(programsByInstitution).forEach(([institution, institutionPrograms]) => {
                    programsHTML += `
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h6 class="font-bold text-blue-700 mb-3 flex items-center">
                                <span class="text-lg mr-2">🏫</span>
                                ${institution}
                            </h6>
                            <div class="space-y-2">
                                ${institutionPrograms.map(program => `
                                    <div class="flex items-start space-x-2">
                                        <span class="text-green-500 mt-1">•</span>
                                        <span class="text-sm text-gray-700">${program}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
                
                programsList.innerHTML = programsHTML;
                tvetmaraSection.classList.remove('hidden');
            } else {
                tvetmaraSection.classList.add('hidden');
            }

            // Tambah dua baris ini
            updateHamburgerLocks();
            updateFooterLocks();
        }

        // Learning System
        function updateLearningScreen() {
            for (let i = 1; i <= 3; i++) {
                const card = document.querySelector(`[data-mission="s1m${i}"]`);
                if (state.missions.s1[i-1]) {
                    card.classList.remove('mission-incomplete');
                    card.classList.add('mission-complete');
                    card.querySelector('button').textContent = 'Completed ✓';
                    card.querySelector('button').disabled = true;
                }
            }
            
            for (let i = 1; i <= 3; i++) {
                const card = document.querySelector(`[data-mission="s2m${i}"]`);
                if (state.missions.s2[i-1]) {
                    card.classList.remove('mission-incomplete');
                    card.classList.add('mission-complete');
                    card.querySelector('button').textContent = 'Completed ✓';
                    card.querySelector('button').disabled = true;
                }
            }
            
            // Update field and pathway display
            const currentFieldElement = document.getElementById('currentField');
            const currentPathwayElement = document.getElementById('currentPathway');
            
            if (currentFieldElement) {
                if (state.profile.field) {
                    currentFieldElement.textContent = (window.fieldsData || fieldsData)[state.profile.field].name;
                } else {
                    currentFieldElement.textContent = 'Not Selected';
                }
            }
            
            if (currentPathwayElement) {
                if (state.pathway) {
                    currentPathwayElement.textContent = state.pathway;
                } else {
                    currentPathwayElement.textContent = 'Not Selected';
                }
            }
            
            // Update quiz status and suitable field
            const quizStatusElement = document.getElementById('quizStatus');
            const suitableFieldElement = document.getElementById('suitableField');
            const careerQuizButton = document.getElementById('careerQuizButton');
            
            if (quizStatusElement && suitableFieldElement && careerQuizButton) {
                if (state.careerQuiz.taken && state.careerQuiz.result) {
                    quizStatusElement.textContent = 'Completed';
                    suitableFieldElement.textContent = (window.fieldsData || fieldsData)[state.careerQuiz.result].name;
                    careerQuizButton.textContent = 'Retake Quiz';
                } else {
                    quizStatusElement.textContent = 'Not Taken';
                    suitableFieldElement.textContent = '(based on quiz result)';
                    careerQuizButton.textContent = 'Take Quiz';
                }
            }
            
            // Update goals and CV status display
            const currentEducationElement = document.getElementById('currentEducationTarget');
            const currentTimeHorizonElement = document.getElementById('currentTimeHorizon');
            const currentCVStatusElement = document.getElementById('currentCVStatus');
            
            if (currentEducationElement) {
                if (state.goals.academic) {
                    currentEducationElement.textContent = state.goals.academic;
                } else {
                    currentEducationElement.textContent = 'Not Selected';
                }
            }
            
            if (currentTimeHorizonElement) {
                if (state.goals.horizon) {
                    currentTimeHorizonElement.textContent = `${state.goals.horizon} Years`;
                } else {
                    currentTimeHorizonElement.textContent = 'Not Selected';
                }
            }
            
            if (currentCVStatusElement) {
                if (state.missions.cvBuilt) {
                    currentCVStatusElement.textContent = 'Generated';
                } else {
                    currentCVStatusElement.textContent = 'Not Generated';
                }
            }
            
            updateLearningProgress();
            updateBadges();
            updatePathwayTimeline();
            updateHamburgerLocks();
            updateFooterLocks();
        }

        function updateLearningProgress() {
            let completedMissions = 0;
            completedMissions += state.missions.s1.filter(m => m).length;
            completedMissions += state.missions.s2.filter(m => m).length;
            
            let totalMarks = 0;
            totalMarks += state.missions.s1.filter(m => m).length * 10;
            totalMarks += state.missions.s2.filter(m => m).length * 10;
            if (state.missions.explorerCompleted) totalMarks += 10;
            if (state.missions.fieldSelected) totalMarks += 5;
            if (state.missions.pathwaySelected) totalMarks += 5;
            if (state.missions.goalsSaved) totalMarks += 15;
            if (state.missions.cvBuilt) totalMarks += 25;
            
            let badges = 0;
            if (state.missions.s1.every(m => m)) badges++;
            if (state.missions.s2.every(m => m)) badges++;
            if (state.missions.goalsSaved && state.missions.cvBuilt) badges++;
            if (state.missions.explorerCompleted) badges++;
            
            let totalTasks = 11;
            let completedTasks = completedMissions;
            if (state.missions.explorerCompleted) completedTasks++;
            if (state.missions.fieldSelected) completedTasks++;
            if (state.missions.pathwaySelected) completedTasks++;
            if (state.missions.goalsSaved) completedTasks++;
            if (state.missions.cvBuilt) completedTasks++;
            
            const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
            
            document.getElementById('learningProgress').textContent = `${progressPercentage}%`;
            document.getElementById('learningMarks').textContent = totalMarks;
            document.getElementById('learningMissions').textContent = `${completedMissions}/6`;
            document.getElementById('learningBadges').textContent = `${badges}/4`;
            document.getElementById('progressBar').style.width = `${progressPercentage}%`;
        }

        function updateBadges() {
            const beginnerBadge = document.getElementById('beginnerBadge');
            const intermediateBadge = document.getElementById('intermediateBadge');
            const advancedBadge = document.getElementById('advancedBadge');
            
            if (state.missions.s1.every(m => m)) {
                beginnerBadge.classList.remove('badge-locked');
                beginnerBadge.classList.add('badge-earned', 'badge-glow');
            }
            
            if (state.missions.s2.every(m => m)) {
                intermediateBadge.classList.remove('badge-locked');
                intermediateBadge.classList.add('badge-earned', 'badge-glow');
            }
            
            if (state.missions.goalsSaved && state.missions.cvBuilt) {
                advancedBadge.classList.remove('badge-locked');
                advancedBadge.classList.add('badge-earned', 'badge-glow');
            }
        }

        function startMission(section, mission) {
            const modal = document.getElementById('missionModal');
            const title = document.getElementById('missionTitle');
            
            const questions = missionQuestions[section][mission];
            const missionNames = {
                s1: ['Discover & Innovate', 'Design & Connect', 'Define & Lead'],
                s2: ['Academic Path', 'Career Path', 'Entrepreneurship']
            };
            
            const missionTypes = {
                s1: 'Principle',
                s2: 'Inspire'
            };
            
            title.textContent = `${missionTypes[section]} ${mission}: ${missionNames[section][mission-1]}`;
            
            currentQuiz = {
                questions: questions,
                currentIndex: 0,
                answers: new Array(questions.length).fill(null),
                section: section,
                mission: mission
            };
            
            document.getElementById('missionContent').classList.remove('hidden');
            document.getElementById('quizResult').classList.add('hidden');
            document.getElementById('quizNavigation').classList.remove('hidden');
            
            displayCurrentQuestion();
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function displayCurrentQuestion() {
            const content = document.getElementById('missionContent');
            const question = currentQuiz.questions[currentQuiz.currentIndex];
            const questionNum = currentQuiz.currentIndex + 1;
            const totalQuestions = currentQuiz.questions.length;
            const progressPercentage = (questionNum / totalQuestions) * 100;
            
            content.innerHTML = `
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-600">Question ${questionNum} of ${totalQuestions}</span>
                        <span class="text-sm font-medium text-blue-600">${Math.round(progressPercentage)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="p-6 border rounded-lg bg-gray-50">
                    <h4 class="font-medium mb-4 text-lg">${questionNum}. ${question.question}</h4>
                    <div class="space-y-3">
                        ${question.options.map((option, optIndex) => `
                            <label class="flex items-center p-3 hover:bg-gray-100 rounded cursor-pointer border transition-colors ${currentQuiz.answers[currentQuiz.currentIndex] === optIndex ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}">
                                <input type="radio" name="currentQuestion" value="${optIndex}" class="mr-3" ${currentQuiz.answers[currentQuiz.currentIndex] === optIndex ? 'checked' : ''} onchange="selectAnswer(${optIndex})">
                                <span class="text-gray-800">${option}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
            
            updateNavigationButtons();
        }

        function selectAnswer(optionIndex) {
            currentQuiz.answers[currentQuiz.currentIndex] = optionIndex;
            updateNavigationButtons();
        }

        function updateNavigationButtons() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            prevBtn.disabled = currentQuiz.currentIndex === 0;
            
            const hasAnswer = currentQuiz.answers[currentQuiz.currentIndex] !== null;
            nextBtn.disabled = !hasAnswer;
            
            if (currentQuiz.currentIndex === currentQuiz.questions.length - 1) {
                nextBtn.textContent = hasAnswer ? 'Submit Quiz' : 'Submit Quiz';
                nextBtn.onclick = hasAnswer ? submitQuiz : null;
            } else {
                nextBtn.textContent = 'Next';
                nextBtn.onclick = nextQuestion;
            }
        }

        function previousQuestion() {
            if (currentQuiz.currentIndex > 0) {
                currentQuiz.currentIndex--;
                displayCurrentQuestion();
            }
        }

        function nextQuestion() {
            if (currentQuiz.currentIndex < currentQuiz.questions.length - 1) {
                currentQuiz.currentIndex++;
                displayCurrentQuestion();
            }
        }

        function submitQuiz() {
            let correctAnswers = 0;
            currentQuiz.questions.forEach((question, index) => {
                if (currentQuiz.answers[index] === question.correct) {
                    correctAnswers++;
                }
            });
            
            const percentage = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
            const passed = percentage >= 80;
            
            document.getElementById('missionContent').classList.add('hidden');
            document.getElementById('quizNavigation').classList.add('hidden');
            
            const resultDiv = document.getElementById('quizResult');
            const resultIcon = document.getElementById('resultIcon');
            const resultTitle = document.getElementById('resultTitle');
            const finalScore = document.getElementById('finalScore');
            const resultButtons = document.getElementById('resultButtons');
            
            if (passed) {
                resultIcon.textContent = '🎉';
                resultTitle.textContent = 'Congratulations!';
                resultTitle.className = 'text-2xl font-bold mb-4 text-green-600';
                finalScore.textContent = `${percentage}% (${correctAnswers} out of ${currentQuiz.questions.length} correct)`;
                
                resultButtons.innerHTML = `
                    <button onclick="completeMissionSuccess()" class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold">Continue Journey</button>
                `;
            } else {
                resultIcon.textContent = '😢';
                resultTitle.textContent = 'Keep Trying!';
                resultTitle.className = 'text-2xl font-bold mb-4 text-red-600';
                finalScore.textContent = `${percentage}% (${correctAnswers} out of ${currentQuiz.questions.length} correct)`;
                
                resultButtons.innerHTML = `
                    <button onclick="retryQuiz()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">Try Again</button>
                    <button onclick="closeMission()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold">Back to Journey</button>
                `;
            }
            
            resultDiv.classList.remove('hidden');
        }

        function retryQuiz() {
            currentQuiz.currentIndex = 0;
            currentQuiz.answers = new Array(currentQuiz.questions.length).fill(null);
            
            document.getElementById('missionContent').classList.remove('hidden');
            document.getElementById('quizResult').classList.add('hidden');
            document.getElementById('quizNavigation').classList.remove('hidden');
            
            displayCurrentQuestion();
        }

        function completeMissionSuccess() {
            state.missions[currentQuiz.section][currentQuiz.mission - 1] = true;
            saveState();
            
            closeMission();
            updateLearningScreen();
            
            const missionTypes = {
                s1: 'Principle',
                s2: 'Inspire'
            };
            
            // Check if section is completed and show badge congratulation
            if (currentQuiz.section === 's1' && state.missions.s1.every(m => m)) {
                setTimeout(() => {
                    alert('Congratulations! You\'ve completed Section 1 and earned the Beginner Badge!');
                }, 500);
            } else if (currentQuiz.section === 's2' && state.missions.s2.every(m => m)) {
                setTimeout(() => {
                    alert('Amazing! You\'ve completed Section 2 and earned the Intermediate Badge!');
                }, 500);
            } else {
                alert(`${missionTypes[currentQuiz.section]} completed! +10 marks earned.`);
            }
        }

        function closeMission() {
            const modal = document.getElementById('missionModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            currentQuiz = {
                questions: [],
                currentIndex: 0,
                answers: [],
                section: '',
                mission: 0
            };
        }

        // Goals functions
        function loadGoalsPage() {
            document.getElementById('goalsAcademicTarget').addEventListener('change', updateGoalsPreview);
            
            // Load saved goals state
            if (state.goals.academic) {
                document.getElementById('goalsAcademicTarget').value = state.goals.academic;
                goalsPageState.selectedAcademic = state.goals.academic;
            }
            
            if (state.goals.horizon) {
                goalsPageState.selectedHorizon = state.goals.horizon;
                selectTimeHorizon(state.goals.horizon);
            }
            
            // Load custom goals state if exists
            if (state.goals.isCustom) {
                goalsPageState.isCustom = true;
                goalsPageState.customContent = state.goals.customContent || '';
                
                // Show custom preview if content exists
                if (goalsPageState.customContent) {
                    document.getElementById('customGoalsContent').textContent = goalsPageState.customContent;
                    document.getElementById('customGoalsPreview').classList.remove('hidden');
                    document.getElementById('saveGoalsBtn').disabled = false;
                }
            } else if (state.goals.isEdited && state.goals.editedGoals) {
                // Load edited goals state
                goalsPageState.isEditing = true;
                goalsPageState.editedGoals = state.goals.editedGoals;
                
                // Show edited preview
                if (state.goals.content) {
                    document.getElementById('goalsContent').innerHTML = state.goals.content;
                    document.getElementById('goalsPreview').classList.remove('hidden');
                    document.getElementById('saveGoalsBtn').disabled = false;
                }
            } else if (state.goals.academic && state.goals.horizon) {
                // Show pre-filled goals if they exist
                updateGoalsPreview();
            }
        }

        function selectTimeHorizon(years) {
            goalsPageState.selectedHorizon = years;
            
            document.getElementById('fiveYearCard').classList.remove('border-blue-500', 'bg-blue-50');
            document.getElementById('tenYearCard').classList.remove('border-blue-500', 'bg-blue-50');
            
            if (years === '5') {
                document.getElementById('fiveYearCard').classList.add('border-blue-500', 'bg-blue-50');
            } else {
                document.getElementById('tenYearCard').classList.add('border-blue-500', 'bg-blue-50');
            }
            
            updateGoalsPreview();
        }

        function updateGoalsPreview() {
            const academic = document.getElementById('goalsAcademicTarget').value;
            const horizon = goalsPageState.selectedHorizon;
            
            if (!academic || !horizon) {
                document.getElementById('goalsPreview').classList.add('hidden');
                document.getElementById('customGoalsSection').classList.add('hidden');
                document.getElementById('customGoalsPreview').classList.add('hidden');
                document.getElementById('saveGoalsBtn').disabled = true;
                return;
            }
            
            // If currently showing custom goals, don't override
            if (goalsPageState.isCustom) {
                return;
            }
            
            const fieldName = state.profile.field ? (window.fieldsData || fieldsData)[state.profile.field].name : 'selected field';
            const content = generateGoalsContent(academic, horizon, fieldName);
            
            document.getElementById('goalsContent').innerHTML = content;
            document.getElementById('goalsPreview').classList.remove('hidden');
            document.getElementById('customGoalsSection').classList.add('hidden');
            document.getElementById('customGoalsPreview').classList.add('hidden');
            document.getElementById('saveGoalsBtn').disabled = false;
        }

        function generateGoalsContent(academic, horizon, fieldName) {
            const pathway = state.pathway || 'Career';
            
            // Determine realistic academic completion for 5 years
            let fiveYearAcademic = academic;
            let pursueFurther = '';
            
            if (horizon === '5' && (academic === 'Master' || academic === 'PhD')) {
                fiveYearAcademic = 'Degree';
                pursueFurther = ` and pursue ${academic}`;
            }
            
            if (horizon === '5') {
                // 5-Year realistic targets based on field and pathway
                const pathwayVisions = {
                    'Academic': `To establish a strong foundation in ${fieldName} research and academic excellence, preparing for advanced studies and research contributions.`,
                    'Career': `To become a competent ${fieldName} professional with solid technical skills and industry experience, ready for career advancement.`,
                    'Entrepreneur': `To develop entrepreneurial skills in ${fieldName} and identify business opportunities, building towards launching innovative ventures.`
                };
                
                const pathwayMilestones = {
                    'Academic': [
                        'Complete TVET education with distinction (GPA 3.5+)',
                        'Engage in research projects and academic competitions',
                        'Secure research internships or assistant positions',
                        'Build relationships with academic mentors and professors'
                    ],
                    'Career': [
                        'Complete TVET education with excellent grades',
                        'Secure 2-3 meaningful industry internships',
                        'Obtain relevant professional certifications',
                        'Build professional network in the industry'
                    ],
                    'Entrepreneur': [
                        'Complete TVET education while exploring business opportunities',
                        'Develop business and financial literacy skills',
                        `Create and validate business ideas in ${fieldName}`,
                        'Build network of mentors and potential partners'
                    ]
                };
                
                const pathwayPositions = {
                    'Academic': `Research Assistant or Junior Academic in ${fieldName}`,
                    'Career': `Junior ${fieldName} Technician/Engineer`,
                    'Entrepreneur': `Founder/Co-founder of ${fieldName} startup or Junior Business Developer`
                };
                
                return `
                    <div class="space-y-4">
                        <h4 class="font-bold text-lg">My 5-Year Career Goals</h4>
                        <p><strong>Academic Target:</strong> Complete ${fiveYearAcademic} in ${fieldName}${pursueFurther}</p>
                        <p><strong>Career Vision:</strong> ${pathwayVisions[pathway]}</p>
                        <p><strong>Key Milestones:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            ${pathwayMilestones[pathway].map(milestone => `<li>${milestone}</li>`).join('')}
                        </ul>
                        <p><strong>Target Position:</strong> ${pathwayPositions[pathway]}</p>
                    </div>
                `;
            } else {
                // 10-Year extended vision with advanced goals
                const extendedVisions = {
                    'Academic': `To become a recognized expert and thought leader in ${fieldName}, contributing significantly to research, education, and industry advancement through innovative research and academic leadership.`,
                    'Career': `To advance as a senior ${fieldName} professional and industry leader, driving innovation, leading major projects, and shaping the future of the industry while mentoring the next generation.`,
                    'Entrepreneur': `To establish and scale successful ventures in ${fieldName}, creating innovative solutions that transform the industry while building a sustainable business ecosystem and inspiring other entrepreneurs.`
                };
                
                const extendedMilestones = {
                    'Academic': [
                        `Complete ${academic} with research contributions to ${fieldName}`,
                        'Publish research in academic journals and conferences',
                        'Secure research grants and lead research projects',
                        'Supervise graduate students and junior researchers',
                        'Contribute to industry standards and best practices',
                        `Build reputation as expert in specialized ${fieldName} areas`
                    ],
                    'Career': [
                        `Complete ${academic} and advanced professional certifications`,
                        'Lead major projects and manage cross-functional teams',
                        'Establish expertise in emerging technologies and trends',
                        'Mentor junior professionals and build high-performing teams',
                        'Participate in professional associations and industry boards',
                        'Lead innovation initiatives within the organization'
                    ],
                    'Entrepreneur': [
                        `Complete ${academic} while scaling business ventures`,
                        `Launch and successfully scale business in ${fieldName}`,
                        'Achieve significant market share and revenue milestones',
                        'Secure funding rounds and strategic partnerships',
                        'Create jobs and contribute to economic development',
                        'Build strong brand recognition and customer loyalty'
                    ]
                };
                
                const extendedPositions = {
                    'Academic': `Senior Professor/Research Director or Chief Technology Officer in ${fieldName}`,
                    'Career': `Senior ${fieldName} Director/VP or Chief Engineering Officer`,
                    'Entrepreneur': `Serial Entrepreneur/CEO or Venture Capitalist in ${fieldName} sector`
                };
                
                const leadershipGoals = {
                    'Academic': `Lead groundbreaking research initiatives, shape academic curriculum, and influence global research directions in ${fieldName}.`,
                    'Career': `Drive organizational transformation, lead industry innovation initiatives, and mentor the next generation of ${fieldName} professionals.`,
                    'Entrepreneur': `Build sustainable business ecosystems, create market-changing innovations, and inspire entrepreneurial culture in ${fieldName} industry.`
                };
                
                return `
                    <div class="space-y-4">
                        <h4 class="font-bold text-lg">My 10-Year Career Goals</h4>
                        <p><strong>Academic Target:</strong> Complete ${academic} in ${fieldName}</p>
                        <p><strong>Career Vision:</strong> ${extendedVisions[pathway]}</p>
                        <p><strong>Key Milestones:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            ${extendedMilestones[pathway].map(milestone => `<li>${milestone}</li>`).join('')}
                        </ul>
                        <p><strong>Target Position:</strong> ${extendedPositions[pathway]}</p>
                        <p><strong>Leadership Goals:</strong> ${leadershipGoals[pathway]}</p>
                    </div>
                `;
            }
        }

        function clearAndCustomizeGoals() {
            goalsPageState.isCustom = true;
            
            // Hide pre-filled preview and show custom section
            document.getElementById('goalsPreview').classList.add('hidden');
            document.getElementById('customGoalsSection').classList.remove('hidden');
            document.getElementById('customGoalsPreview').classList.add('hidden');
            
            // Load existing custom content if available
            if (goalsPageState.customContent) {
                document.getElementById('customGoalsTextarea').value = goalsPageState.customContent;
            }
            
            // Update save button state
            document.getElementById('saveGoalsBtn').disabled = false;
        }

        function usePrefilledGoals() {
            goalsPageState.isCustom = false;
            
            // Show pre-filled preview and hide custom sections
            document.getElementById('goalsPreview').classList.remove('hidden');
            document.getElementById('customGoalsSection').classList.add('hidden');
            document.getElementById('customGoalsPreview').classList.add('hidden');
            
            // Regenerate pre-filled content
            updateGoalsPreview();
        }

        function previewCustomGoals() {
            const customText = document.getElementById('customGoalsTextarea').value.trim();
            
            if (!customText) {
                alert('Please write your goals first before previewing.');
                return;
            }
            
            // Save custom content
            goalsPageState.customContent = customText;
            
            // Show preview
            document.getElementById('customGoalsContent').textContent = customText;
            document.getElementById('customGoalsSection').classList.add('hidden');
            document.getElementById('customGoalsPreview').classList.remove('hidden');
            
            // Enable save button
            document.getElementById('saveGoalsBtn').disabled = false;
        }

        function editCustomGoals() {
            // Return to custom editing mode
            document.getElementById('customGoalsSection').classList.remove('hidden');
            document.getElementById('customGoalsPreview').classList.add('hidden');
        }

        function editPrefilledGoals() {
            goalsPageState.isEditing = true;
            
            // Parse current goals content to populate edit fields
            const academic = document.getElementById('goalsAcademicTarget').value;
            const horizon = goalsPageState.selectedHorizon;
            const fieldName = state.profile.field ? (window.fieldsData || fieldsData)[state.profile.field].name : 'selected field';
            const pathway = state.pathway || 'Career';
            
            // Generate default content to parse
            const defaultContent = generateGoalsContentForEditing(academic, horizon, fieldName, pathway);
            
            // Populate edit fields with default or saved edited content
            document.getElementById('editCareerVision').value = goalsPageState.editedGoals.careerVision || defaultContent.careerVision;
            document.getElementById('editKeyMilestones').value = goalsPageState.editedGoals.keyMilestones || defaultContent.keyMilestones;
            document.getElementById('editTargetPosition').value = goalsPageState.editedGoals.targetPosition || defaultContent.targetPosition;
            
            // Show leadership goals field only for 10-year horizon
            const leadershipDiv = document.getElementById('editLeadershipGoalsDiv');
            if (horizon === '10') {
                leadershipDiv.classList.remove('hidden');
                document.getElementById('editLeadershipGoals').value = goalsPageState.editedGoals.leadershipGoals || defaultContent.leadershipGoals;
            } else {
                leadershipDiv.classList.add('hidden');
            }
            
            // Show edit section and hide preview
            document.getElementById('goalsPreview').classList.add('hidden');
            document.getElementById('editGoalsSection').classList.remove('hidden');
            document.getElementById('customGoalsSection').classList.add('hidden');
            document.getElementById('customGoalsPreview').classList.add('hidden');
        }

        function generateGoalsContentForEditing(academic, horizon, fieldName, pathway) {
            // Generate default content structure for editing
            let fiveYearAcademic = academic;
            let pursueFurther = '';
            
            if (horizon === '5' && (academic === 'Master' || academic === 'PhD')) {
                fiveYearAcademic = 'Degree';
                pursueFurther = ` and pursue ${academic}`;
            }
            
            if (horizon === '5') {
                const pathwayVisions = {
                    'Academic': `To establish a strong foundation in ${fieldName} research and academic excellence, preparing for advanced studies and research contributions.`,
                    'Career': `To become a competent ${fieldName} professional with solid technical skills and industry experience, ready for career advancement.`,
                    'Entrepreneur': `To develop entrepreneurial skills in ${fieldName} and identify business opportunities, building towards launching innovative ventures.`
                };
                
                const pathwayMilestones = {
                    'Academic': [
                        'Complete TVET education with distinction (GPA 3.5+)',
                        'Engage in research projects and academic competitions',
                        'Secure research internships or assistant positions',
                        'Build relationships with academic mentors and professors'
                    ],
                    'Career': [
                        'Complete TVET education with excellent grades',
                        'Secure 2-3 meaningful industry internships',
                        'Obtain relevant professional certifications',
                        'Build professional network in the industry'
                    ],
                    'Entrepreneur': [
                        'Complete TVET education while exploring business opportunities',
                        'Develop business and financial literacy skills',
                        `Create and validate business ideas in ${fieldName}`,
                        'Build network of mentors and potential partners'
                    ]
                };
                
                const pathwayPositions = {
                    'Academic': `Research Assistant or Junior Academic in ${fieldName}`,
                    'Career': `Junior ${fieldName} Technician/Engineer`,
                    'Entrepreneur': `Founder/Co-founder of ${fieldName} startup or Junior Business Developer`
                };
                
                return {
                    careerVision: pathwayVisions[pathway],
                    keyMilestones: pathwayMilestones[pathway].join('\n'),
                    targetPosition: pathwayPositions[pathway],
                    leadershipGoals: ''
                };
            } else {
                const extendedVisions = {
                    'Academic': `To become a recognized expert and thought leader in ${fieldName}, contributing significantly to research, education, and industry advancement through innovative research and academic leadership.`,
                    'Career': `To advance as a senior ${fieldName} professional and industry leader, driving innovation, leading major projects, and shaping the future of the industry while mentoring the next generation.`,
                    'Entrepreneur': `To establish and scale successful ventures in ${fieldName}, creating innovative solutions that transform the industry while building a sustainable business ecosystem and inspiring other entrepreneurs.`
                };
                
                const extendedMilestones = {
                    'Academic': [
                        `Complete ${academic} with research contributions to ${fieldName}`,
                        'Publish research in academic journals and conferences',
                        'Secure research grants and lead research projects',
                        'Supervise graduate students and junior researchers',
                        'Contribute to industry standards and best practices',
                        `Build reputation as expert in specialized ${fieldName} areas`
                    ],
                    'Career': [
                        `Complete ${academic} and advanced professional certifications`,
                        'Lead major projects and manage cross-functional teams',
                        'Establish expertise in emerging technologies and trends',
                        'Mentor junior professionals and build high-performing teams',
                        'Participate in professional associations and industry boards',
                        'Lead innovation initiatives within the organization'
                    ],
                    'Entrepreneur': [
                        `Complete ${academic} while scaling business ventures`,
                        `Launch and successfully scale business in ${fieldName}`,
                        'Achieve significant market share and revenue milestones',
                        'Secure funding rounds and strategic partnerships',
                        'Create jobs and contribute to economic development',
                        'Build strong brand recognition and customer loyalty'
                    ]
                };
                
                const extendedPositions = {
                    'Academic': `Senior Professor/Research Director or Chief Technology Officer in ${fieldName}`,
                    'Career': `Senior ${fieldName} Director/VP or Chief Engineering Officer`,
                    'Entrepreneur': `Serial Entrepreneur/CEO or Venture Capitalist in ${fieldName} sector`
                };
                
                const leadershipGoals = {
                    'Academic': `Lead groundbreaking research initiatives, shape academic curriculum, and influence global research directions in ${fieldName}.`,
                    'Career': `Drive organizational transformation, lead industry innovation initiatives, and mentor the next generation of ${fieldName} professionals.`,
                    'Entrepreneur': `Build sustainable business ecosystems, create market-changing innovations, and inspire entrepreneurial culture in ${fieldName} industry.`
                };
                
                return {
                    careerVision: extendedVisions[pathway],
                    keyMilestones: extendedMilestones[pathway].join('\n'),
                    targetPosition: extendedPositions[pathway],
                    leadershipGoals: leadershipGoals[pathway]
                };
            }
        }

        function previewEditedGoals() {
            // Save edited content
            goalsPageState.editedGoals = {
                careerVision: document.getElementById('editCareerVision').value.trim(),
                keyMilestones: document.getElementById('editKeyMilestones').value.trim(),
                targetPosition: document.getElementById('editTargetPosition').value.trim(),
                leadershipGoals: document.getElementById('editLeadershipGoals').value.trim()
            };
            
            // Validate required fields
            if (!goalsPageState.editedGoals.careerVision || !goalsPageState.editedGoals.keyMilestones || !goalsPageState.editedGoals.targetPosition) {
                alert('Please fill in all required fields (Career Vision, Key Milestones, and Target Position).');
                return;
            }
            
            // Generate preview content
            const academic = document.getElementById('goalsAcademicTarget').value;
            const horizon = goalsPageState.selectedHorizon;
            const fieldName = state.profile.field ? (window.fieldsData || fieldsData)[state.profile.field].name : 'selected field';
            
            let content = `
                <div class="space-y-4">
                    <h4 class="font-bold text-lg">My ${horizon}-Year Career Goals</h4>
                    <p><strong>Academic Target:</strong> Complete ${academic} in ${fieldName}</p>
                    <p><strong>Career Vision:</strong> ${goalsPageState.editedGoals.careerVision}</p>
                    <p><strong>Key Milestones:</strong></p>
                    <ul class="list-disc list-inside ml-4 space-y-1">
                        ${goalsPageState.editedGoals.keyMilestones.split('\n').filter(m => m.trim()).map(milestone => `<li>${milestone.trim()}</li>`).join('')}
                    </ul>
                    <p><strong>Target Position:</strong> ${goalsPageState.editedGoals.targetPosition}</p>
                    ${horizon === '10' && goalsPageState.editedGoals.leadershipGoals ? `<p><strong>Leadership Goals:</strong> ${goalsPageState.editedGoals.leadershipGoals}</p>` : ''}
                </div>
            `;
            
            // Update preview content
            document.getElementById('goalsContent').innerHTML = content;
            
            // Show preview and hide edit section
            document.getElementById('editGoalsSection').classList.add('hidden');
            document.getElementById('goalsPreview').classList.remove('hidden');
            document.getElementById('saveGoalsBtn').disabled = false;
        }

        function cancelEditGoals() {
            // Reset editing state
            goalsPageState.isEditing = false;
            
            // Show original preview
            document.getElementById('editGoalsSection').classList.add('hidden');
            document.getElementById('goalsPreview').classList.remove('hidden');
        }

        function saveGoals() {
            const academic = document.getElementById('goalsAcademicTarget').value;
            const horizon = goalsPageState.selectedHorizon;
            
            let content, isCustom, isEdited = false;
            
            if (goalsPageState.isCustom) {
                // Save custom goals
                content = goalsPageState.customContent || document.getElementById('customGoalsTextarea').value.trim();
                isCustom = true;
                
                if (!content) {
                    alert('Please write your custom goals before saving.');
                    return;
                }
            } else if (goalsPageState.isEditing && goalsPageState.editedGoals.careerVision) {
                // Save edited pre-filled goals
                content = document.getElementById('goalsContent').innerHTML;
                isCustom = false;
                isEdited = true;
            } else {
                // Save original pre-filled goals
                content = document.getElementById('goalsContent').innerHTML;
                isCustom = false;
            }
            
            state.goals = { 
                academic, 
                horizon, 
                content, 
                isCustom,
                customContent: isCustom ? content : '',
                isEdited,
                editedGoals: isEdited ? goalsPageState.editedGoals : {}
            };
            state.missions.goalsSaved = true;
            
            saveState();
            
            // Check if both goals and CV are completed for advanced badge
            if (state.missions.cvBuilt) {
                alert('Outstanding! You\'ve completed Section 3 and earned the Advanced Badge!');
            } else {
                alert('Goals saved successfully! +15 marks earned.');
            }
            
            updateLearningScreen();
            showScreen('learning');
        }

        // CV Builder functions
        function loadCVBuilderPage() {
            document.getElementById('cvFullName').value = state.profile.name || '';
            document.getElementById('cvEmail').value = state.profile.email || '';
            
            // Load profile picture from main profile
            if (state.profile.profilePicture) {
                const preview = document.getElementById('profilePicturePreview');
                preview.innerHTML = `<img src="${state.profile.profilePicture}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
                
                // Also save to CV state for consistency
                if (!state.cv) state.cv = {};
                state.cv.profilePicture = state.profile.profilePicture;
            }
            
            // Generate professional summary aligned with goals
            if (!document.getElementById('cvSummary').value) {
                const summary = generateProfessionalSummary();
                document.getElementById('cvSummary').value = summary;
            }
            
            // Load existing education and experience entries
            loadEducationEntries();
            loadExperienceEntries();
            
            // Populate skills based on field and pathway
            populateSkillsOptions();
            
            // Load saved selections
            loadSavedSelections();
        }

        function handleProfilePictureUpload(input) {
            const file = input.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert('File size should be less than 2MB');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('profilePicturePreview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
                    
                    // Save to both profile and CV state for consistency
                    state.profile.profilePicture = e.target.result;
                    if (!state.cv) state.cv = {};
                    state.cv.profilePicture = e.target.result;
                    saveState();
                };
                reader.readAsDataURL(file);
            }
        }

        function populateSkillsOptions() {
            const fieldKey = state.profile.field;
            const pathway = state.pathway;
            
            // Technical Skills based on field
            const technicalContainer = document.getElementById('technicalSkillsOptions');
            if (fieldKey && (window.fieldsData || fieldsData)[fieldKey]) {
                const fieldSkills = (window.fieldsData || fieldsData)[fieldKey].skills;
                const additionalTechSkills = getAdditionalTechnicalSkills(fieldKey);
                
                // Remove duplicates by creating a Set and converting back to array
                const allTechSkills = [...new Set([...fieldSkills, ...additionalTechSkills])];
                
                technicalContainer.innerHTML = allTechSkills.map(skill => `
                    <label class="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" class="mr-2 technical-skill-option" value="${skill}"> ${skill}
                    </label>
                `).join('');
            }
            
            // Soft Skills based on pathway
            const softContainer = document.getElementById('softSkillsOptions');
            const softSkills = getSoftSkillsByPathway(pathway);
            
            // Remove duplicates from soft skills
            const uniqueSoftSkills = [...new Set(softSkills)];
            
            softContainer.innerHTML = uniqueSoftSkills.map(skill => `
                <label class="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" class="mr-2 soft-skill-option" value="${skill}"> ${skill}
                </label>
            `).join('');
            
            // Add event listeners for skill selection
            addSkillEventListeners();
        }

        function getAdditionalTechnicalSkills(fieldKey) {
            const additionalSkills = {
                'electrical': ['MATLAB', 'SCADA Systems', 'Power Analysis', 'Circuit Simulation'],
                'electronics': ['Arduino Programming', 'Raspberry Pi', 'FPGA Programming', 'Signal Processing'],
                'oil-gas': ['Process Simulation', 'HAZOP Analysis', 'Pipeline Design', 'Reservoir Engineering'],
                'biotech': ['Laboratory Techniques', 'Data Analysis', 'Research Methodology', 'Quality Assurance'],
                'civil': ['Structural Analysis', 'Surveying', 'Project Planning', 'Building Codes'],
                'manufacturing': ['Lean Manufacturing', 'Six Sigma', 'Production Planning', 'Quality Control'],
                'arts': ['Adobe Creative Suite', 'Video Editing', 'Web Design', 'Brand Strategy'],
                'built-env': ['Sustainable Design', 'Energy Modeling', 'Green Building Standards', 'Urban Planning'],
                'materials': ['Material Testing', 'Process Control', 'Statistical Analysis', 'Research & Development'],
                'automotive': ['Vehicle Diagnostics', 'CAD Design', 'Engine Technology', 'Automotive Electronics'],
                'biomedical': ['Medical Device Design', 'Regulatory Compliance', 'Clinical Research', 'Healthcare Technology']
            };
            
            return additionalSkills[fieldKey] || [];
        }

        function getSoftSkillsByPathway(pathway) {
            const pathwaySkills = {
                'Academic': ['Research Skills', 'Critical Thinking', 'Academic Writing', 'Data Analysis', 'Presentation Skills', 'Time Management'],
                'Career': ['Leadership', 'Project Management', 'Team Collaboration', 'Problem Solving', 'Communication', 'Adaptability'],
                'Entrepreneur': ['Innovation', 'Risk Management', 'Business Planning', 'Networking', 'Strategic Thinking', 'Financial Literacy']
            };
            
            const commonSoftSkills = ['Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Time Management', 'Adaptability'];
            
            return pathway ? [...(pathwaySkills[pathway] || []), ...commonSoftSkills] : commonSoftSkills;
        }

        function addSkillEventListeners() {
            // Technical skills
            document.querySelectorAll('.technical-skill-option').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedSkills('technical');
                });
            });
            
            // Soft skills
            document.querySelectorAll('.soft-skill-option').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedSkills('soft');
                });
            });
            
            // Languages
            document.querySelectorAll('.language-option').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedSkills('language');
                });
            });
            
            // Achievements
            document.querySelectorAll('.achievement-option').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedSkills('achievement');
                });
            });
            
            // Extracurriculars
            document.querySelectorAll('.extracurricular-option').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedSkills('extracurricular');
                });
            });
        }

        function updateSelectedSkills(type) {
            const containers = {
                'technical': 'selectedTechnicalSkills',
                'soft': 'selectedSoftSkills',
                'language': 'selectedLanguages',
                'achievement': 'selectedAchievements',
                'extracurricular': 'selectedExtracurriculars'
            };
            
            const selectors = {
                'technical': '.technical-skill-option:checked',
                'soft': '.soft-skill-option:checked',
                'language': '.language-option:checked',
                'achievement': '.achievement-option:checked',
                'extracurricular': '.extracurricular-option:checked'
            };
            
            const container = document.getElementById(containers[type]);
            const selectedItems = Array.from(document.querySelectorAll(selectors[type])).map(cb => cb.value);
            
            // Add custom items from state
            const customKey = `custom${type.charAt(0).toUpperCase() + type.slice(1)}s`;
            if (state.cv && state.cv[customKey]) {
                selectedItems.push(...state.cv[customKey]);
            }
            
            container.innerHTML = selectedItems.map(item => `
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    ${item}
                    <button type="button" onclick="removeSelectedItem('${type}', '${item}')" class="ml-2 text-blue-600 hover:text-blue-800">×</button>
                </span>
            `).join('');
            
            // Save to state
            if (!state.cv) state.cv = {};
            state.cv[`selected${type.charAt(0).toUpperCase() + type.slice(1)}s`] = selectedItems;
            saveState();
        }

        function addCustomSkill(type) {
            const inputs = {
                'technical': 'customTechnicalSkill',
                'soft': 'customSoftSkill',
                'language': 'customLanguage',
                'achievement': 'customAchievement',
                'extracurricular': 'customExtracurricular'
            };
            
            const input = document.getElementById(inputs[type]);
            const value = input.value.trim();
            
            if (!value) return;
            
            // Add to custom items in state
            if (!state.cv) state.cv = {};
            const customKey = `custom${type.charAt(0).toUpperCase() + type.slice(1)}s`;
            if (!state.cv[customKey]) state.cv[customKey] = [];
            
            if (!state.cv[customKey].includes(value)) {
                state.cv[customKey].push(value);
                saveState();
                
                // Update display
                updateSelectedSkills(type);
                
                // Clear input
                input.value = '';
            }
        }

        function removeSelectedItem(type, item) {
            // Remove from checkboxes
            const checkbox = document.querySelector(`input[value="${item}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
            
            // Remove from custom items
            if (state.cv) {
                const customKey = `custom${type.charAt(0).toUpperCase() + type.slice(1)}s`;
                if (state.cv[customKey]) {
                    state.cv[customKey] = state.cv[customKey].filter(i => i !== item);
                    saveState();
                }
            }
            
            // Update display
            updateSelectedSkills(type);
        }

        function loadSavedSelections() {
            if (!state.cv) return;
            
            // Load profile picture
            if (state.cv.profilePicture) {
                const preview = document.getElementById('profilePicturePreview');
                preview.innerHTML = `<img src="${state.cv.profilePicture}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
            }
            
            // Load selected skills
            ['technical', 'soft', 'language', 'achievement', 'extracurricular'].forEach(type => {
                const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
                if (state.cv[selectedKey]) {
                    state.cv[selectedKey].forEach(item => {
                        const checkbox = document.querySelector(`input[value="${item}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                    updateSelectedSkills(type);
                }
            });
        }

        function addEducationEntry() {
            const container = document.getElementById('educationEntries');
            const entryId = 'education_' + Date.now();
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
            entryDiv.id = entryId;
            
            entryDiv.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-semibold text-gray-700">Education Entry</h4>
                    <button type="button" onclick="removeEducationEntry('${entryId}')" class="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Institution</label>
                        <input type="text" class="w-full p-2 border rounded education-institution" placeholder="e.g., KKTM Pasir Mas">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Degree/Program</label>
                        <input type="text" class="w-full p-2 border rounded education-degree" placeholder="e.g., Diploma in Electrical Engineering">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Start Year</label>
                        <input type="number" class="w-full p-2 border rounded education-start" placeholder="e.g., 2020" min="1990" max="2030">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">End Year</label>
                        <input type="number" class="w-full p-2 border rounded education-end" placeholder="e.g., 2023" min="1990" max="2035">
                    </div>
                </div>
            `;
            
            container.appendChild(entryDiv);
        }

        function removeEducationEntry(entryId) {
            const entry = document.getElementById(entryId);
            if (entry) {
                entry.remove();
            }
        }

        function addExperienceEntry() {
            const container = document.getElementById('experienceEntries');
            const entryId = 'experience_' + Date.now();
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
            entryDiv.id = entryId;
            
            entryDiv.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-semibold text-gray-700">Experience Entry</h4>
                    <button type="button" onclick="removeExperienceEntry('${entryId}')" class="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                </div>
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Company/Organization</label>
                        <input type="text" class="w-full p-2 border rounded experience-company" placeholder="e.g., Petronas">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Position/Role</label>
                        <input type="text" class="w-full p-2 border rounded experience-position" placeholder="e.g., Junior Engineer">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Start Date</label>
                        <input type="month" class="w-full p-2 border rounded experience-start">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">End Date</label>
                        <input type="month" class="w-full p-2 border rounded experience-end">
                        <div class="mt-1">
                            <label class="flex items-center text-sm">
                                <input type="checkbox" class="mr-2 experience-current" onchange="toggleCurrentJob(this)">
                                Currently working here
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea class="w-full p-2 border rounded h-20 experience-description" placeholder="Describe your responsibilities and achievements..."></textarea>
                </div>
            `;
            
            container.appendChild(entryDiv);
        }

        function removeExperienceEntry(entryId) {
            const entry = document.getElementById(entryId);
            if (entry) {
                entry.remove();
            }
        }

        function toggleCurrentJob(checkbox) {
            const endDateInput = checkbox.closest('.grid').querySelector('.experience-end');
            if (checkbox.checked) {
                endDateInput.disabled = true;
                endDateInput.value = '';
                endDateInput.placeholder = 'Present';
            } else {
                endDateInput.disabled = false;
                endDateInput.placeholder = '';
            }
        }

        function loadEducationEntries() {
            // Load saved education entries if they exist
            if (state.cv && state.cv.educationEntries) {
                state.cv.educationEntries.forEach(entry => {
                    addEducationEntry();
                    const entries = document.querySelectorAll('#educationEntries > div');
                    const lastEntry = entries[entries.length - 1];
                    
                    lastEntry.querySelector('.education-institution').value = entry.institution || '';
                    lastEntry.querySelector('.education-degree').value = entry.degree || '';
                    lastEntry.querySelector('.education-start').value = entry.startYear || '';
                    lastEntry.querySelector('.education-end').value = entry.endYear || '';
                });
            }
        }

        function loadExperienceEntries() {
            // Load saved experience entries if they exist
            if (state.cv && state.cv.experienceEntries) {
                state.cv.experienceEntries.forEach(entry => {
                    addExperienceEntry();
                    const entries = document.querySelectorAll('#experienceEntries > div');
                    const lastEntry = entries[entries.length - 1];
                    
                    lastEntry.querySelector('.experience-company').value = entry.company || '';
                    lastEntry.querySelector('.experience-position').value = entry.position || '';
                    lastEntry.querySelector('.experience-start').value = entry.startDate || '';
                    lastEntry.querySelector('.experience-end').value = entry.endDate || '';
                    lastEntry.querySelector('.experience-description').value = entry.description || '';
                    
                    if (entry.isCurrent) {
                        const currentCheckbox = lastEntry.querySelector('.experience-current');
                        currentCheckbox.checked = true;
                        toggleCurrentJob(currentCheckbox);
                    }
                });
            }
        }

        function collectEducationData() {
            const entries = [];
            document.querySelectorAll('#educationEntries > div').forEach(entry => {
                const institution = entry.querySelector('.education-institution').value.trim();
                const degree = entry.querySelector('.education-degree').value.trim();
                const startYear = entry.querySelector('.education-start').value.trim();
                const endYear = entry.querySelector('.education-end').value.trim();
                
                if (institution || degree || startYear || endYear) {
                    entries.push({
                        institution,
                        degree,
                        startYear,
                        endYear
                    });
                }
            });
            return entries;
        }

        function collectExperienceData() {
            const entries = [];
            document.querySelectorAll('#experienceEntries > div').forEach(entry => {
                const company = entry.querySelector('.experience-company').value.trim();
                const position = entry.querySelector('.experience-position').value.trim();
                const startDate = entry.querySelector('.experience-start').value.trim();
                const endDate = entry.querySelector('.experience-end').value.trim();
                const description = entry.querySelector('.experience-description').value.trim();
                const isCurrent = entry.querySelector('.experience-current').checked;
                
                if (company || position || startDate || endDate || description) {
                    entries.push({
                        company,
                        position,
                        startDate,
                        endDate: isCurrent ? 'Present' : endDate,
                        description,
                        isCurrent
                    });
                }
            });
            return entries;
        }

        function generateProfessionalSummary() {
            const fieldName = state.profile.field ? (window.fieldsData || fieldsData)[state.profile.field].name : 'Technology';
            const pathway = state.pathway || 'Career';
            const academic = state.goals.academic || 'Degree';
            const horizon = state.goals.horizon || '5';
            
            // Base summary components
            let experience = '';
            let expertise = '';
            let achievements = '';
            let vision = '';
            
            // Generate experience level based on horizon
            if (horizon === '5') {
                experience = `Experienced ${fieldName} professional with 3-5 years of hands-on experience`;
                expertise = `Strong technical foundation and practical skills`;
            } else {
                experience = `Senior ${fieldName} professional with 8-10 years of comprehensive experience`;
                expertise = `Deep technical expertise and proven leadership capabilities`;
            }
            
            // Generate pathway-specific content
            if (pathway === 'Academic') {
                achievements = `Published researcher with ${academic} in ${fieldName}`;
                if (horizon === '5') {
                    vision = `Seeking to contribute to cutting-edge research and academic excellence while building a foundation for advanced studies`;
                } else {
                    vision = `Committed to advancing ${fieldName} knowledge through innovative research, mentoring future professionals, and shaping industry standards`;
                }
            } else if (pathway === 'Career') {
                achievements = `Certified ${fieldName} specialist with ${academic}`;
                if (horizon === '5') {
                    vision = `Focused on delivering high-quality technical solutions and advancing to senior technical roles`;
                } else {
                    vision = `Dedicated to leading major projects, driving innovation, and mentoring the next generation of ${fieldName} professionals`;
                }
            } else { // Entrepreneur
                achievements = `Innovative ${fieldName} entrepreneur with ${academic} and business acumen`;
                if (horizon === '5') {
                    vision = `Passionate about identifying market opportunities and developing innovative solutions in the ${fieldName} industry`;
                } else {
                    vision = `Committed to building sustainable businesses, creating market-changing innovations, and inspiring entrepreneurial culture in ${fieldName}`;
                }
            }
            
            // Combine into professional summary
            return `${experience} in ${fieldName}. ${achievements}, combining ${expertise.toLowerCase()} with strong problem-solving abilities. ${vision}. Proven track record of continuous learning, collaboration, and delivering results in dynamic environments.`;
        }

        function previewCV() {
            const educationEntries = collectEducationData();
            const experienceEntries = collectExperienceData();
            
            const cvData = {
                name: document.getElementById('cvFullName').value,
                email: document.getElementById('cvEmail').value,
                phone: document.getElementById('cvPhone').value,
                location: document.getElementById('cvLocation').value,
                summary: document.getElementById('cvSummary').value,
                educationEntries: educationEntries,
                experienceEntries: experienceEntries,
                profilePicture: state.cv?.profilePicture || null,
                selectedTechnicals: state.cv?.selectedTechnicals || [],
                selectedSofts: state.cv?.selectedSofts || [],
                selectedLanguages: state.cv?.selectedLanguages || [],
                selectedAchievements: state.cv?.selectedAchievements || [],
                selectedExtracurriculars: state.cv?.selectedExtracurriculars || [],
                goals: state.goals || {}
            };
            
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`

            `);
            previewWindow.document.close();
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString + '-01'); // Add day for month input
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }

        function saveCV() {
            const educationEntries = collectEducationData();
            const experienceEntries = collectExperienceData();
            
            // Merge new data with existing CV data (to preserve selections)
            const cvData = {
                ...state.cv, // Preserve existing data like selections and profile picture
                name: document.getElementById('cvFullName').value,
                email: document.getElementById('cvEmail').value,
                phone: document.getElementById('cvPhone').value,
                location: document.getElementById('cvLocation').value,
                summary: document.getElementById('cvSummary').value,
                educationEntries: educationEntries,
                experienceEntries: experienceEntries
            };
            
            state.cv = cvData;
            try { saveToGoogleSheet(); } catch(e){}
            state.missions.cvBuilt = true;
            
            saveState();
            setTimeout(() => { try { syncSaveFields(); } catch (e) { console.warn('syncSaveFields fail', e); } }, 0);
            
            // Check if both goals and CV are completed for advanced badge
            if (state.missions.goalsSaved) {
                alert('Excellent! You\'ve completed Section 3 and earned the Advanced Badge!');
            } else {
                alert('CV saved successfully! +25 marks earned.');
            }

            updateHamburgerLocks();             // segarkan lock menu
            updateFooterLocks();                // sorok/unjuk footer passport
            
            updateLearningScreen();
            showScreen('dashboard');
        }

        // Fields Management
        function populateFields() {
            const fieldsGrid = document.getElementById('fieldsGrid');
            if (!fieldsGrid) return;
            
            fieldsGrid.innerHTML = '';
            
            Object.entries(fieldsData).forEach(([key, field]) => {
                const isSelected = state.profile.field === key;
                const fieldCard = document.createElement('div');
                fieldCard.className = `bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 ${isSelected ? 'ring-4 ring-purple-500 bg-purple-50' : ''}`;
                fieldCard.id = `field-card-${key}`;
                
                fieldCard.innerHTML = `
                    <div class="text-6xl mb-4">${field.icon}</div>
                    <h3 class="text-xl font-bold mb-4 text-gray-800">${field.name}</h3>
                    <div class="text-left mb-6 space-y-3">
                        <div>
                            <p class="text-sm font-semibold text-blue-600 mb-1">Next TVETMARA:</p>
                            <p class="text-sm text-gray-700">${field.institution}</p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-green-600 mb-1">Companies:</p>
                            <p class="text-sm text-gray-700">${field.companies.slice(0, 4).join(', ')}</p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-orange-600 mb-1">Top Skills:</p>
                            <p class="text-sm text-gray-700">${field.skills.slice(0, 4).join(', ')}</p>
                        </div>
                    </div>
                    <button id="select-btn-${key}" onclick="selectField('${key}')" class="w-full ${isSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-colors">
                        ${isSelected ? 'Picked!' : 'Select Field'}
                    </button>
                    <button id="continue-btn-${key}" onclick="continueFromFields()" class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors ${isSelected ? '' : 'hidden'}">
                        Continue
                    </button>
                `;
                
                fieldsGrid.appendChild(fieldCard);
            });
        }

        function selectField(fieldKey) {
            // Update state
            state.profile.field = fieldKey;
            
            // Award field selection marks (one-time only)
            if (!state.missions.fieldSelected) {
                state.missions.fieldSelected = true;
            }
            
            saveState();
            updateHamburgerLocks();
            updateFooterLocks();
            setTimeout(() => { try { syncSaveFields(); } catch (e) { console.warn('syncSaveFields fail', e); } }, 0);
            
            // Update all cards to show selection
            Object.keys(fieldsData).forEach(key => {
                const card = document.getElementById(`field-card-${key}`);
                const selectBtn = document.getElementById(`select-btn-${key}`);
                const continueBtn = document.getElementById(`continue-btn-${key}`);
                
                if (key === fieldKey) {
                    // Selected card
                    card.className = 'bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 ring-4 ring-purple-500 bg-purple-50';
                    selectBtn.textContent = 'Picked!';
                    selectBtn.className = 'w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-colors';
                    continueBtn.classList.remove('hidden');
                } else {
                    // Unselected cards
                    card.className = 'bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300';
                    selectBtn.textContent = 'Select Field';
                    selectBtn.className = 'w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-colors';
                    continueBtn.classList.add('hidden');
                }
            });
        }

        function continueFromFields() {
            // Show completion message if first time selecting field
            if (state.missions.fieldSelected && state.profile.field) {
                const fieldName = (window.fieldsData || fieldsData)[state.profile.field].name;
                alert(`Great choice! You've selected ${fieldName} as your field. +5 marks earned.`);
            }
            
            // Return to previous screen
            showScreen(state.navigation.previousScreen || 'learning');
            updateLearningScreen();
        }

        // Pathway Management
        function selectPathway(pathway) {
            state.pathway = pathway;
            
            // Award pathway selection marks (one-time only)
            if (!state.missions.pathwaySelected) {
                state.missions.pathwaySelected = true;
            }
            
            saveState();
            updateHamburgerLocks();
            updateFooterLocks();
            setTimeout(() => { try { syncSaveFields(); } catch (e) { console.warn('syncSaveFields fail', e); } }, 0);
            
            // Update all pathway cards
            ['Academic', 'Career', 'Entrepreneur'].forEach(p => {
                const card = document.getElementById(`pathway-card-${p}`);
                const btn = document.getElementById(`btn-${p}`);
                const continueBtn = document.getElementById(`continue-${p}`);
                
                if (p === pathway) {
                    // Selected pathway
                    card.className = 'bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 ring-4 ring-purple-500 bg-purple-50';
                    btn.textContent = 'Picked!';
                    btn.className = btn.className.replace(/bg-\w+-600/, 'bg-green-600').replace(/hover:bg-\w+-700/, 'hover:bg-green-700');
                    continueBtn.classList.remove('hidden');
                } else {
                    // Unselected pathways
                    card.className = 'bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300';
                    if (p === 'Academic') {
                        btn.textContent = 'Choose Academic';
                        btn.className = 'w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold mb-3';
                    } else if (p === 'Career') {
                        btn.textContent = 'Choose Career';
                        btn.className = 'w-full bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold mb-3';
                    } else if (p === 'Entrepreneur') {
                        btn.textContent = 'Choose Entrepreneur';
                        btn.className = 'w-full bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold mb-3';
                    }
                    continueBtn.classList.add('hidden');
                }
            });
        }

        function continueFromPathway() {
            // Show completion message if first time selecting pathway
            if (state.missions.pathwaySelected && state.pathway) {
                alert(`Excellent! You've chosen the ${state.pathway} pathway. +5 marks earned.`);
            }
            
            // Return to previous screen
            showScreen(state.navigation.previousScreen || 'learning');
            updateLearningScreen();
        }

        // Skills Screen
        function updateSkillsScreen() {
            const skillsContent = document.getElementById('skillsContent');
            
            if (!state.profile.field) {
                skillsContent.innerHTML = '<p class="text-center text-gray-600">Select a field in your profile to see recommended skills and certifications.</p>';
                return;
            }
            
            const field = (window.fieldsData || fieldsData)[state.profile.field];
            skillsContent.innerHTML = `
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">${field.icon}</div>
                    <h3 class="text-2xl font-bold mb-2">${field.name}</h3>
                    <p class="text-gray-600">Recommended skills and career opportunities</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 class="text-xl font-bold mb-4 text-blue-600">Key Skills</h4>
                        <ul class="space-y-2">
                            ${field.skills.map(skill => `<li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${skill}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-xl font-bold mb-4 text-blue-600">Career Opportunities</h4>
                        <ul class="space-y-2">
                            ${field.companies.map(company => `<li class="flex items-center"><span class="text-blue-500 mr-2">🏢</span>${company}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="mt-8 p-6 bg-blue-50 rounded-lg">
                    <h4 class="text-lg font-bold mb-2 text-blue-800">Institution</h4>
                    <p class="text-blue-700">${field.institution}</p>
                </div>
            `;
        }

        // Dashboard
        function updateDashboard() {
            document.getElementById('studentName').textContent = state.profile.name || '-';
            document.getElementById('studentSchool').textContent = state.profile.school || '-';
            document.getElementById('studentGrade').textContent = (state.profile.grade || '-' || '').replace(/([A-Za-z]+)(\d+)/, '$1 $2');
            
            // Load profile picture
            const dashboardProfilePicture = document.getElementById('dashboardProfilePicture');
            if (state.profile.profilePicture) {
                dashboardProfilePicture.innerHTML = `<img src="${state.profile.profilePicture}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
            } else {
                dashboardProfilePicture.innerHTML = '<span class="text-gray-500 text-xs">No Image</span>';
            }
            
            // Calculate level based on completed missions
            let completedMissions = 0;
            completedMissions += state.missions.s1.filter(m => m).length;
            completedMissions += state.missions.s2.filter(m => m).length;
            if (state.missions.explorerCompleted) completedMissions++;
            if (state.missions.fieldSelected) completedMissions++;
            if (state.missions.pathwaySelected) completedMissions++;
            if (state.missions.goalsSaved) completedMissions++;
            if (state.missions.cvBuilt) completedMissions++;
            
            let level = 'Beginner';
            let levelColor = 'purple';
            if (completedMissions >= 8) {
                level = 'Advanced';
                levelColor = 'red';
            } else if (completedMissions >= 4) {
                level = 'Intermediate';
                levelColor = 'orange';
            }
            
            const studentLevel = document.getElementById('studentLevel');
            studentLevel.textContent = level;
            studentLevel.className = `text-sm font-medium text-${levelColor}-600 bg-${levelColor}-100 px-2 py-1 rounded-full mt-1`;
            
            let totalMarks = 0;
            totalMarks += state.missions.s1.filter(m => m).length * 10;
            totalMarks += state.missions.s2.filter(m => m).length * 10;
            if (state.missions.explorerCompleted) totalMarks += 10;
            if (state.missions.fieldSelected) totalMarks += 5;
            if (state.missions.pathwaySelected) totalMarks += 5;
            if (state.missions.goalsSaved) totalMarks += 15;
            if (state.missions.cvBuilt) totalMarks += 25;
            
            let badges = 0;
            const earnedBadges = [];
            
            if (state.missions.s1.every(m => m)) {
                badges++;
                earnedBadges.push({
                    name: 'Beginner',
                    icon: 'https://i.postimg.cc/N0FY2NrZ/1.png',
                    description: 'Completed Section 1: Opening Spark'
                });
            }
            if (state.missions.s2.every(m => m)) {
                badges++;
                earnedBadges.push({
                    name: 'Intermediate',
                    icon: 'https://i.postimg.cc/Zn8hz21v/2.png',
                    description: 'Completed Section 2: Inspiration Talkshow'
                });
            }
            if (state.missions.goalsSaved && state.missions.cvBuilt) {
                badges++;
                earnedBadges.push({
                    name: 'Advanced',
                    icon: 'https://i.postimg.cc/jSdYB8vC/3.png',
                    description: 'Completed Section 3: Achievement Phase'
                });
            }
            if (state.missions.explorerCompleted) {
                badges++;
                earnedBadges.push({
                    name: 'Explorer',
                    icon: '🧭',
                    description: 'Completed Career Explorer Quiz'
                });
            }
            
            document.getElementById('totalMarks').textContent = totalMarks;
            document.getElementById('badgesEarned').textContent = `${badges}/4`;
            
            // Display achievement badges
            const achievementBadges = document.getElementById('achievementBadges');
            if (earnedBadges.length > 0) {
                achievementBadges.innerHTML = earnedBadges.map(badge => `
                    <div class="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors" title="${badge.description}">
                        ${badge.icon.startsWith('http') ? 
                            `<img src="${badge.icon}" alt="${badge.name}" class="w-10 h-10 object-contain mb-2" onerror="this.style.display='none';">` :
                            `<div class="text-3xl mb-2">${badge.icon}</div>`
                        }
                        <span class="text-xs font-bold text-yellow-700 text-center">${badge.name}</span>
                    </div>
                `).join('');
            } else {
                achievementBadges.innerHTML = '<div class="col-span-2 text-sm text-gray-500 italic text-center py-4">No badges earned yet</div>';
            }

            // Tambah dua baris ini
            updateHamburgerLocks();
            updateFooterLocks();
        }




        // === PASSPORT: TVETMARA institutions & programs (ikut Selected Field) ===
// Guna 'state.profile.field', 'tvetmaraPrograms' & 'fieldsData' sedia ada dalam fail.
function renderPassportTvetmara() {
  // Pastikan skrin passport & kad utama wujud
  const passportScreen = document.getElementById('passport');
  if (!passportScreen) return;

  const mainCard = passportScreen.querySelector('.bg-white.rounded-lg.shadow-lg.p-8');
  if (!mainCard) return;

  // Sediakan container khas dalam kad passport (auto-bina sekali, elak gandaan)
  let tvetWrap = mainCard.querySelector('#passport-tvetmara');
  if (!tvetWrap) {
    tvetWrap = document.createElement('div');
    tvetWrap.id = 'passport-tvetmara';
    tvetWrap.className = 'mt-10 border-t pt-8';
    tvetWrap.innerHTML = `
      <div class="mb-4">
        <h3 class="text-xl font-bold text-blue-600">TVETMARA Institutions & Programs</h3>
        <div class="text-sm text-gray-600">Based on Selected Field: <span id="passport-selected-field" class="font-semibold text-gray-800">-</span></div>
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold mb-2">Institutions</h4>
          <ul id="passport-institution-list" class="list-disc pl-5 space-y-1 text-sm"></ul>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Available Programs</h4>
          <ul id="passport-program-list" class="list-disc pl-5 space-y-1 text-sm"></ul>
        </div>
      </div>
    `;
    // Letak di DALAM kad passport sedia ada, selepas grid info pelajar/achievements
    mainCard.appendChild(tvetWrap);
  }

  // Ambil selected field dari state sedia ada
  const fieldKey = (state && state.profile && state.profile.field) ? state.profile.field : '';
  const fieldName = (window.fieldsData && window.fieldsData[fieldKey]) ? window.fieldsData[fieldKey].name : (fieldKey || '-');

  // Update label field
  const fieldEl = tvetWrap.querySelector('#passport-selected-field');
  if (fieldEl) fieldEl.textContent = fieldName;

  // Sasaran UL
  const instList = tvetWrap.querySelector('#passport-institution-list');
  const progList = tvetWrap.querySelector('#passport-program-list');
  if (!instList || !progList) return;

  // Reset
  instList.innerHTML = '';
  progList.innerHTML = '';

  // Guna database DALAM fail: tvetmaraPrograms
  const bank = window.tvetmaraPrograms || {};
  const items = (fieldKey && bank[fieldKey]) ? bank[fieldKey] : [];

  if (!items.length) {
    instList.innerHTML = `<li class="text-gray-500">No institutions listed for this field.</li>`;
    progList.innerHTML = `<li class="text-gray-500">No programs available.</li>`;
    return;
  }

  // Kumpul unik ikut institusi
  const byInst = new Map();
  items.forEach(({ institution, program }) => {
    if (!byInst.has(institution)) byInst.set(institution, []);
    byInst.get(institution).push(program);
  });

  // Render Institutions (unik + kiraan)
  byInst.forEach((programs, inst) => {
    const li = document.createElement('li');
    li.textContent = `${inst} (${programs.length})`;
    instList.appendChild(li);
  });

  // Render Programs (program + institusi)
  items.forEach(({ institution, program }) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="font-medium">${program}</span><br><span class="text-gray-500">${institution}</span>`;
    progList.appendChild(li);
  });
  try { saveToGoogleSheet(); } catch(e) {}
  try { saveToGoogleSheet(); } catch(e) {}
}







        // Passport
        function updatePassport() {
  // Basic
  const name    = (state.profile && state.profile.name)   || '-';
  const school  = (state.profile && state.profile.school) || '-';
  const gradeRaw= (state.profile && state.profile.grade)  || '-';
  const grade   = (gradeRaw || '').toString().replace(/([A-Za-z]+)(\d+)/, '$1 $2');
  let   fieldKey= (state.profile && state.profile.field)  || '';
  const pathway = state.pathway || '-';

  // Resolve field (key ATAU label)
  let field = null;
  if (window.fieldsData) {
    if (fieldKey && (window.fieldsData || fieldsData)[fieldKey]) {
      field = (window.fieldsData || fieldsData)[fieldKey];
    } else if (fieldKey) {
      const wanted = (fieldKey + '').toLowerCase();
      const found  = Object.keys(fieldsData)
        .find(k => (((window.fieldsData || fieldsData)[k].name || '') + '').toLowerCase() === wanted);
      if (found) { fieldKey = found; field = (window.fieldsData || fieldsData)[found]; }
    }
  }

  // Isi teks asas
  const setText = (id, val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText('passportName',  name);
  setText('passportSchool',school);
  setText('passportGrade', grade);
  setText('passportPathway', pathway);

  updatePassportSelectedPrograms();

  // Field icon + pill
  /*const iconEl     = document.getElementById('passportFieldIcon');
  const fieldNameEl= document.getElementById('passportFieldName');
  const pillEl     = document.getElementById('passportFieldPill');
  if (field){
if (iconEl)      iconEl.textContent      = field.icon || '🎓';
    if (fieldNameEl) fieldNameEl.textContent = field.name || '-';
    if (pillEl)      pillEl.textContent      = field.name || 'Field';
  
  if (typeof setPassportFieldLabels==='function') setPassportFieldLabels(field.name);
} else {
    if (iconEl)      iconEl.textContent      = '🎓';
    if (fieldNameEl) fieldNameEl.textContent = '-';
    if (pillEl)      pillEl.textContent      = 'Field';
  }*/

  // Field icon + pill + BOTH labels (hero & “Selected Field”)
const iconEl = document.getElementById('passportFieldIcon');
const pillEl = document.getElementById('passportFieldPill');
if (field){
if (iconEl) iconEl.textContent = field.icon || '🎓';
  if (pillEl) pillEl.textContent = field.name || 'Field';
  setPassportFieldLabels(field?.name);      // <— KUNCI

  if (typeof setPassportFieldLabels==='function') setPassportFieldLabels(field.name);
}  else {
  if (iconEl) iconEl.textContent = '🎓';
  if (pillEl) pillEl.textContent = 'Field';
  setPassportFieldLabels('-');              // <— fallback seragam
}


  // Gambar profil
  const photoWrap = document.getElementById('passportPhoto');
  if (photoWrap){
    photoWrap.innerHTML = '';
    const src = state.profile && state.profile.profilePicture;
    if (src){
      const img = document.createElement('img');
      img.src = src; img.alt='Profile'; img.className='w-full h-full object-cover';
      photoWrap.appendChild(img);
    } else {
      photoWrap.innerHTML = '<span class="text-white/80 text-xs">No Photo</span>';
    }
  }

  // TVETMARA lists (support pelbagai property)
  const instEl = document.getElementById('passportInstitutions');
  const compEl = document.getElementById('passportCompanies');
  const skillsEl = document.getElementById('passportSkills');
  if (instEl) instEl.innerHTML = '';
  if (compEl) compEl.innerHTML = '';
  if (skillsEl) skillsEl.innerHTML = '';

  if (field){
    // Institutions: 'institutions' (array) ATAU 'institution' (string koma)
    let institutions = [];
    if (Array.isArray(field.institutions)) institutions = field.institutions;
    else if (typeof field.institution === 'string') institutions = field.institution.split(',').map(s=>s.trim()).filter(Boolean);
    institutions.slice(0,8).forEach(n=>{
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border';
      chip.textContent = n; instEl && instEl.appendChild(chip);
    });

    // Companies: 'companies' → fallback 'topCompanies' → fallback 'company' (string)
    let companies = field.companies || field.topCompanies
      || (typeof field.company==='string' ? field.company.split(',').map(s=>s.trim()).filter(Boolean) : []);
    companies.slice(0,6).forEach(c=>{
      const li = document.createElement('li'); li.textContent = c; compEl && compEl.appendChild(li);
    });

    // Skills: 'skills' → fallback 'coreSkills'
    let skills = field.skills || field.coreSkills || [];
    skills.slice(0,10).forEach(sv=>{
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200';
      chip.textContent = sv; skillsEl && skillsEl.appendChild(chip);
    });
  }

  // Badges guna imej (Beginner/Intermediate/Advanced) + Explorer
  const badgeGrid = document.getElementById('badgeGrid');
  if (badgeGrid){
    badgeGrid.innerHTML = '';
    const earned = {
      beginner: (state.missions && state.missions.s1 && state.missions.s1.every(m=>m)) || false,
      intermediate: (state.missions && state.missions.s2 && state.missions.s2.every(m=>m)) || false,
      advanced: (state.missions && state.missions.goalsSaved && state.missions.cvBuilt) || false,
      explorer: (state.missions && state.missions.explorerCompleted) || false,
    };
    const items = [
  {key:'advanced',     label:'Advanced',     img:'https://i.postimg.cc/jSdYB8vC/3.png'},
  {key:'intermediate', label:'Intermediate', img:'https://i.postimg.cc/Zn8hz21v/2.png'},
  {key:'beginner',     label:'Beginner',     img:'https://i.postimg.cc/N0FY2NrZ/1.png'},
  {key:'explorer',     label:'Explorer',     img:null}
];
    let count = 0;
    items.forEach(b=>{
      const got = !!earned[b.key]; if (got) count++;
      const wrap = document.createElement('div');
      wrap.className = 'rounded-lg border p-3 text-center ' + (got ? 'bg-green-50 border-green-200 badge-earned' : 'bg-gray-50 border-gray-200 opacity-90 badge-locked');
      let inner = '';
      if (b.img) inner += '<img src="'+b.img+'" alt="'+b.label+'" class="w-12 h-12 mx-auto mb-1">';
      else       inner += '<div class="text-3xl mb-1">🧭</div>';
      inner +=   '<div class="text-sm font-medium">'+b.label+'</div>';
      inner +=   (got ? '<div class="text-[11px] text-green-700 mt-1">Unlocked</div>' : '<div class="text-[11px] text-gray-500 mt-1">Locked</div>');
      wrap.innerHTML = inner; badgeGrid.appendChild(wrap);
    });
    const badgeText = document.getElementById('passportBadges');
    if (badgeText) badgeText.textContent = (count + ' / 4');
  }
}

        // UI Updates
        function updateUI() {
          updateHeaderName();
            // Update any UI elements that depend on state
        }

        // Career Quiz Functions
        function startCareerQuiz() {
            const modal = document.getElementById('careerQuizModal');
            
            currentCareerQuiz = {
                questions: careerQuizQuestions,
                currentIndex: 0,
                answers: new Array(careerQuizQuestions.length).fill(null),
                scores: {}
            };
            
            // Initialize field scores
            Object.keys(fieldsData).forEach(field => {
                currentCareerQuiz.scores[field] = 0;
            });
            
            document.getElementById('careerQuizContent').classList.remove('hidden');
            document.getElementById('careerQuizResult').classList.add('hidden');
            document.getElementById('careerQuizNavigation').classList.remove('hidden');
            
            displayCurrentCareerQuestion();
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function displayCurrentCareerQuestion() {
            const content = document.getElementById('careerQuizContent');
            const question = currentCareerQuiz.questions[currentCareerQuiz.currentIndex];
            const questionNum = currentCareerQuiz.currentIndex + 1;
            const totalQuestions = currentCareerQuiz.questions.length;
            const progressPercentage = (questionNum / totalQuestions) * 100;
            
            content.innerHTML = `
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-600">Question ${questionNum} of ${totalQuestions}</span>
                        <span class="text-sm font-medium text-teal-600">${Math.round(progressPercentage)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="p-6 border rounded-lg bg-gray-50">
                    <h4 class="font-medium mb-6 text-lg text-center">${questionNum}. ${question.question}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${question.options.map((option, optIndex) => `
                            <label class="flex items-center p-4 hover:bg-gray-100 rounded-lg cursor-pointer border-2 transition-all ${currentCareerQuiz.answers[currentCareerQuiz.currentIndex] === optIndex ? 'bg-teal-50 border-teal-300' : 'border-gray-200'}">
                                <input type="radio" name="currentCareerQuestion" value="${optIndex}" class="hidden" ${currentCareerQuiz.answers[currentCareerQuiz.currentIndex] === optIndex ? 'checked' : ''} onchange="selectCareerAnswer(${optIndex})">
                                <div class="text-center w-full">
                                    <div class="text-3xl mb-2">${option.icon}</div>
                                    <span class="text-gray-800 font-medium">${option.text}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
            
            updateCareerNavigationButtons();
        }

        function selectCareerAnswer(optionIndex) {
            currentCareerQuiz.answers[currentCareerQuiz.currentIndex] = optionIndex;
            
            // Update scores based on selected option
            const question = currentCareerQuiz.questions[currentCareerQuiz.currentIndex];
            const selectedOption = question.options[optionIndex];
            
            selectedOption.fields.forEach(field => {
                currentCareerQuiz.scores[field] = (currentCareerQuiz.scores[field] || 0) + 1;
            });
            
            // Update visual selection
            displayCurrentCareerQuestion();
        }

        function updateCareerNavigationButtons() {
            const prevBtn = document.getElementById('careerPrevBtn');
            const nextBtn = document.getElementById('careerNextBtn');
            
            prevBtn.disabled = currentCareerQuiz.currentIndex === 0;
            
            const hasAnswer = currentCareerQuiz.answers[currentCareerQuiz.currentIndex] !== null;
            nextBtn.disabled = !hasAnswer;
            
            if (currentCareerQuiz.currentIndex === currentCareerQuiz.questions.length - 1) {
                nextBtn.textContent = hasAnswer ? 'Get My Match!' : 'Get My Match!';
                nextBtn.onclick = hasAnswer ? submitCareerQuiz : null;
            } else {
                nextBtn.textContent = 'Next';
                nextBtn.onclick = nextCareerQuestion;
            }
        }

        function previousCareerQuestion() {
            if (currentCareerQuiz.currentIndex > 0) {
                // Remove score from previous answer
                const prevQuestion = currentCareerQuiz.questions[currentCareerQuiz.currentIndex];
                const prevAnswer = currentCareerQuiz.answers[currentCareerQuiz.currentIndex];
                if (prevAnswer !== null) {
                    const prevOption = prevQuestion.options[prevAnswer];
                    prevOption.fields.forEach(field => {
                        currentCareerQuiz.scores[field] = Math.max(0, (currentCareerQuiz.scores[field] || 0) - 1);
                    });
                }
                
                currentCareerQuiz.currentIndex--;
                displayCurrentCareerQuestion();
            }
        }

        function nextCareerQuestion() {
            if (currentCareerQuiz.currentIndex < currentCareerQuiz.questions.length - 1) {
                currentCareerQuiz.currentIndex++;
                displayCurrentCareerQuestion();
            }
        }

        function submitCareerQuiz() {
            // Find the field with the highest score
            let maxScore = 0;
            let matchedField = null;
            
            Object.entries(currentCareerQuiz.scores).forEach(([field, score]) => {
                if (score > maxScore) {
                    maxScore = score;
                    matchedField = field;
                }
            });
            
            // If no clear winner, pick a default
            if (!matchedField) {
                matchedField = 'electronics';
            }
            
            // Save result to state
            state.careerQuiz.taken = true;
            state.careerQuiz.result = matchedField;
            
            // Award Explorer completion marks (one-time only)
            if (!state.missions.explorerCompleted) {
                state.missions.explorerCompleted = true;
            }
            
            saveState();
            setTimeout(() => { try { syncSaveFields(); } catch (e) { console.warn('syncSaveFields fail', e); } }, 0);
            
            // Display result
            displayCareerQuizResult(matchedField);
        }

        function displayCareerQuizResult(fieldKey) {
            const field = (window.fieldsData || fieldsData)[fieldKey];
            
            document.getElementById('careerQuizContent').classList.add('hidden');
            document.getElementById('careerQuizNavigation').classList.add('hidden');
            
            // Populate result data
            document.getElementById('fieldIcon').textContent = field.icon;
            document.getElementById('fieldName').textContent = field.name;
            document.getElementById('fieldDescription').textContent = `Based on your interests and preferences, ${field.name} is your perfect match!`;
            document.getElementById('fieldInstitution').textContent = field.institution;
            
            // Populate skills
            const skillsList = document.getElementById('fieldSkills');
            skillsList.innerHTML = field.skills.map(skill => `<li>• ${skill}</li>`).join('');
            
            // Populate companies
            const companiesList = document.getElementById('fieldCompanies');
            companiesList.innerHTML = field.companies.map(company => `<li>• ${company}</li>`).join('');
            
            // Store current matched field for favorites
            window.currentMatchedField = fieldKey;
            
            // Reset "Add to Favorites" button if field changed or it's a retake
            const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');
            if (addToFavoritesBtn) {
                if (state.careerQuiz.favorites.includes(fieldKey)) {
                    addToFavoritesBtn.textContent = 'Added to Favorites ✓';
                    addToFavoritesBtn.className = 'bg-green-700 text-white px-8 py-3 rounded-lg font-semibold cursor-default';
                    addToFavoritesBtn.disabled = true;
                } else {
                    addToFavoritesBtn.textContent = 'Add to Favorites';
                    addToFavoritesBtn.className = 'bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold';
                    addToFavoritesBtn.disabled = false;
                }
            }
            
            document.getElementById('careerQuizResult').classList.remove('hidden');
        }

        function addFieldToFavorites() {
            const fieldKey = window.currentMatchedField;
            if (fieldKey && !state.careerQuiz.favorites.includes(fieldKey)) {
                state.careerQuiz.favorites.push(fieldKey);
                saveState();
                
                // Update button to show added
                const btn = document.getElementById('addToFavoritesBtn');
                btn.textContent = 'Added to Favorites ✓';
                btn.className = 'bg-green-700 text-white px-8 py-3 rounded-lg font-semibold cursor-default';
                btn.disabled = true;
                
                alert(`${(window.fieldsData || fieldsData)[fieldKey].name} has been added to your favorites!`);
            }
        }

        function retakeCareerQuiz() {
            currentCareerQuiz = {
                questions: careerQuizQuestions,
                currentIndex: 0,
                answers: new Array(careerQuizQuestions.length).fill(null),
                scores: {}
            };
            
            // Initialize field scores
            Object.keys(fieldsData).forEach(field => {
                currentCareerQuiz.scores[field] = 0;
            });
            
            document.getElementById('careerQuizContent').classList.remove('hidden');
            document.getElementById('careerQuizResult').classList.add('hidden');
            document.getElementById('careerQuizNavigation').classList.remove('hidden');
            
            displayCurrentCareerQuestion();
        }

        function closeCareerQuiz() {
            const modal = document.getElementById('careerQuizModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            // Show completion message if first time completing
            if (state.missions.explorerCompleted && state.careerQuiz.taken) {
                setTimeout(() => {
                    alert('Congratulations! You\'ve completed the Career Explorer and earned the Explorer Badge! +10 marks earned.');
                }, 500);
            }
            
            // Update learning screen to reflect quiz completion
            updateLearningScreen();
        }

        // Skills and Opportunities Data
        const skillsOpportunitiesData = {
            'oil-gas': {
                current: ['Process Engineering', 'Safety Management', 'HAZOP Analysis', 'Pipeline Design', 'Refinery Operations', 'Quality Control'],
                future: ['Digital Twin Technology', 'AI-Powered Predictive Maintenance', 'Carbon Capture & Storage', 'Renewable Energy Integration', 'IoT Sensors & Analytics', 'Sustainable Process Design'],
                demand: ['Process Safety Engineer', 'Reservoir Engineer', 'Production Engineer', 'HSE Specialist', 'Project Manager', 'Operations Supervisor'],
                entryLevel: ['Process Technician', 'Safety Assistant', 'Quality Control Analyst', 'Field Operator', 'Laboratory Technician'],
                midLevel: ['Process Engineer', 'Safety Engineer', 'Project Coordinator', 'Operations Engineer', 'Maintenance Supervisor'],
                seniorLevel: ['Senior Process Engineer', 'HSE Manager', 'Operations Manager', 'Technical Director', 'Plant Manager'],
                salary: 'RM 3,000 - 12,000',
                growth: '+12%',
                employers: '200+'
            },
            'electrical': {
                current: ['Power Systems', 'Electrical Design', 'Motor Control', 'PLC Programming', 'Circuit Analysis', 'Electrical Safety'],
                future: ['Smart Grid Technology', 'Electric Vehicle Infrastructure', 'Energy Storage Systems', 'Renewable Energy Integration', 'IoT in Power Systems', 'AI-Driven Energy Management'],
                demand: ['Power Systems Engineer', 'Control Systems Engineer', 'Electrical Designer', 'Protection Engineer', 'Automation Specialist', 'Energy Analyst'],
                entryLevel: ['Electrical Technician', 'Maintenance Assistant', 'Control Panel Wireman', 'Field Service Technician', 'Electrical Installer'],
                midLevel: ['Electrical Engineer', 'Control Systems Specialist', 'Project Engineer', 'Maintenance Engineer', 'Design Engineer'],
                seniorLevel: ['Senior Electrical Engineer', 'Engineering Manager', 'Technical Consultant', 'Operations Director', 'Chief Engineer'],
                salary: 'RM 2,800 - 10,000',
                growth: '+18%',
                employers: '350+'
            },
            'electronics': {
                current: ['Circuit Design', 'Microcontrollers', 'PCB Layout', 'Embedded Systems', 'Signal Processing', 'Hardware Testing'],
                future: ['5G Technology', 'Edge Computing', 'Quantum Electronics', 'Neuromorphic Computing', 'Flexible Electronics', 'AI Chips Design'],
                demand: ['Embedded Systems Engineer', 'Hardware Engineer', 'RF Engineer', 'Test Engineer', 'Product Development Engineer', 'IoT Developer'],
                entryLevel: ['Electronics Technician', 'Test Technician', 'Assembly Technician', 'Quality Inspector', 'Lab Assistant'],
                midLevel: ['Electronics Engineer', 'Hardware Designer', 'Product Engineer', 'R&D Engineer', 'Systems Integration Engineer'],
                seniorLevel: ['Senior Electronics Engineer', 'Principal Engineer', 'R&D Manager', 'Technical Director', 'Chief Technology Officer'],
                salary: 'RM 3,200 - 15,000',
                growth: '+25%',
                employers: '450+'
            },
            'biotech': {
                current: ['Cell Culture', 'Genetic Engineering', 'Bioinformatics', 'Quality Control', 'Laboratory Techniques', 'Regulatory Compliance'],
                future: ['CRISPR Gene Editing', 'Synthetic Biology', 'Personalized Medicine', 'Bioprocess Automation', 'AI in Drug Discovery', 'Regenerative Medicine'],
                demand: ['Bioprocess Engineer', 'Quality Assurance Specialist', 'Research Scientist', 'Regulatory Affairs Specialist', 'Bioinformatics Analyst', 'Product Manager'],
                entryLevel: ['Lab Technician', 'Research Assistant', 'Quality Control Analyst', 'Production Operator', 'Data Entry Specialist'],
                midLevel: ['Bioprocess Engineer', 'Research Scientist', 'Quality Manager', 'Regulatory Specialist', 'Product Development Scientist'],
                seniorLevel: ['Senior Scientist', 'R&D Director', 'Operations Manager', 'Regulatory Affairs Director', 'Chief Scientific Officer'],
                salary: 'RM 3,500 - 18,000',
                growth: '+22%',
                employers: '180+'
            },
            'civil': {
                current: ['Structural Design', 'Project Management', 'AutoCAD', 'Construction Planning', 'Building Codes', 'Site Supervision'],
                future: ['Building Information Modeling (BIM)', 'Smart Cities Technology', 'Sustainable Construction', '3D Printing in Construction', 'Drone Surveying', 'AI in Design'],
                demand: ['Structural Engineer', 'Project Manager', 'Construction Manager', 'BIM Specialist', 'Infrastructure Engineer', 'Environmental Engineer'],
                entryLevel: ['Site Engineer', 'CAD Technician', 'Survey Assistant', 'Construction Inspector', 'Junior Draftsman'],
                midLevel: ['Civil Engineer', 'Project Coordinator', 'Design Engineer', 'Construction Manager', 'Infrastructure Specialist'],
                seniorLevel: ['Senior Civil Engineer', 'Project Director', 'Principal Engineer', 'Construction Director', 'Chief Engineer'],
                salary: 'RM 2,500 - 12,000',
                growth: '+15%',
                employers: '600+'
            },
            'manufacturing': {
                current: ['CNC Machining', 'Quality Assurance', 'Lean Manufacturing', 'CAD Design', 'Production Planning', 'Process Optimization'],
                future: ['Industry 4.0', 'Additive Manufacturing', 'Robotics & Automation', 'Digital Manufacturing', 'AI-Powered Quality Control', 'Sustainable Manufacturing'],
                demand: ['Manufacturing Engineer', 'Quality Engineer', 'Production Manager', 'Automation Engineer', 'Process Engineer', 'Lean Specialist'],
                entryLevel: ['Production Operator', 'Quality Inspector', 'Machine Operator', 'Assembly Technician', 'Maintenance Assistant'],
                midLevel: ['Manufacturing Engineer', 'Quality Manager', 'Production Supervisor', 'Process Engineer', 'Automation Specialist'],
                seniorLevel: ['Senior Manufacturing Engineer', 'Operations Manager', 'Plant Manager', 'Engineering Director', 'VP of Operations'],
                salary: 'RM 2,800 - 14,000',
                growth: '+20%',
                employers: '800+'
            },
            'arts': {
                current: ['Graphic Design', 'Digital Marketing', 'UI/UX Design', 'Brand Development', 'Video Production', 'Web Design'],
                future: ['AR/VR Design', 'Motion Graphics', 'Interactive Media', 'AI-Assisted Design', 'Voice UI Design', 'Sustainable Design'],
                demand: ['Graphic Designer', 'UI/UX Designer', 'Creative Director', 'Brand Manager', 'Digital Marketer', 'Content Creator'],
                entryLevel: ['Junior Designer', 'Design Assistant', 'Content Creator', 'Social Media Coordinator', 'Production Assistant'],
                midLevel: ['Senior Designer', 'Art Director', 'Brand Manager', 'Creative Lead', 'Digital Marketing Manager'],
                seniorLevel: ['Creative Director', 'Design Manager', 'Brand Director', 'VP of Creative', 'Chief Creative Officer'],
                salary: 'RM 2,200 - 10,000',
                growth: '+16%',
                employers: '400+'
            },
            'built-env': {
                current: ['Building Information Modeling', 'Sustainable Design', 'Urban Planning', 'Green Building', 'Energy Modeling', 'Environmental Assessment'],
                future: ['Smart Building Technology', 'Net-Zero Design', 'Biophilic Design', 'Climate-Responsive Architecture', 'Digital Twin Buildings', 'Circular Economy Design'],
                demand: ['Architect', 'Sustainability Consultant', 'BIM Specialist', 'Urban Planner', 'Environmental Designer', 'Green Building Consultant'],
                entryLevel: ['Architectural Assistant', 'CAD Technician', 'Junior Planner', 'Design Assistant', 'Sustainability Coordinator'],
                midLevel: ['Architect', 'Senior Designer', 'Project Architect', 'Sustainability Manager', 'Planning Consultant'],
                seniorLevel: ['Principal Architect', 'Design Director', 'Urban Planning Director', 'Sustainability Director', 'Chief Architect'],
                salary: 'RM 3,000 - 15,000',
                growth: '+14%',
                employers: '250+'
            },
            'materials': {
                current: ['Material Testing', 'Process Optimization', 'Quality Control', 'Chemical Analysis', 'Polymer Processing', 'Composite Manufacturing'],
                future: ['Nanomaterials', 'Smart Materials', 'Biomaterials', 'Recycling Technology', 'Advanced Composites', 'Materials Informatics'],
                demand: ['Materials Engineer', 'Process Engineer', 'Quality Manager', 'R&D Scientist', 'Product Development Engineer', 'Technical Specialist'],
                entryLevel: ['Lab Technician', 'Quality Inspector', 'Process Operator', 'Materials Tester', 'Production Assistant'],
                midLevel: ['Materials Engineer', 'Process Engineer', 'Quality Manager', 'Product Engineer', 'Technical Specialist'],
                seniorLevel: ['Senior Materials Engineer', 'R&D Manager', 'Technical Director', 'Operations Manager', 'Chief Technology Officer'],
                salary: 'RM 3,200 - 16,000',
                growth: '+19%',
                employers: '150+'
            },
            'automotive': {
                current: ['Engine Technology', 'Vehicle Diagnostics', 'Automotive Electronics', 'Hybrid Systems', 'Manufacturing Processes', 'Quality Systems'],
                future: ['Electric Vehicle Technology', 'Autonomous Driving', 'Connected Vehicles', 'Battery Technology', 'Lightweight Materials', 'AI in Automotive'],
                demand: ['Automotive Engineer', 'Powertrain Engineer', 'Electronics Engineer', 'Quality Engineer', 'Test Engineer', 'Product Manager'],
                entryLevel: ['Automotive Technician', 'Quality Inspector', 'Test Technician', 'Assembly Operator', 'Service Advisor'],
                midLevel: ['Automotive Engineer', 'Design Engineer', 'Quality Manager', 'Product Engineer', 'Technical Specialist'],
                seniorLevel: ['Senior Automotive Engineer', 'Engineering Manager', 'R&D Director', 'Plant Manager', 'Chief Engineer'],
                salary: 'RM 3,000 - 14,000',
                growth: '+17%',
                employers: '120+'
            },
            'biomedical': {
                current: ['Medical Device Design', 'Biomedical Instrumentation', 'Healthcare Technology', 'Regulatory Compliance', 'Clinical Research', 'Quality Assurance'],
                future: ['AI in Healthcare', 'Telemedicine Technology', 'Wearable Health Devices', 'Precision Medicine', 'Robotic Surgery', 'Digital Health Platforms'],
                demand: ['Biomedical Engineer', 'Clinical Engineer', 'Regulatory Specialist', 'Product Manager', 'Quality Engineer', 'Research Scientist'],
                entryLevel: ['Biomedical Technician', 'Clinical Technician', 'Quality Inspector', 'Research Assistant', 'Technical Support'],
                midLevel: ['Biomedical Engineer', 'Clinical Engineer', 'Product Engineer', 'Regulatory Specialist', 'Quality Manager'],
                seniorLevel: ['Senior Biomedical Engineer', 'R&D Manager', 'Clinical Director', 'Regulatory Affairs Director', 'Chief Technology Officer'],
                salary: 'RM 3,500 - 18,000',
                growth: '+28%',
                employers: '90+'
            }
        };

        // Skills Exploration Functions
        function toggleSkillsExploration() {
            const section = document.getElementById('skillsExplorationSection');
            const arrow = document.getElementById('exploreArrow');
            const isHidden = section.classList.contains('hidden');
            
            if (isHidden) {
                section.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
                
                // Populate content based on selected field
                populateSkillsExploration();
                
                // Smooth scroll to the section
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                section.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        }

        function populateSkillsExploration() {
            const fieldKey = state.profile.field;
            
            if (!fieldKey || !(window.fieldsData || fieldsData)[fieldKey] || !skillsOpportunitiesData[fieldKey]) {
                // Show no field selected message
                document.getElementById('skillsOpportunitiesContent').classList.add('hidden');
                document.getElementById('noFieldMessage').classList.remove('hidden');
                document.getElementById('explorationFieldName').textContent = 'Select a Field First';
                document.getElementById('explorationFieldIcon').textContent = '🎯';
                return;
            }
            
            const field = (window.fieldsData || fieldsData)[fieldKey];
            const skillsData = skillsOpportunitiesData[fieldKey];
            
            // Update header
            document.getElementById('explorationFieldIcon').textContent = field.icon;
            document.getElementById('explorationFieldName').textContent = field.name + ' Skills & Opportunities';
            
            // Show content and hide no field message
            document.getElementById('skillsOpportunitiesContent').classList.remove('hidden');
            document.getElementById('noFieldMessage').classList.add('hidden');
            
            // Populate current skills
            const currentSkillsList = document.getElementById('currentSkillsList');
            currentSkillsList.innerHTML = skillsData.current.map(skill => `
                <div class="flex items-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <span class="text-green-500 mr-2">✓</span>
                    <span class="text-gray-800 font-medium">${skill}</span>
                </div>
            `).join('');
            
            // Populate future skills
            const futureSkillsList = document.getElementById('futureSkillsList');
            futureSkillsList.innerHTML = skillsData.future.map(skill => `
                <div class="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span class="text-blue-500 mr-2">🚀</span>
                    <span class="text-gray-800 font-medium">${skill}</span>
                </div>
            `).join('');
            
            // Populate high demand skills
            const demandSkillsList = document.getElementById('demandSkillsList');
            demandSkillsList.innerHTML = skillsData.demand.map(skill => `
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div class="text-orange-500 text-lg mb-1">🔥</div>
                    <div class="text-sm font-medium text-gray-800">${skill}</div>
                </div>
            `).join('');
            
            // Populate career opportunities
            const entryLevelJobs = document.getElementById('entryLevelJobs');
            entryLevelJobs.innerHTML = skillsData.entryLevel.map(job => `
                <div class="flex items-center text-sm">
                    <span class="text-green-500 mr-2">•</span>
                    <span class="text-gray-700">${job}</span>
                </div>
            `).join('');
            
            const midLevelJobs = document.getElementById('midLevelJobs');
            midLevelJobs.innerHTML = skillsData.midLevel.map(job => `
                <div class="flex items-center text-sm">
                    <span class="text-blue-500 mr-2">•</span>
                    <span class="text-gray-700">${job}</span>
                </div>
            `).join('');
            
            const seniorLevelJobs = document.getElementById('seniorLevelJobs');
            seniorLevelJobs.innerHTML = skillsData.seniorLevel.map(job => `
                <div class="flex items-center text-sm">
                    <span class="text-purple-500 mr-2">•</span>
                    <span class="text-gray-700">${job}</span>
                </div>
            `).join('');
            
            // Update industry insights
            document.getElementById('salaryRange').textContent = skillsData.salary;
            document.getElementById('jobGrowth').textContent = skillsData.growth;
            document.getElementById('topEmployers').textContent = skillsData.employers;
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);
  

/* --- Split by ChatGPT --- */



  (function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'97d32ca122fda84c',t:'MTc1NzU1MTg2Mi4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
  

/* --- Split by ChatGPT --- */


(function(){
  // Helper: safely get regName
  function getRegName(){
    try{
      if (window.state && state.profile && state.profile.name) return state.profile.name;
      var regNameEl = document.getElementById('regName');
      if (regNameEl && regNameEl.value) return regNameEl.value;
      var ls = localStorage.getItem('regName');
      if (ls) return ls;
    }catch(e){}
    return '-';
  }

  // Populate header name
  document.addEventListener('DOMContentLoaded', function(){
    var el = document.getElementById('headerRegName');
    if (el) el.textContent = getRegName();
  });

  // Drawer logic
  function openDrawer(){
    var d = document.getElementById('drawer');
    var o = document.getElementById('drawerOverlay');
    if (!d || !o) return;
    d.classList.remove('-translate-x-full');
    o.classList.remove('hidden');
  }
  function closeDrawer(){
    var d = document.getElementById('drawer');
    var o = document.getElementById('drawerOverlay');
    if (!d || !o) return;
    d.classList.add('-translate-x-full');
    o.classList.add('hidden');
  }
  document.addEventListener('DOMContentLoaded', function(){
    var hb = document.getElementById('hamburgerBtn');
    var overlay = document.getElementById('drawerOverlay');
    var closeBtn = document.getElementById('drawerClose');
    if (hb) hb.addEventListener('click', function(e){ e.stopPropagation(); openDrawer(); });
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDrawer(); });

    var drawer = document.getElementById('drawer');
    if (drawer){
      drawer.querySelectorAll('button[data-target]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var target = btn.getAttribute('data-target');
          if (typeof window.showScreen === 'function') {
            window.showScreen(target);
          }
          closeDrawer();
        });
      });
    }
  });

  // Student grade formatting on dashboard
  document.addEventListener('DOMContentLoaded', function(){
    var sg = document.getElementById('studentGrade');
    if (sg && sg.textContent && !/\s/.test(sg.textContent)) {
      sg.textContent = sg.textContent.replace(/([A-Za-z]+)(\d+)/, '$1 $2');
    }
  });
})();


/* --- Split by ChatGPT --- */


(function(){
  function getFieldKey(){
    try {
      if (window.state && state.profile && state.profile.field) return state.profile.field;
      var sel = document.getElementById('profileField');
      if (sel && sel.value) return sel.value;
      var ls = localStorage.getItem('profileField');
      if (ls) return ls;
    } catch(e){}
    return '';
  }
  function getPathwayKey(){
    try {
      if (window.state && typeof state.pathway === 'string' && state.pathway) return state.pathway;
      var ls = localStorage.getItem('pathway');
      if (ls) return ls;
    } catch(e){}
    return '';
  }
  function regenerateSummary(){
    try{
      if (typeof window.generateProfessionalSummary === 'function') {
        var txt = window.generateProfessionalSummary();
        var el = document.getElementById('cvSummary');
        if (el) el.value = txt || el.value;
      } else {
        var fieldKey = getFieldKey() || 'Technology';
        var pathway = getPathwayKey() || 'Career';
        var fieldName = (window.fieldsData && (window.fieldsData || fieldsData)[fieldKey] && (window.fieldsData || fieldsData)[fieldKey].name) ? (window.fieldsData || fieldsData)[fieldKey].name : fieldKey;
        var line = (pathway === 'Academic')
            ? 'Aspiring to contribute to research and academic excellence in ' + fieldName + '.'
            : (pathway === 'Entrepreneur')
              ? 'Driven to build innovative ventures and solve real-world problems in ' + fieldName + '.'
              : 'Focused on developing strong technical skills and industry experience in ' + fieldName + '.';
        var el2 = document.getElementById('cvSummary');
        if (el2) el2.value = ('Experienced ' + fieldName + ' enthusiast. ' + line).trim();
      }
    }catch(e){}
  }
  function rememberKeys(fieldKey, pathwayKey){
    try{
      localStorage.setItem('prevFieldKey', fieldKey || '');
      localStorage.setItem('prevPathwayKey', pathwayKey || '');
      localStorage.setItem('lastPromptCombo', (fieldKey||'') + '|' + (pathwayKey||''));
    }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('regenSummaryBtn');
    if (btn){
      btn.addEventListener('click', function(){
        regenerateSummary();
      });
    }
    setTimeout(function(){
      var fieldKey = getFieldKey();
      var pathwayKey = getPathwayKey();
      var lastCombo = localStorage.getItem('lastPromptCombo') || '';
      var thisCombo = (fieldKey||'') + '|' + (pathwayKey||'');
      var cvEl = document.getElementById('cvSummary');
      if (cvEl && thisCombo && thisCombo !== lastCombo){
        var answer = confirm('You changed your field/pathway. Regenerate your Professional Summary now?');
        if (answer){
          regenerateSummary();
        }
        rememberKeys(fieldKey, pathwayKey);
      }
    }, 400);
  });
})();


/* --- Split by ChatGPT --- */


// ===== Passport Enhanced UI & Logic =====
(function(){
  // 1) Replace passport inner HTML with enhanced layout once
  document.addEventListener('DOMContentLoaded', function(){
    var el = document.getElementById('passport');
    if (!el) return;
    el.innerHTML = `
      

        <div id="passportCard" class="max-w-5xl mx-auto border-4 border-blue-900 rounded-3xl p-5 md:p-8 bg-white">

        <div class="text-center mb-6 no-print">
          <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Print / Download Passport</button>

          <div class="text-center mb-4">
            <div class="text-2xl font-semibold">Congratulations!</div>
            <div class="text-sm text-blue-700">You are NextGEN TVETMARA</div>
          </div>

                </div>

        <!-- Hero -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 mb-6">
          <div class="flex items-center gap-4">
            <div id="passportPhoto" class="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden ring-2 ring-white/50">
              <span class="text-white/80 text-xs">No Photo</span>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold leading-tight"><span id="passportName">-</span></div>
              <div class="text-sm"><span id="passportSchool">-</span> • <span id="passportGrade">-</span></div>
            </div>
            <div class="text-right hidden md:block">
              <div class="text-5xl leading-none" id="passportFieldIcon">🎓</div>
              <div class="text-sm opacity-90" id="passportFieldName">-</div>
            </div>
          </div>
        </div>

        <!-- Two-column Summary -->
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Achievements & Badges -->
          <section class="md:col-span-1 bg-white rounded-xl shadow p-5">
            <h3 class="text-lg font-semibold mb-3">Achievements</h3>
            <ul class="text-sm space-y-1">
              <li><strong>Pathway:</strong> <span id="passportPathway">-</span></li>
              <li><strong>Badges Earned:</strong> <span id="passportBadges">0 / 4</span></li>
            </ul>
            <div class="grid grid-cols-2 gap-3 mt-4" id="badgeGrid"></div>
          </section>

          <!-- TVETMARA Info -->
          <!-- TVETMARA Info (clean layout) -->
<!-- Selected Field + Available Programs (match sample) -->
<section class="md:col-span-2 bg-white rounded-xl shadow p-5">
  <h3 class="text-xl font-semibold mb-3">TVETMARA Info</h3>

<!-- Selected Field -->
<!-- Dalam seksyen TVETMARA Program -->
<span class="text-sm font-medium text-blue-800">Selected Field:</span>
<div id="passportSelectedField" class="text-blue-900 font-semibold">-</div>

  <!-- Available Programs -->
  <div>
    <br></br>
    <div class="text-sm font-medium text-blue-800">TVETMARA Available Programs:</div>
    <!--div class="text-xs uppercase text-gray-500 mb-1">TVETMARA Available Programs</div-->
    <!-- Bullet lines like the example -->
    <div id="passportPrograms" class="text-sm text-blue-700 space-y-1"></div>
  </div>


</section>


<!-- Meta: Passport ID + Issued date -->
<section class="md:col-span-2 mt-6">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
    <div>Passport ID: <span id="passportIdValue">-</span></div>
    <div>Issued date: <span id="passportIssuedValue">-</span></div>
  </div>
</section>

        </div>
      </div>
    `;
  });




  // 2) Enhanced update function
  
function updatePassportEnhanced(){
  // Basic
  const name = (window.state && state.profile && state.profile.name) || '-';
  const school = (state.profile && state.profile.school) || '-';
  const gradeRaw = (state.profile && state.profile.grade) || '-';
  const grade = (gradeRaw || '').toString().replace(/([A-Za-z]+)(\d+)/, '$1 $2');
  let fieldKey = (state.profile && state.profile.field) || '';
  const pathway = (state && state.pathway) || '-';

  // Resolve field by key OR by display name
  let field = null;
  if (window.fieldsData) {
    if (fieldKey && (window.fieldsData || fieldsData)[fieldKey]) {
      field = (window.fieldsData || fieldsData)[fieldKey];
    } else if (fieldKey) {
      // Try match by name (case-insensitive)
      const wanted = (fieldKey + '').toLowerCase();
      const foundKey = Object.keys(fieldsData).find(k => (((window.fieldsData || fieldsData)[k].name || '') + '').toLowerCase() === wanted);
      if (foundKey) { fieldKey = foundKey; field = (window.fieldsData || fieldsData)[foundKey]; }
    }
  }

  // Fill basics
  const setText = (id, val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText('passportName', name);
  setText('passportSchool', school);
  setText('passportGrade', grade);
  setText('passportPathway', pathway);

  const iconEl = document.getElementById('passportFieldIcon');
  const fieldNameEl = document.getElementById('passportFieldName');
  const pillEl = document.getElementById('passportFieldPill');
  if (field){
if (iconEl) iconEl.textContent = field.icon || '🎓';
    if (fieldNameEl) fieldNameEl.textContent = field.name || '-';
    if (pillEl) pillEl.textContent = field.name || 'Field';
  
  if (typeof setPassportFieldLabels==='function') setPassportFieldLabels(field.name);
} else {
    if (iconEl) iconEl.textContent = '🎓';
    if (fieldNameEl) fieldNameEl.textContent = '-';
    if (pillEl) pillEl.textContent = 'Field';
  }

  // Photo
  const photoWrap = document.getElementById('passportPhoto');
  if (photoWrap){
    photoWrap.innerHTML = '';
    const src = (state.profile && state.profile.profilePicture) || '';
    if (src){
      const img = document.createElement('img');
      img.src = src; img.alt = 'Profile';
      img.className = 'w-full h-full object-cover';
      photoWrap.appendChild(img);
    }else{
      photoWrap.innerHTML = '<span class="text-white/80 text-xs">No Photo</span>';
    }
  }

  // TVETMARA lists (robust handling for property variants)
  const instEl = document.getElementById('passportInstitutions');
  const compEl = document.getElementById('passportCompanies');
  const skillsEl = document.getElementById('passportSkills');
  if (instEl) instEl.innerHTML = '';
  if (compEl) compEl.innerHTML = '';
  if (skillsEl) skillsEl.innerHTML = '';

  if (field){
    // Institutions: array 'institutions' OR string 'institution' (comma-separated)
    let institutions = [];
    if (Array.isArray(field.institutions)) institutions = field.institutions;
    else if (typeof field.institution === 'string') institutions = field.institution.split(',').map(s=>s.trim()).filter(Boolean);
    institutions.slice(0,8).forEach(name => {
      const span = document.createElement('span');
      span.className = 'px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border';
      span.textContent = name;
      instEl && instEl.appendChild(span);
    });

    // Companies: prefer 'companies' then 'topCompanies' then 'company'
    let companies = [];
    if (Array.isArray(field.companies)) companies = field.companies;
    else if (Array.isArray(field.topCompanies)) companies = field.topCompanies;
    else if (typeof field.company === 'string') companies = field.company.split(',').map(s=>s.trim()).filter(Boolean);
    companies.slice(0,6).forEach(c => {
      const li = document.createElement('li');
      li.textContent = c;
      compEl && compEl.appendChild(li);
    });

    // Skills: prefer 'skills' then 'coreSkills'
    let skills = [];
    if (Array.isArray(field.skills)) skills = field.skills;
    else if (Array.isArray(field.coreSkills)) skills = field.coreSkills;
    skills.slice(0,10).forEach(s => {
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200';
      chip.textContent = s;
      skillsEl && skillsEl.appendChild(chip);
    });
  }

  // Badges
  const badgeGrid = document.getElementById('badgeGrid');
  if (badgeGrid){
    badgeGrid.innerHTML = '';
    const earned = {
      beginner: (state.missions && state.missions.s1 && state.missions.s1.every(m=>m)) || false,
      intermediate: (state.missions && state.missions.s2 && state.missions.s2.every(m=>m)) || false,
      advanced: (state.missions && state.missions.goalsSaved && state.missions.cvBuilt) || false,
      explorer: (state.missions && state.missions.explorerCompleted) || false,
    };
    const items = [
  {key:'advanced',     label:'Advanced',     img:'https://i.postimg.cc/jSdYB8vC/3.png'},
  {key:'intermediate', label:'Intermediate', img:'https://i.postimg.cc/Zn8hz21v/2.png'},
  {key:'beginner',     label:'Beginner',     img:'https://i.postimg.cc/N0FY2NrZ/1.png'},
  {key:'explorer',     label:'Explorer',     img:null}
];
    let count = 0;
    items.forEach(b=>{
      const got = !!earned[b.key];
      if (got) count++;
      const div = document.createElement('div');
      div.className = 'rounded-lg border p-3 text-center ' + (got ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-70');
      div.innerHTML = '<div class="text-3xl mb-1">' + b.icon + '</div>'
                    + '<div class="text-xs font-medium">' + b.label + '</div>'
                    + (got ? '<div class="text-[10px] text-green-700 mt-1">Unlocked</div>' : '<div class="text-[10px] text-gray-500 mt-1">Locked</div>');
      badgeGrid.appendChild(div);
    });
    const badgeText = document.getElementById('passportBadges');
    if (badgeText) badgeText.textContent = (count + ' / 4');
  }
  try{ if (typeof updatePassportSelectedPrograms==='function') updatePassportSelectedPrograms(); }catch(e){}
}
  // 3) Hook into existing updatePassport call
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof window.updatePassportEnhanced === 'function'){
      // nothing
    }
    window.updatePassportEnhanced = updatePassportEnhanced;
    // Soft override: if app calls updatePassport(), redirect to enhanced
    try { window.updatePassport = updatePassportEnhanced; } catch(e){}
  });
})();


/* --- Split by ChatGPT --- */


/* ===========================
   BEGIN: PASSPORT TVETMARA (auto-inject + render)
   Letak blok ini SEBELUM </body>
   =========================== */

/* 1) DATA: Hanya kekalkan jika belum wujud dalam fail (JIKA SUDAH ADA, BUANG BAHAGIAN INI) */
window.SenaraiTvetmaraProgram = window.SenaraiTvetmaraProgram || { 
  'oil-gas': [
    { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Piping)' },
    { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Mechanical)' },
    { institution: 'KKTM Kemaman', program: 'Diploma in Electrical Engineering Technology (Plant Operation)' },
    { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Offshore Structure)' },
    { institution: 'KKTM Kemaman', program: 'Diploma in Plant Engineering Technology (Instrumentation and Control)' },
    { institution: 'KKTM Kemaman', program: 'Diploma in Petroleum Engineering Technology (Onshore Operation)' }
  ],
  'electrical': [
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Electrical Engineering Technology (Power)' },
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Electrical Engineering Technology (Domestic and Industry)' }
  ],
  'electronics': [
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Electronic Engineering Technology (Industry)' },
    { institution: 'KKTM Petaling Jaya', program: 'Diploma in Electronic Engineering (Internet Of Things)' },
    { institution: 'MJII', program: 'Diploma in Electronic Engineering (Robotic & Automation)' },
    { institution: 'MJII', program: 'Diploma in Electronic Engineering (Embedded System)' },
    { institution: 'MJII', program: 'Diploma in Electronic Engineering (Microelectronic)' },
    { institution: 'MJII', program: 'Diploma in Electronic Engineering (Electronics Measurement & Control)' },
    { institution: 'MJII', program: 'Diploma in Electronic Engineering (Data Transmission & Network)' }
  ],
  'biotech': [
    { institution: 'KKTM Lenggong', program: 'Diploma in Herbal and Natural Products (Herbal Science)' },
    { institution: 'KKTM Lenggong', program: 'Diploma in Herbal and Natural Products (Manufacturing)' },
    { institution: 'KKTM Lenggong', program: 'Diploma in Engineering Technology Plant Maintenance' },
    { institution: 'KKTM Lenggong', program: 'Diploma in Packaging Technology and Design' },
    { institution: 'KKTM Lenggong', program: 'Diploma in Biochemical Engineering Technology (Food)' }
  ],
  'civil': [
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Building Engineering Technology' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Advanced System)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Geo-Structure)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology Building (Forensic and Maintenance)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Highway and Transportation)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Building Services and Maintenance)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Building Information Modelling)' },
    { institution: 'KKTM Sri Gading', program: 'Diploma in Construction Engineering Technology (Green Buildings)' }
  ],
  'manufacturing': [
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology' },
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Stamping Die)' },
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Plastic Injection Mould)' },
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Engineering Technology (Product Design)' },
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Technology' },
    { institution: 'KKTM Balik Pulau', program: 'Diploma in Manufacturing Technology (RUTP)' },
    { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Technology and Process)' },
    { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Industrial Automation and Robotic)' },
    { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Manufacturing Design)' },
    { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Automotive Manufacturing)' },
    { institution: 'KKTM Kuantan', program: 'Diploma in Manufacturing Engineering (Quality and Productivity)' },
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Mechanical Design Engineering Technology' }
  ],
  'arts': [
    { institution: 'KKTM Rembau', program: 'Diploma in Furniture Design' },
    { institution: 'KKTM Rembau', program: 'Diploma in Fashion Design' },
    { institution: 'KKTM Rembau', program: 'Diploma in Digital Filmmaking' },
    { institution: 'KKTM Rembau', program: 'Diploma in Digital Media Design' },
    { institution: 'KKTM Rembau', program: 'Diploma in Interior Design' },
    { institution: 'KKTM Rembau', program: 'Diploma of Technopreneurship In Fashion' }
  ],
  'built-env': [
    { institution: 'KKTM Pasir Mas', program: 'Diploma in Architecture' }
  ],
  'materials': [
    { institution: 'KKTM Masjid Tanah', program: 'Diploma in Polymer Composite Processing Engineering Technology' },
    { institution: 'KKTM Masjid Tanah', program: 'Diploma in Ceramic Processing Engineering Technology' },
    { institution: 'KKTM Masjid Tanah', program: 'Diploma in Plastic Processing Engineering Technology' },
    { institution: 'KKTM Masjid Tanah', program: 'Diploma of Industry in Aerospace Composite Manufacturing' }
  ],
  'automotive': [
    { institution: 'KKTM Masjid Tanah', program: 'Diploma in Automotive Engineering Technology' }
  ],
  'biomedical': [
    { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Therapeutic)' },
    { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Diagnostic)' },
    { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Radiology and Imaging)' },
    { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Laboratory)' },
    { institution: 'KKTM Ledang', program: 'Diploma in Biomedical Electronics Engineering (Information and Communication Technology)' },
    { institution: 'KKTM Ledang', program: 'Diploma of Competency in Computer Networking and System Administration' }
  ]
};




/* --- Split by ChatGPT --- */


(function(){
  // 1) Fungsi tukar skrin (tanpa showScreen)
  function switchTo(name){
    // Jika app anda guna class lain, tukar ".screen" di bawah
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    const el = document.getElementById(name);
    if (el) el.classList.remove('hidden');

    // Panggil updater bila buka Passport
    if (name === 'passport') {
      (window.updatePassportEnhanced || window.updatePassport)?.();
    }
  }

  // 2) Event delegation utk semua butang/menu yang ada data-target
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    const target = btn.getAttribute('data-target');
    if (!target) return;
    e.preventDefault();
    switchTo(target);
  });

  // 3) Sokong link/element lain yang menuju ke #passport (kalau ada)
  document.querySelectorAll('a[href="#passport"], #passportNav').forEach(el => {
    el.addEventListener('click', (e)=>{ e.preventDefault(); switchTo('passport'); });
  });

  // 4) Terakhir, pantau perubahan visibility pada #passport (apa pun cara anda toggle)
  const passportEl = document.getElementById('passport');
  if (passportEl) {
    const obs = new MutationObserver(() => {
      const visible = !passportEl.classList.contains('hidden');
      if (visible) (window.updatePassportEnhanced || window.updatePassport)?.();
    });
    obs.observe(passportEl, { attributes: true, attributeFilter: ['class'] });
  }

  // 5) Kalau Passport sudah visible masa load, update terus
  document.addEventListener('DOMContentLoaded', () => {
    const p = document.getElementById('passport');
    if (p && !p.classList.contains('hidden')) {
      (window.updatePassportEnhanced || window.updatePassport)?.();
    }
  });

  // Opsyen: expose supaya boleh dipanggil dari tempat lain jika perlu
  window.switchTo = switchTo;
})();


/* --- Split by ChatGPT --- */


(function(){
  function waitForData(cb, tries=40){
    if ((window.fieldsData) && window.state && state.profile) { cb(); return; }
    if (tries <= 0) { cb(); return; }
    setTimeout(()=>waitForData(cb, tries-1), 200);
  }
  function run(){
    (window.updatePassportEnhanced || window.updatePassport)?.();
  }
  document.addEventListener('DOMContentLoaded', function(){
    const p = document.getElementById('passport');
    if (p && !p.classList.contains('hidden')) {
      waitForData(run);
    }
  });
})();


/* --- Split by ChatGPT --- */


(function(){
  function resolveName(){
    try{
      if (window.state && state.profile && state.profile.name) return state.profile.name;
      if (window.state && state.auth && state.auth.name) return state.auth.name;
      const ls = localStorage.getItem('regName'); if (ls) return ls;
      const email = (state && state.profile && state.profile.email) || localStorage.getItem('regEmail') || '';
      if (email && email.includes('@')) return email.split('@')[0];
    }catch(e){}
    return '-';
  }
  document.addEventListener('DOMContentLoaded', function(){
    const nm = resolveName();
    const header = document.getElementById('headerRegName'); if (header) header.textContent = nm;
    const pn = document.getElementById('passportName'); if (pn) pn.textContent = nm;
  });
})();


/* --- Split by ChatGPT --- */


(function(){
  function doLogout(){
    try {
      if (window.state) {
        state.auth = { isLoggedIn: false };
        try { localStorage.removeItem('regName'); } catch(e){}
        try { localStorage.removeItem('regEmail'); } catch(e){}
        if (typeof saveState === 'function') saveState();
      }
    } catch(e){}
    // Navigate to cover/login
    if (typeof showScreen === 'function') {
      showScreen('cover');
    } else if (typeof switchTo === 'function') {
      switchTo('cover');
    } else {
      // Fallback: hide all .screen and show #cover
      try {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        const cover = document.getElementById('cover'); if (cover) cover.classList.remove('hidden');
      } catch(e) {}
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('logoutBtn');
    if (btn && !btn.dataset.boundLogout){
      btn.addEventListener('click', function(e){ e.preventDefault(); doLogout(); });
      btn.dataset.boundLogout = '1';
    }
  });
  // Expose for reuse
  window.doLogout = doLogout;
})();


/* --- Split by ChatGPT --- */


(function(){
  function waitForData(cb, tries=40){
    if (window.fieldsData && window.state && state.profile) { cb(); return; }
    if (tries <= 0) { cb(); return; }
    setTimeout(()=>waitForData(cb, tries-1), 200);
  }
  function run(){
    (window.updatePassportEnhanced || window.updatePassport)?.();
  }
  // Run when passport visible on load
  document.addEventListener('DOMContentLoaded', function(){
    var p = document.getElementById('passport');
    if (p && !p.classList.contains('hidden')) waitForData(run);
  });
  // Also when switching via our optional switchTo function
  if (typeof window.switchTo === 'function') {
    const orig = window.switchTo;
    window.switchTo = function(name){
      orig(name);
      if (name === 'passport') waitForData(run);
    }
  }
})();



function syncSaveFields() {
  const name   = (state.profile?.name  || state.auth?.name  || '').trim();
  const email  = (state.profile?.email || state.auth?.email || '').trim();
  const dob    =  state.profile?.dob    || '';
  const school =  state.profile?.school || '';
  const grade  =  state.profile?.grade  || '';

  const fieldKey = state.profile?.field || '';
  const suitableFieldKey = state.careerQuiz?.result || '';

  const toTitle = s => (s||'').toString()
      .replace(/[-_]/g,' ')
      .replace(/\b\w/g, c => c.toUpperCase()).trim();

  const selectedFieldName =
    fieldKey && window.fieldsData?.[fieldKey]
      ? (window.fieldsData[fieldKey].name || toTitle(fieldKey))
      : toTitle(fieldKey);

  const suitableFieldName =
    suitableFieldKey && window.fieldsData?.[suitableFieldKey]
      ? (window.fieldsData[suitableFieldKey].name || toTitle(suitableFieldKey))
      : toTitle(suitableFieldKey);

  const institution =
    fieldKey && window.fieldsData?.[fieldKey]
      ? (window.fieldsData[fieldKey].institution || '')
      : '';

  const normPathway = p => {
    const s = (p||'').toString().toLowerCase().trim();
    if (['akademik','academic'].includes(s)) return 'Academic';
    if (['career','kerjaya','industry','industri'].includes(s)) return 'Career';
    if (['entrepreneur','usahawan','business','bisnes','entrepreneurship'].includes(s)) return 'Entrepreneur';
    return toTitle(p);
  };
  const pathway = normPathway(state.pathway);

  // Kira progress/marks secara selamat
  const s1 = state.missions?.s1 || [];
  const s2 = state.missions?.s2 || [];
  const bool = x => !!x;

  let completed = 0, total = 11, marks = 0;
  completed += s1.filter(Boolean).length;
  completed += s2.filter(Boolean).length;
  if (bool(state.missions?.explorerCompleted)) completed++;
  if (bool(state.missions?.fieldSelected))     completed++;
  if (bool(state.missions?.pathwaySelected))   completed++;
  if (bool(state.missions?.goalsSaved))        completed++;
  if (bool(state.missions?.cvBuilt))           completed++;

  marks += s1.filter(Boolean).length * 10;
  marks += s2.filter(Boolean).length * 10;
  if (bool(state.missions?.explorerCompleted)) marks += 10;
  if (bool(state.missions?.fieldSelected))     marks += 5;
  if (bool(state.missions?.pathwaySelected))   marks += 5;
  if (bool(state.missions?.goalsSaved))        marks += 15;
  if (bool(state.missions?.cvBuilt))           marks += 25;

  const overallPct = Math.round((completed / total) * 100);

  const badges = {
    Beginner:     s1.length>0 && s1.every(Boolean),
    Intermediate: s2.length>0 && s2.every(Boolean),
    Advanced:     !!(state.missions?.goalsSaved && state.missions?.cvBuilt),
    Explorer:     !!state.missions?.explorerCompleted
  };

  // Helper set
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? '';
  };

  // Isi hidden inputs
  setVal('saveSuitableField', suitableFieldName || '-');
  setVal('saveSelectedField', selectedFieldName || '-');
  setVal('savePathway',       pathway || '-');
  setVal('saveInstitution',   institution || '-');
  setVal('saveOverall',       String(overallPct));
  setVal('saveTotalMarks',    String(marks));
  setVal('saveMissionDone',   String(completed));     // jika anda mahu "7/11" tukar ke `${completed}/${total}`
  setVal('saveBadgesJson',    JSON.stringify(badges));
}

window.syncSaveFields = syncSaveFields;

/* --- Split by ChatGPT --- */


(function(){
  // ---------- Konfigurasi ----------
  const BADGES = [
    {key:'advanced',     label:'Advanced',     src:'https://i.postimg.cc/jSdYB8vC/3.png'},
    {key:'intermediate', label:'Intermediate', src:'https://i.postimg.cc/Zn8hz21v/2.png'},
    {key:'beginner',     label:'Beginner',     src:'https://i.postimg.cc/N0FY2NrZ/1.png'},
    {key:'explorer',     label:'Explorer',     src:null}
  ];

  // ---------- Util umum ----------
  const fieldsReady = new Promise((resolve)=>{
    if (window.fieldsData) return resolve();
    const tick = ()=>{ if (window.fieldsData) resolve(); else requestAnimationFrame(tick); };
    tick(); // rAF: lebih pantas dari setTimeout 200ms
  });
  function getName(){
    try{
      if (state?.profile?.name) return state.profile.name;
      if (state?.auth?.name)    return state.auth.name;
      const rn = localStorage.getItem('regName'); if (rn) return rn;
      const em = state?.profile?.email || localStorage.getItem('regEmail') || '';
      if (em.includes('@')) return em.split('@')[0];
    }catch(e){}
    return '-';
  }
  const NL = (x)=> Array.isArray(x) ? x
    : (typeof x === 'string' ? x.split(',').map(s=>s.trim()).filter(Boolean) : []);

  function getFieldObj(){
    const fk = state?.profile?.field || '';
    const fd = window.fieldsData || {};
    if (fk && fd[fk]) return fd[fk];
    return Object.values(fd).find(v => (v?.name||'').toLowerCase()===(fk||'').toLowerCase()) || null;
  }

  // ===== SYNC all values to [data-save] inputs =====
/*function syncSaveFields() {
  // 1) Sumber nama/emel/sekolah/tingkatan dari state
  const name  = (state.profile?.name || state.auth?.name || '').trim();
  const email = (state.profile?.email || state.auth?.email || '').trim();
  const dob = state.profile?.dob || '';
  const school = state.profile?.school || '';
  const grade  = state.profile?.grade  || '';

  // 2) StudentID: guna input jika ada, jika tiada -> auto dari prefix email
  const studentIdEl = document.getElementById('studentId');
  const studentId = (studentIdEl?.value?.trim()) || (email.includes('@') ? email.split('@')[0] : '');

  // 3) Field/Pathway/Institution
  const fieldKey = state.profile?.field || '';
  const selectedFieldName = fieldKey ? (window.fieldsData?.[fieldKey]?.name || fieldKey) : '';
  const institution = fieldKey ? (window.fieldsData?.[fieldKey]?.institution || '') : '';
  const suitableFieldKey = state.careerQuiz?.result || '';
  const suitableFieldName = suitableFieldKey ? (window.fieldsData?.[suitableFieldKey]?.name || suitableFieldKey) : '';
  const pathway = state.pathway || '';

  // 4) Marks/Progress/Badges
  //    — guna pengiraan yang sedia anda guna di dashboard/learning
  let completed = 0, total = 11, marks = 0;
  completed += state.missions.s1.filter(Boolean).length;
  completed += state.missions.s2.filter(Boolean).length;
  if (state.missions.explorerCompleted) completed++;
  if (state.missions.fieldSelected)     completed++;
  if (state.missions.pathwaySelected)   completed++;
  if (state.missions.goalsSaved)        completed++;
  if (state.missions.cvBuilt)           completed++;

  marks += state.missions.s1.filter(Boolean).length * 10;
  marks += state.missions.s2.filter(Boolean).length * 10;
  if (state.missions.explorerCompleted) marks += 10;
  if (state.missions.fieldSelected)     marks += 5;
  if (state.missions.pathwaySelected)   marks += 5;
  if (state.missions.goalsSaved)        marks += 15;
  if (state.missions.cvBuilt)           marks += 25;

  const overallPct = Math.round((completed / total) * 100);

  const badges = {
    Beginner:     state.missions.s1.every(Boolean),
    Intermediate: state.missions.s2.every(Boolean),
    Advanced:     !!(state.missions.goalsSaved && state.missions.cvBuilt),
    Explorer:     !!state.missions.explorerCompleted
  };

  // 5) Isi ke semua elemen [data-save]
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
  set('studentId',        studentId);           // kalau anda guna input sebenar
  set('profileName',      name);
  set('profileEmail',     email);
  set('profileDob',       dob);
  set('profileSchool',    school);
  set('profileGrade',     grade);

  set('saveSuitableField', suitableFieldName);
  set('saveSelectedField', selectedFieldName);
  set('savePathway',       pathway);
  set('saveInstitution',   institution);
  set('saveOverall',       String(overallPct));
  set('saveTotalMarks',    String(marks));
  set('saveMissionDone',   `${completed}/${total}`);
  set('saveBadgesJson',    JSON.stringify(badges));
}*/

// PANGGIL fungsi ini selepas setiap perubahan penting
// Contoh tambahan satu baris di hujung fungsi sedia ada:
///  - register()       -> selepas saveState()
///  - saveProfile()    -> selepas saveState()
///  - selectField()    -> selepas saveState()
///  - selectPathway()  -> selepas saveState()
///  - submitCareerQuiz()-> selepas saveState()
///  - saveCV()         -> selepas saveState()

/*function syncSaveFields() {
  // 0) Helper
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
  const safeArr = a => Array.isArray(a) ? a : [];
  const title = s => (s||'').toString().replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

  // 1) Sumber asas
  const name   = (state?.profile?.name  || state?.auth?.name  || '').trim();
  const email  = (state?.profile?.email || state?.auth?.email || '').trim();
  const dob    = state?.profile?.dob    || '';
  const school = state?.profile?.school || '';
  const grade  = state?.profile?.grade  || '';

  const studentIdEl = document.getElementById('studentId');
  const studentId = (studentIdEl?.value?.trim()) || (email.includes('@') ? email.split('@')[0] : '');

  // 2) Field / SuitableField / Institution / Pathway
  const fieldKey           = state?.profile?.field || '';
  const suitableFieldKey   = state?.careerQuiz?.result || '';
  const selectedFieldName  = fieldKey && (window.fieldsData?.[fieldKey])
      ? (window.fieldsData[fieldKey].name || title(fieldKey)) : title(fieldKey);
  const suitableFieldName  = suitableFieldKey && (window.fieldsData?.[suitableFieldKey])
      ? (window.fieldsData[suitableFieldKey].name || title(suitableFieldKey)) : title(suitableFieldKey);
  const institution        = fieldKey && (window.fieldsData?.[fieldKey])
      ? (window.fieldsData[fieldKey].institution || '') : '';
  const pathway            = state?.pathway || '';

  // 3) Missions/marks/progress (semua guard)
  const s1 = safeArr(state?.missions?.s1);
  const s2 = safeArr(state?.missions?.s2);
  const m  = state?.missions || {};
  let completed = 0, total = 11, marks = 0;

  completed += s1.filter(Boolean).length;
  completed += s2.filter(Boolean).length;
  if (m.explorerCompleted) completed++;
  if (m.fieldSelected)     completed++;
  if (m.pathwaySelected)   completed++;
  if (m.goalsSaved)        completed++;
  if (m.cvBuilt)           completed++;

  marks += s1.filter(Boolean).length * 10;
  marks += s2.filter(Boolean).length * 10;
  if (m.explorerCompleted) marks += 10;
  if (m.fieldSelected)     marks += 5;
  if (m.pathwaySelected)   marks += 5;
  if (m.goalsSaved)        marks += 15;
  if (m.cvBuilt)           marks += 25;

  const overallPct = Math.round((completed / total) * 100);

  const badges = {
    Beginner:     s1.length === 3 && s1.every(Boolean),
    Intermediate: s2.length === 3 && s2.every(Boolean),
    Advanced:     !!(m.goalsSaved && m.cvBuilt),
    Explorer:     !!m.explorerCompleted
  };

  // 4) Isi ke hidden/input [data-save] jika ada
  set('studentId',        studentId);
  set('profileName',      name);
  set('profileEmail',     email);
  set('profileDob',       dob);
  set('profileSchool',    school);
  set('profileGrade',     grade);

  set('saveSuitableField', suitableFieldName || '-');
  set('saveSelectedField', selectedFieldName || '-');
  set('savePathway',       pathway || '-');
  set('saveInstitution',   institution || '-');
  set('saveOverall',       String(overallPct));
  set('saveTotalMarks',    String(marks));
  set('saveMissionDone',   `${completed}/${total}`);
  set('saveBadgesJson',    JSON.stringify(badges));
}*/

// ===== Isi nilai ke [data-save] untuk 8 medan Sheet =====



  // ---------- Nama segera (hero + header) ----------
  function paintName(){
    const nm = getName();
    const pn = document.getElementById('passportName');  if (pn) pn.textContent = nm;
    const hn = document.getElementById('headerRegName'); if (hn) hn.textContent = nm;
  }

  // ---------- Badges cepat (gambar + priority) ----------
  function renderBadges(){
    const grid = document.getElementById('badgeGrid'); if (!grid) return;
    grid.innerHTML = '';
    const earned = {
      beginner: !!(state?.missions?.s1 && state.missions.s1.every(Boolean)),
      intermediate: !!(state?.missions?.s2 && state.missions.s2.every(Boolean)),
      advanced: !!(state?.missions?.goalsSaved && state?.missions?.cvBuilt),
      explorer: !!state?.missions?.explorerCompleted
    };
    let count = 0;

    BADGES.forEach(b=>{
      const got = !!earned[b.key]; if (got) count++;
      const card = document.createElement('div');
      card.className = 'rounded-lg border p-3 text-center '+(got?'bg-green-50 border-green-200':'bg-gray-50 border-gray-200 opacity-70');

      if (b.src){
        const img = document.createElement('img');
        img.src = b.src; img.alt = b.label;
        img.loading = 'eager'; img.decoding = 'async';
        img.setAttribute('fetchpriority','high');
        img.referrerPolicy = 'no-referrer';
        img.width = 56; img.height = 56; // elak CLS
        img.className = 'mx-auto w-14 h-14 object-contain mb-1';
        if (!got) img.style.filter = 'grayscale(100%)';
        card.appendChild(img);
      } else {
        const ico=document.createElement('div'); ico.className='text-3xl mb-1'; ico.textContent='🧭';
        card.appendChild(ico);
      }

      const title=document.createElement('div'); title.className='text-sm font-medium'; title.textContent=b.label; card.appendChild(title);
      const status=document.createElement('div'); status.className='text-[11px] mt-1 '+(got?'text-green-700':'text-gray-500'); status.textContent=got?'Unlocked':'Locked'; card.appendChild(status);
      grid.appendChild(card);
    });

    const badgeText = document.getElementById('passportBadges');
    if (badgeText) badgeText.textContent = count + ' / 4';
  }

  // ---------- TVETMARA + Programs (isi segera bila data tersedia) ----------
  
function fillTVETPanelsAndPrograms(){
  const f = getFieldObj(); if (!f) return;

  // Selected field pill + label
  const fieldName = f.name || '-';
  const pill = document.getElementById('passportFieldPill');
  const sel = document.getElementById('passportSelectedField');
  if (pill) pill.textContent = fieldName || 'Field';
  if (sel)  sel.textContent  = fieldName;

  // Institutions
  const inst = document.getElementById('passportInstitutionList');
  if (inst){
    inst.innerHTML = '';
    (Array.isArray(f.institutions) ? f.institutions : (f.institution ? [f.institution] : []))
      .slice(0, 12)
      .forEach(x=>{
        const span = document.createElement('span');
        span.className = 'px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border';
        span.textContent = x;
        inst.appendChild(span);
      });
  }

  // Available Programs (fallback friendly)
  const list = document.getElementById('passportProgramsList');
  if (list){
    list.innerHTML = '';
    let progs = [].concat(
      f.programs || f.programmes || f.courses || f.courseList || f.program || []
    );

    if (!progs.length){
      const map = {
        'built environment': ['Diploma Teknologi Bangunan','Diploma Kejuruteraan Senibina','Diploma Pengurusan Fasiliti'],
        'biomedical': ['Diploma Teknologi Perubatan','Diploma Instrumentasi Bioperubatan']
      };
      const key = (fieldName||'').toLowerCase();
      for (const k in map){ if (key.includes(k)) { progs = map[k]; break; } }
    }

    if (!progs.length){
      const li = document.createElement('li');
      li.textContent = 'Tiada program disenaraikan untuk bidang ini buat masa ini.';
      li.className = 'text-gray-500';
      list.appendChild(li);
    } else {
      progs.slice(0, 20).forEach(p=>{
        const li = document.createElement('li'); li.textContent = p; list.appendChild(li);
      });
    }
  }
}

function ensurePassportMeta(){
  const idEl   = document.getElementById('passportIdValue');
  const dateEl = document.getElementById('passportIssuedValue');
  if (!idEl || !dateEl) return;

  // Kekal konsisten antara sesi
  let id = localStorage.getItem('passport_id');
  if (!id){
    const dt  = new Date();
    const ymd = dt.toISOString().slice(0,10).replace(/-/g,'');
    const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
    id = `NGP-${ymd}-${rnd}`;
    localStorage.setItem('passport_id', id);
  }
  idEl.textContent = id;

  // Tarikh ikut locale user
  dateEl.textContent = new Date().toLocaleDateString(undefined, {
    year:'numeric', month:'long', day:'numeric'
  });
}


function updatePassportSelectedPrograms(){
  // Ambil key field dari state jika ada
  let fieldKey = (window.state && window.state.profile && window.state.profile.field) || '';

  // Jika fieldKey kosong atau bukan key sebenar, cuba padankan ikut nama paparan (contoh: "Electrical")
  if ((!fieldKey || !(window.SenaraiTvetmaraProgram||{})[fieldKey]) && window.fieldsData){
    const wanted = (fieldKey || (document.getElementById('passportFieldName')?.textContent || '')).toString().trim().toLowerCase();
    if (wanted){
      const byName = Object.keys(window.fieldsData).find(k => ((window.fieldsData[k].name || '') + '').toLowerCase() === wanted);
      if (byName) fieldKey = byName;
    }
  }

  // Label “Selected Field”
  const label =
    (window.fieldsData && window.fieldsData[fieldKey] && window.fieldsData[fieldKey].name)
    || (fieldKey ? fieldKey.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : '-');

  // Kemaskini kedua-dua label: hero & "Selected Field"
  if (typeof setPassportFieldLabels === 'function') setPassportFieldLabels(label);
  else {
    const selEl = document.getElementById('passportSelectedField');
    if (selEl) selEl.textContent = label;
    const heroEl = document.getElementById('passportFieldName');
    if (heroEl) heroEl.textContent = label;
  }

  // Senarai program (guna data yang anda sediakan)
  const bank  = window.SenaraiTvetmaraProgram || {};
  const items = (fieldKey && bank[fieldKey]) ? bank[fieldKey] : [];

  const listEl = document.getElementById('passportPrograms');
  if (!listEl) return;

  if (!items.length){
    listEl.innerHTML = '<div class="text-gray-500">No programs available - select a field to view available programs</div>';
    return;
  }

  // Papar sebagai bullet line: "Institusi — Program"
  listEl.innerHTML = items
    .map(({institution, program}) => `<div>• ${institution} — ${program}</div>`)
    .join('');
}




/*function setPassportFieldLabels(fieldName){
  const ids = ['passportFieldName','passportSelectedField'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = (fieldName && String(fieldName).trim()) || '-'; });
}*/

function setPassportFieldLabels(fieldName){
  const ids = ['passportFieldName','passportSelectedField'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = (fieldName && String(fieldName).trim()) || '-'; });
}


  // ---------- Flow pantas ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    paintName();          // segera
    renderBadges();       // segera
    fieldsReady.then(fillTVETPanelsAndPrograms); // isi TVET & Programs sebaik data siap
    fieldsReady.then(updatePassportSelectedPrograms);
    ensurePassportMeta();
  });

  // Jika user bertukar ke Passport kemudian
  const P=document.getElementById('passport');
  if (P){
    const obs=new MutationObserver(()=>{ if (!P.classList.contains('hidden')) { paintName(); renderBadges(); fieldsReady.then(fillTVETPanelsAndPrograms);fieldsReady.then(updatePassportSelectedPrograms); ensurePassportMeta(); }});
    obs.observe(P,{attributes:true, attributeFilter:['class']});
  }

  // ---------- Service Worker (cache imej badges) ----------
  if ('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) {
    const swCode = `
      const CACHE='nextgen-passport-badges-v1';
      const ASSETS=[
        'https://i.postimg.cc/jSdYB8vC/3.png',
        'https://i.postimg.cc/Zn8hz21v/2.png',
        'https://i.postimg.cc/N0FY2NrZ/1.png'
      ];
      self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
      self.addEventListener('fetch',e=>{
        const url = e.request.url;
        if (ASSETS.includes(url)) {
          e.respondWith(
            caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
              const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); return res;
            }))
          );
        }
      });
    `;
    const blob = new Blob([swCode], {type:'text/javascript'});
    const swURL = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swURL).catch(()=>{});
  }
})();


/* --- Split by ChatGPT --- */


document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('#footerNav .footer-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const target = btn.getAttribute('data-target');
      navigateToScreen(target);
    });
  });
});

function showFooterMenu(show=true){
  const footer = document.getElementById('footerNav');
  if(!footer) return;
  if(show){
    footer.classList.remove('hidden');
    document.body.classList.add('has-footer');
  }else{
    footer.classList.add('hidden');
    document.body.classList.remove('has-footer');
  }
}

function navigateToScreen(targetId){
  const screenEl = document.getElementById(targetId);
  if(screenEl){
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    screenEl.classList.remove('hidden');
    markActiveFooter(targetId);
    showFooterMenu(true);
  }
}

function markActiveFooter(targetId){
  document.querySelectorAll('#footerNav .footer-link').forEach(b=>{
    b.removeAttribute('aria-current');
  });
  const active = document.querySelector(`#footerNav .footer-link[data-target="${targetId}"]`);
  if(active) active.setAttribute('aria-current','page');
}

function enableAppUIAfterLogin(){
  const cover = document.getElementById('cover');
  if(cover) cover.classList.add('hidden');
  navigateToScreen('dashboard');
  showFooterMenu(true);
}


/* --- Split by ChatGPT --- */


// === Footer auto-highlight integration with existing showScreen() ===
(function(){
  // Map any alias if needed (contoh: 'fields' vs 'field')
  const normalize = (id) => {
    if (id === 'field') return 'fields';
    return id;
  };

  // 1) Hook ke showScreen() sedia ada (tanpa pecahkan logic asal)
  const _origShowScreen = window.showScreen;
  window.showScreen = function(id){
    // Call asal
    if (typeof _origShowScreen === 'function') {
      _origShowScreen(id);
    } else {
      // fallback kalau tiada: hide/show .screen asas
      document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    }

    const norm = normalize(id);
    // 2) Update footer active state
    if (typeof markActiveFooter === 'function') {
      markActiveFooter(norm);
    }
    // 3) Tunjuk footer bila bukan di cover/login
    if (typeof showFooterMenu === 'function') {
      showFooterMenu(norm !== 'cover');
    }
  };

  // 2) On first load, jika ada screen yang sudah visible, sync highlight
  document.addEventListener('DOMContentLoaded', () => {
    const visible = Array.from(document.querySelectorAll('.screen'))
      .find(el => !el.classList.contains('hidden'));
    if (visible) {
      const id = normalize(visible.id);
      if (typeof markActiveFooter === 'function') markActiveFooter(id);
      if (typeof showFooterMenu === 'function') showFooterMenu(id !== 'cover');
    }
  });

  // 3) Fallback observer — kalau paparan tukar class di luar showScreen()
  const screens = document.querySelectorAll('.screen');
  if (screens.length) {
    const obs = new MutationObserver(() => {
      const visible = Array.from(document.querySelectorAll('.screen'))
        .find(el => !el.classList.contains('hidden'));
      if (visible) {
        const id = normalize(visible.id);
        if (typeof markActiveFooter === 'function') markActiveFooter(id);
        if (typeof showFooterMenu === 'function') showFooterMenu(id !== 'cover');
      }
    });
    screens.forEach(s => obs.observe(s, { attributes:true, attributeFilter:['class'] }));
  }
})();


/* --- Split by ChatGPT --- */


/* ========= LEARNING LOCKS: Section 1–3 =========
   – P1 sahaja unlock.
   – Inspire (Section 2) kunci sehingga Section 1 siap.
   – Section 3 kunci sehingga Section 2 siap.
   – Tidak sentuh tvetmaraPrograms / fieldsData.
=================================================*/
(function () {
  function ensureState() {
    window.state = window.state || {};
    state.missions = state.missions || { s1: [false, false, false], s2: [false, false, false] };
  }
  function isSectionComplete(sec) {
    ensureState();
    const arr = (state.missions && state.missions[sec]) || [];
    return arr.length && arr.every(Boolean);
  }
  function isMissionUnlocked(sec, i) {
    ensureState();
    if (sec === 's1') {
      if (i === 1) return true;             // Principle 1 sentiasa unlock
      return !!state.missions.s1[i - 2];     // P(i-1) mesti lulus
    }
    if (sec === 's2') {
      if (!isSectionComplete('s1')) return false; // Section 2 kunci hingga Section 1 siap
      if (i === 1) return true;                   // Inspire 1 buka bila Section 1 siap
      return !!state.missions.s2[i - 2];          // I(i-1) mesti lulus
    }
    return false;
  }

  /*function lockCard(card, locked, type) {
    if (!card) return;
    const btn = card.querySelector('button');
    if (!btn) return;
    // Kalau dah complete, biar disabled (jangan tukar tulisan)
    if (btn.textContent && btn.textContent.includes('Completed')) {
      btn.disabled = true;
      card.classList.remove('opacity-60');
      return;
    }
    btn.disabled = !!locked;
    if (locked) {
      btn.textContent = 'Locked 🔒';
      card.classList.add('opacity-60');
    } else {
      btn.textContent = type === 's1' ? 'Start Principle' : 'Start Inspire';
      card.classList.remove('opacity-60');
    }
  }*/

  /* --- ganti fungsi lockCard yang lama kepada ini --- */
function lockCard(card, locked, type) {
  if (!card) return;
  const btn = card.querySelector('button');
  if (!btn) return;

  // Pastikan overlay wujud sekali sahaja
  let overlay = card.querySelector('.lock-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'lock-overlay';
    overlay.innerHTML = '<div class="lock-chip">🔒 Locked</div>';
    card.appendChild(overlay);
  }

  // Jika mission sudah complete, jangan overlay dan disable butang sahaja
  const isCompleted = btn.textContent && btn.textContent.toLowerCase().includes('completed');
  if (isCompleted) {
    card.classList.remove('is-locked');
    btn.disabled = true;
    btn.classList.remove('hint');
    btn.removeAttribute('title');
    return;
  }

  // Toggle LOCK
  if (locked) {
    card.classList.add('is-locked');
    btn.disabled = true;
    // Biarkan label butang asal (“Start Principle/Start Inspire”) supaya konsisten UI
    btn.classList.add('hint');
    btn.title = 'Locked — lengkapkan misi sebelumnya dahulu.';
  } else {
    card.classList.remove('is-locked');
    btn.disabled = false;
    btn.classList.remove('hint');
    btn.removeAttribute('title');
    // Pulihkan teks butang
    if (type === 's1') btn.textContent = 'Start Principle';
    if (type === 's2') btn.textContent = 'Start Inspire';
  }
}

  function updateLearningLocks() {
    ensureState();
    // Section 1: Principles
    for (let i = 1; i <= 3; i++) {
      const card = document.querySelector(`[data-mission="s1m${i}"]`);
      if (!card) continue;
      const completed = !!state.missions.s1[i - 1];
      if (completed) { lockCard(card, false, 's1'); continue; }
      lockCard(card, !isMissionUnlocked('s1', i), 's1');
    }
    // Section 2: Inspires
    for (let i = 1; i <= 3; i++) {
      const card = document.querySelector(`[data-mission="s2m${i}"]`);
      if (!card) continue;
      const completed = !!state.missions.s2[i - 1];
      if (completed) { lockCard(card, false, 's2'); continue; }
      lockCard(card, !isMissionUnlocked('s2', i), 's2');
    }
    // Section 3: Goals & CV (kunci hingga Section 2 siap)
    const s3Locked = !isSectionComplete('s2');
    const goalsBtn = document.querySelector(`button[onclick*="showScreen('goals')"], button[onclick*="goals"]`);
    const cvBtn    = document.querySelector(`button[onclick*="cvbuilder"]`);
    if (goalsBtn) {
      if (goalsBtn.textContent.includes('Completed')) { goalsBtn.disabled = true; }
      else { goalsBtn.disabled = s3Locked; if (s3Locked) goalsBtn.textContent = 'Locked 🔒'; }
    }
    if (cvBtn) {
      if (cvBtn.textContent.includes('Completed')) { cvBtn.disabled = true; }
      else { cvBtn.disabled = s3Locked; if (s3Locked) cvBtn.textContent = 'Locked 🔒'; }
    }
  }

  // Guard masa klik "Start"
  if (typeof window.startMission === 'function') {
    const _origStart = window.startMission;
    window.startMission = function (section, mission) {
      if (!isMissionUnlocked(section, mission)) {
        alert('Locked. Sila lengkapkan misi sebelumnya dahulu.');
        return;
      }
      return _origStart(section, mission);
    };
  }

  // Pastikan setiap refresh skrin learning → locks dikemas kini
  if (typeof window.updateLearningScreen === 'function') {
    const _origUpdate = window.updateLearningScreen;
    window.updateLearningScreen = function () {
      const r = _origUpdate.apply(this, arguments);
      try { updateLearningLocks(); } catch (e) { /* noop */ }
      return r;
    };
  }

  // Run on load & bila masuk #learning
  document.addEventListener('DOMContentLoaded', updateLearningLocks);
  window.addEventListener('hashchange', () => {
    if (location.hash.includes('learning')) updateLearningLocks();
  });
})();


/* --- Split by ChatGPT --- */


/* ==== HARDEN updateLearningScreen + related ==== */
(function () {
  // Normalizer ringkas
  function normalizeState() {
    window.state = window.state || {};
    const s = window.state;

    s.profile = s.profile || {};
    s.profile.academic   = s.profile.academic   || { level:'', achievements:[] };
    s.profile.skills     = s.profile.skills     || [];
    s.profile.experience = s.profile.experience || [];

    s.career = s.career || { taken:false, field:'' };

    s.missions = s.missions || {};
    s.missions.s1 = Array.isArray(s.missions.s1) ? s.missions.s1 : [false,false,false];
    s.missions.s2 = Array.isArray(s.missions.s2) ? s.missions.s2 : [false,false,false];
    // flag yang anda gunakan untuk Choose Your Direction & CV
    if (typeof s.missions.fieldSelected   !== 'boolean') s.missions.fieldSelected   = !!s.profile.field;
    if (typeof s.missions.pathwaySelected !== 'boolean') s.missions.pathwaySelected = !!s.profile.pathway;
    if (typeof s.missions.cvBuilt         !== 'boolean') s.missions.cvBuilt         = false;

    s.section3 = s.section3 || { goals:false, cv:false };
    return s;
  }

  // Balut updateLearningScreen
  if (typeof window.updateLearningScreen === 'function') {
    const _orig = window.updateLearningScreen;
    window.updateLearningScreen = function () {
      normalizeState();
      return _orig.apply(this, arguments);
    };
  }

  // Pastikan submitCareerQuiz boleh set career.taken tanpa crash
  if (typeof window.submitCareerQuiz === 'function') {
    const _orig = window.submitCareerQuiz;
    window.submitCareerQuiz = function () {
      normalizeState();
      const out = _orig.apply(this, arguments);
      normalizeState();
      return out;
    };
  }

  // CV page juga baca profile.academic/skills/experience
  if (typeof window.loadCVBuilderPage === 'function') {
    const _orig = window.loadCVBuilderPage;
    window.loadCVBuilderPage = function () {
      normalizeState();
      return _orig.apply(this, arguments);
    };
  }

  // Panggil sekali masa load
  document.addEventListener('DOMContentLoaded', normalizeState);
})();


/* --- Split by ChatGPT --- */


(function(){
  // Dapatkan tajuk kad berdasarkan data-mission, contoh: s1m1/s2m3
  function getMissionTitle(section, mission){
    // Cuba baca terus daripada kad
    const sel = `[data-mission="${section}m${mission}"] h3, [data-mission="${section}m${mission}"] .mission-title`;
    const el  = document.querySelector(sel);
    if (el && el.textContent.trim()) return el.textContent.trim();

    // Fallback nama lalai
    const map = {
      s1: ['Principle 1','Principle 2','Principle 3'],
      s2: ['Inspire 1','Inspire 2','Inspire 3']
    };
    return (map[section] && map[section][(mission|0)-1]) || `${section.toUpperCase()} ${mission}`;
  }

  // Cuba kesan misi yang sedang aktif dari DOM (modal/quiz)
  function guessCurrentMission(){
    // Cari elemen yang menandakan misi aktif
    const active = document.querySelector('[data-mission].active, [data-quiz-open="1"], .quiz-modal [data-mission]');
    let section='s2', mission=1;
    if (active){
      const dm = active.getAttribute('data-mission'); // contoh "s2m1"
      const m  = dm && dm.match(/^s([12])m(\d)$/);
      if (m){ section = 's'+m[1]; mission = parseInt(m[2],10); }
    }
    return { section, mission };
  }

  // Intercept alert: bila mesej bermula "undefined completed!"
  const _alert = window.alert;
  window.alert = function(msg){
    try{
      if (typeof msg === 'string' && msg.startsWith('undefined completed!')) {
        const { section, mission } = guessCurrentMission();
        const title = getMissionTitle(section, mission);
        msg = msg.replace(/^undefined/, title);
      }
    }catch(e){}
    return _alert.call(window, msg);
  };
})();

    
    // === Reset All Student Data (for testing/admin) ===
    function resetProfile() {
        try {
            // Reset in-memory state
            if (typeof state === 'object' && state !== null) {
                state.profile = {};
                state.cv = {};
                state.missions = {};
                state.chooseDirection = {};
            } else {
                // If state not initialized, create a fresh one
                state = { profile:{}, cv:{}, missions:{}, chooseDirection:{} };
            }

            // Clear localStorage snapshot if used
            try { localStorage.removeItem('state'); } catch(e) {}

            // Refresh key UI sections if helper functions exist
            try { if (typeof updateProfileUI === 'function') updateProfileUI(); } catch(e) {}
            try { if (typeof updatePassport === 'function') updatePassport(); } catch(e) {}
            try { if (typeof updateLearning === 'function') updateLearning(); } catch(e) {}
            try { if (typeof renderLockedOverlays === 'function') renderLockedOverlays(); } catch(e) {}

            alert("Semua data pelajar telah direset. Sila mula semula dari skrin Profile.");
        } catch (err) {
            console.error('Reset error:', err);
            alert('Ralat semasa reset. Sila semak Console.');
        }
    }
    

/* --- Split by ChatGPT --- */


(function(){
  // Helper: query param
  function getQueryParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  // ===== Public API wrappers =====
  window.GAS = {
    register: (payload) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).registerUser(payload)
    ),
    login: (email, studentId) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).loginUser(email, studentId)
    ),
    upsertProfile: (payload) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).upsertProfile(payload)
    ),
    saveState: (email, state, rollup) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).saveState(email, state, rollup || {})
    ),
    log: (email, action, details) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).logEvent(email, action, details || {})
    ),
    adminReset: (email, adminPass) => new Promise((res, rej) =>
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).adminReset(email, adminPass)
    ),
  };

  // ===== Example hooks (adjust to your form IDs) =====
  window.handleRegisterSubmit = async function(e){
    e?.preventDefault?.();
    const payload = {
      email: document.querySelector('#regEmail')?.value?.trim(),
      studentId: document.querySelector('#regStudentID')?.value?.trim(),
      studentName: document.querySelector('#regName')?.value?.trim(),
      school: document.querySelector('#regSchool')?.value?.trim(),
      gradeLevel: document.querySelector('#regGrade')?.value?.trim()
    };
    const r = await GAS.register(payload);
    if (!r?.ok) { alert(r?.msg || 'Pendaftaran gagal'); return; }
    alert('Pendaftaran berjaya! Sila login.');
  };

  window.handleLoginSubmit = async function(e){
    e?.preventDefault?.();
    const email = document.querySelector('#loginEmail')?.value?.trim();
    const studentId = document.querySelector('#loginStudentID')?.value?.trim();
    const r = await GAS.login(email, studentId);
    if (!r?.ok) { alert(r?.msg || 'Login gagal'); return; }
    try {
      const serverState = r.user?.StateJSON ? JSON.parse(r.user.StateJSON) : {};
      window.state = Object.assign({ profile:{}, cv:{}, missions:{}, chooseDirection:{} }, serverState);
    } catch(_) {}
    if (!window.state.profile) window.state.profile = {};
    window.state.profile.email = r.user.Email;
    window.state.profile.name = r.user.StudentName;

    if (typeof updateProfileUI === 'function') updateProfileUI();
    if (typeof updatePassport === 'function') updatePassport();
    if (typeof updateLearning === 'function') updateLearning();

    await GAS.log(email, 'login_success', {timestamp: Date.now()});
    alert('Login berjaya.');
  };

  window.saveProfileToSheet = async function(profile){
    const r = await GAS.upsertProfile({
      email: profile.email,
      studentId: profile.studentId,
      studentName: profile.name,
      school: profile.school,
      gradeLevel: profile.gradeLevel,
      suitableField: window.state?.career?.suitableField || window.state?.profile?.suitableField,
      selectedField: window.state?.profile?.field,
      pathway: window.state?.profile?.pathway,
      tvetmaraInstitution: window.state?.profile?.institution,
      overallProgress: window.state?.progress?.overall || 0,
      totalMarks: window.state?.progress?.totalMarks || 0,
      missionComplete: window.state?.progress?.missionComplete ? 'Y' : 'N',
      earnedBadges: (window.state?.badges || []).join(','),
      stateJSON: JSON.stringify(window.state || {})
    });
    if (!r?.ok) { alert(r?.msg || 'Gagal simpan profil'); return; }
    await GAS.log(profile.email, 'profile_saved', {profile});
  };

  window.saveAppStateRollup = async function(email){
    const rollup = {
      overallProgress: window.state?.progress?.overall || 0,
      totalMarks: window.state?.progress?.totalMarks || 0,
      missionComplete: window.state?.progress?.missionComplete ? 'Y' : 'N',
      earnedBadges: (window.state?.badges || []).join(',')
    };
    const r = await GAS.saveState(email, window.state || {}, rollup);
    if (!r?.ok) console.warn('saveState gagal', r);
  };

  // ===== Optional minimal Admin Panel (only if ?admin=1) =====
  if (getQueryParam('admin') === '1') {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;background:#111;color:#fff;padding:12px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.25);font:14px/1.4 system-ui,Arial';
    panel.innerHTML = [
      '<div style="font-weight:700;margin-bottom:8px;">Admin Tools</div>',
      '<input id="admEmail" placeholder="Email pelajar" style="display:block;width:260px;margin:4px 0;padding:8px;border-radius:8px;border:1px solid #444;background:#222;color:#fff;" />',
      '<input id="admPass" placeholder="Admin Pass" type="password" style="display:block;width:260px;margin:4px 0;padding:8px;border-radius:8px;border:1px solid #444;background:#222;color:#fff;" />',
      '<button id="admResetBtn" style="margin-top:6px;padding:8px 12px;border:0;border-radius:10px;background:#e53935;color:#fff;cursor:pointer;">Reset Server (Users+Logs)</button>'
    ].join('');
    document.body.appendChild(panel);
    panel.querySelector('#admResetBtn').onclick = async () => {
      const email = panel.querySelector('#admEmail').value.trim();
      const pass = panel.querySelector('#admPass').value;
      if (!email || !pass) { alert('Isi email dan admin pass.'); return; }
      const r = await GAS.adminReset(email, pass);
      if (!r?.ok) { alert(r?.msg || 'Admin reset gagal'); return; }
      alert('Admin reset berjaya untuk: ' + email);
    };
  }
})();
// ====== GAS Integration (Save to Google Sheet) ======
(function(){
  if (typeof window.showToast !== "function") {
    window.showToast = function(msg, timeout=2500){
      try {
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;right:20px;bottom:20px;background:#111;color:#fff;padding:12px 16px;border-radius:10px;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.25);font-family:system-ui,Segoe UI,Arial,sans-serif;';
        document.body.appendChild(t);
        setTimeout(()=>t.remove(), timeout);
      } catch(e){ alert(msg); }
    };
  }

  //KENA SEMAK BALIK CODE KAT BAWAH NI. KEMUNGKINANAN MENGGANGGU CODE.GS
  //Ganti sementara nak cuba

  window.onSaveToSheet = async function(){
    try {
      const payload = window.buildStudentPayload();
      if (!window.GAS_CONFIG || !GAS_CONFIG.endpoint || GAS_CONFIG.endpoint.includes("PUT_YOUR_GAS_WEB_APP_URL_HERE")) {
        throw new Error("GAS endpoint is not set. Edit assets/js/config.js");
      }
      const res = await fetch(GAS_CONFIG.endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let json = {}; try { json = JSON.parse(text); } catch(e){}
      if (!res.ok || !json.ok) throw new Error(json.error || ("HTTP " + res.status + " " + text.slice(0,180)));
      showToast("Saved to Google Sheet");
      console.log("GAS save OK:", json);
    } catch (err) {
      console.error("GAS save error:", err);
      alert("Save error: " + (err && err.message ? err.message : String(err)));
    }
  };


  

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("save-to-sheet-btn");
    if (btn) btn.addEventListener("click", window.onSaveToSheet);
  });
})();

/* === TVETMARA PATCH: DOM-first pathway/field + reliable payload === */
(function () {
  'use strict';

  // --- Normalizers & helpers ---
  const PATHWAY_ALIAS = {
    academic:'academic', akademik:'academic',
    career:'career', kerjaya:'career', industry:'career', industri:'career',
    entrepreneur:'entrepreneur', entrepreneurship:'entrepreneur', usahawan:'entrepreneur', business:'entrepreneur', bisnes:'entrepreneur'
  };
  const FIELD_ALIAS = {
    electronics:'electronics', electronic:'electronics', elektronik:'electronics',
    electrical:'electrical', elektrik:'electrical',
    iot:'iot-robotics', robotics:'iot-robotics', automation:'iot-robotics',
    manufacturing:'manufacturing', pembuatan:'manufacturing'
  };
  const slug = s => (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const norm = (s,map)=>{ const g=slug(s); if(map[g]) return map[g]; for(const k of Object.keys(map)){ if(g.includes(k)) return map[k]; } return g||''; };
  const text = sel => (document.querySelector(sel)?.textContent || '').trim();
  const val  = sel => (document.querySelector(sel)?.value || '').trim();

  // --- Listeners: update state bila pilih pathway/field ---
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-pathway]');
    if (!el) return;
    const key = norm(el.dataset.pathway || el.dataset.key || el.getAttribute('data-pathway-key') || el.textContent, PATHWAY_ALIAS);
    window.state = window.state || {};
    state.profile = Object.assign({}, state.profile, { pathway: key });
    try { localStorage.setItem('nextgen_state', JSON.stringify(state)); } catch (_){}
    document.querySelectorAll('[data-pathway]').forEach(x => x.classList.toggle('selected', x === el));
    window.showToast && showToast('Pathway selected: ' + key);
  });

  document.addEventListener('change', (e) => {
    const r = e.target;
    if (r && r.name === 'pathway') {
      const key = norm(r.value, PATHWAY_ALIAS);
      window.state = window.state || {};
      state.profile = Object.assign({}, state.profile, { pathway: key });
      try { localStorage.setItem('nextgen_state', JSON.stringify(state)); } catch (_){}
      window.showToast && showToast('Pathway selected: ' + key);
    }
    if (r && r.name === 'field') {
      const key = norm(r.value, FIELD_ALIAS);
      window.state = window.state || {};
      state.profile = Object.assign({}, state.profile, { field: key });
      try { localStorage.setItem('nextgen_state', JSON.stringify(state)); } catch (_){}
      window.showToast && showToast('Field selected: ' + key);
    }
  });

  // --- DOM-first readers ---
  function detectPathwayDOM() {
    const r = document.querySelector('input[name="pathway"]:checked');
    if (r?.value) return norm(r.value, PATHWAY_ALIAS);
    const el = document.querySelector('[data-pathway].selected, [data-pathway].active, [data-pathway][aria-pressed="true"]');
    if (el) return norm(el.dataset.pathway || el.dataset.key || el.getAttribute('data-pathway-key') || el.textContent, PATHWAY_ALIAS);
    return norm(text('#selectedPathway') || text('[data-current-pathway]') || text('#pathway'), PATHWAY_ALIAS);
  }
  function detectFieldDOM() {
    const r = document.querySelector('input[name="field"]:checked');
    if (r?.value) return norm(r.value, FIELD_ALIAS);
    const el = document.querySelector('[data-field].selected, [data-field].active, [data-field][aria-pressed="true"]');
    if (el) return norm(el.dataset.field || el.dataset.key || el.getAttribute('data-field-key') || el.textContent, FIELD_ALIAS);
    return norm(text('#selected-field') || text('[data-current-field]'), FIELD_ALIAS);
  }

  // --- Metrics readers ---
  function countCompleted(m) {
    try {
      if (typeof m?.completedCount === 'number') return m.completedCount;
      let c = 0;
      for (const v of Object.values(m || {})) {
        if (Array.isArray(v)) c += v.filter(x => x === true || (x && (x.passed === true || x.completed === true || x.status === 'passed'))).length;
      }
      return c;
    } catch (_){ return 0; }
  }
  function overall(p, m) {
    if (typeof p?.overall === 'number') return p.overall;
    const total = (m && m.total) ? m.total : Object.values(m || {}).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0);
    const done = countCompleted(m);
    if (total > 0) return Math.round((done / total) * 100);
    const el = document.querySelector('[data-overall-progress], #overallProgress, progress[role="progressbar"]');
    if (el) {
      const raw = el.getAttribute('data-overall-progress') || el.getAttribute('value') || text('#overallProgress');
      const n = Number(String(raw).replace(/[^\d.]/g, ''));
      if (!isNaN(n)) return n;
    }
    return 0;
  }
  function totalMarks(sc) {
    if (typeof sc?.total === 'number') return sc.total;
    const raw = text('#totalMarks, .total-marks, [data-total-marks]');
    const n = Number(String(raw).replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function readBadgesFromDOM() {
    // Ambil id lencana dari DOM jika wujud
    const nodes = document.querySelectorAll('[data-badge-earned="true"], .badge.earned');
    return Array.from(nodes).map((el, i) => el.getAttribute('data-badge-id') || el.id || `badge-${i+1}`);
  }

  /* ========= AUTO FORM COLLECTOR ========= */
  function collectFormData(root = document) {
    const out = {};
    const add = (key, val) => {
      if (!key) return;
      if (out.hasOwnProperty(key)) {
        if (Array.isArray(out[key])) out[key].push(val);
        else out[key] = [out[key], val];
      } else out[key] = val;
    };
    const fields = root.querySelectorAll('input, select, textarea, [contenteditable][data-save]');
    fields.forEach(el => {
      if (el.matches('[data-nosave]')) return;
      if (el.type === 'hidden') return;
      const key = el.dataset.save || el.name || el.id || '';
      if (!key) return;

      if (el.matches('[contenteditable]')) { add(key, el.innerText.trim()); return; }
      if (el.tagName === 'SELECT') {
        if (el.multiple) add(key, Array.from(el.selectedOptions).map(o => o.value));
        else add(key, el.value);
        return;
      }
      if (el.type === 'checkbox') {
        if (el.name) { if (el.checked) add(key, el.value || true); }
        else add(key, !!el.checked);
        return;
      }
      if (el.type === 'radio') { if (el.checked) add(key, el.value); return; }
      add(key, (el.value ?? '').trim());
    });
    return out;
  }
  function mergeSmart(target, extra) {
    for (const [k, v] of Object.entries(extra)) {
      const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
      if (!empty && (target[k] === undefined || target[k] === '')) target[k] = v;
    }
    return target;
  }

  // --- Build payload (DOM-first + fallbacks) ---
  window.buildStudentPayload = function () {
    try {
      if (!window.state || !Object.keys(window.state).length) {
        const saved = localStorage.getItem('nextgen_state');
        if (saved) window.state = JSON.parse(saved);
      }
    } catch (_){}

    const s = window.state || {};
    const prof = s.profile || {};
    const car  = s.career || {};
    const pass = s.passport || {};
    const prog = s.progress || {};
    const sc   = s.scores || {};
    const mis  = s.missions || {};
    const badgesState = s.badges || {};

    const pathway = detectPathwayDOM() || norm(prof.pathway, PATHWAY_ALIAS);
    const field   = detectFieldDOM()   || norm(prof.field, FIELD_ALIAS);

    const payload = {
      token: (window.GAS_CONFIG && GAS_CONFIG.token) || '',
      // asas
      studentId:  (prof.studentId || prof.id || val('#studentId') || ''),
      name:       (prof.name || val('#cvFullName') || ''),
      email:      (prof.email || val('#cvEmail') || ''),
      school:     (prof.school || val('#school') || ''),
      gradeLevel: (prof.grade || prof.gradeLevel || val('#gradeLevel') || ''),
      // pilihan & institusi
      suitableField: (car.suitableField || ''),
      selectedField: field,
      pathway: pathway,
      institution: (pass.institution || val('#institution') || ''),
      // metrik
      overallProgress: Number(overall(prog, mis) || 0),
      totalMarks:      Number(totalMarks(sc) || 0),
      missionComplete: Number(countCompleted(mis) || 0),
    };

    // earnedBadges: DOM → state
    let earnedBadges = readBadgesFromDOM();
    if (!earnedBadges.length) {
      if (Array.isArray(badgesState?.earned)) earnedBadges = badgesState.earned;
      else if (Array.isArray(badgesState)) earnedBadges = badgesState;
      else if (badgesState && typeof badgesState === 'object') {
        earnedBadges = Object.keys(badgesState).filter(k => !!badgesState[k]);
      }
    }
    payload.earnedBadges = earnedBadges;

    // Auto-collect semua input & gabung (tanpa overwrite nilai yang sudah ada)
    const extra = collectFormData(document);
    mergeSmart(payload, extra);
    payload.form = extra; // rujukan

    console.log('[PAYLOAD]', payload);
    return payload;
  };
})();


// === GOOGLE SHEET SAVE (GAS) ===
// Build payload and send to Google Apps Script endpoint defined in config.js
function computeProgressAndMarks(){
  try {
    let completedMissions = 0;
    completedMissions += (state.missions?.s1||[]).filter(Boolean).length;
    completedMissions += (state.missions?.s2||[]).filter(Boolean).length;
    if (state.missions?.explorerCompleted) completedMissions++;
    if (state.missions?.fieldSelected) completedMissions++;
    if (state.missions?.pathwaySelected) completedMissions++;
    if (state.missions?.goalsSaved) completedMissions++;
    if (state.missions?.cvBuilt) completedMissions++;

    let totalMarks = 0;
    totalMarks += (state.missions?.s1||[]).filter(Boolean).length * 10;
    totalMarks += (state.missions?.s2||[]).filter(Boolean).length * 10;
    if (state.missions?.explorerCompleted) totalMarks += 10;
    if (state.missions?.fieldSelected) totalMarks += 5;
    if (state.missions?.pathwaySelected) totalMarks += 5;
    if (state.missions?.goalsSaved) totalMarks += 15;
    if (state.missions?.cvBuilt) totalMarks += 25;

    const totalTasks = 11; // selari dengan updateLearningProgress
    let completedTasks = (state.missions?.s1||[]).filter(Boolean).length + (state.missions?.s2||[]).filter(Boolean).length;
    if (state.missions?.explorerCompleted) completedTasks++;
    if (state.missions?.fieldSelected) completedTasks++;
    if (state.missions?.pathwaySelected) completedTasks++;
    if (state.missions?.goalsSaved) completedTasks++;
    if (state.missions?.cvBuilt) completedTasks++;
    const overallProgress = Math.round((completedTasks/totalTasks)*100);

    const earnedBadges = [];
    if ((state.missions?.s1||[]).length===3 && state.missions.s1.every(Boolean)) earnedBadges.push('Beginner');
    if ((state.missions?.s2||[]).length===3 && state.missions.s2.every(Boolean)) earnedBadges.push('Intermediate');
    if (state.missions?.goalsSaved && state.missions?.cvBuilt) earnedBadges.push('Advanced');
    if (state.missions?.explorerCompleted) earnedBadges.push('Explorer');

    const missionComplete = `s1:${(state.missions?.s1||[]).filter(Boolean).length}/3,s2:${(state.missions?.s2||[]).filter(Boolean).length}/3,goals:${state.missions?.goalsSaved?1:0},cv:${state.missions?.cvBuilt?1:0},explorer:${state.missions?.explorerCompleted?1:0}`;

    return { overallProgress, totalMarks, missionComplete, earnedBadges };
  } catch (e) {
    return { overallProgress: 0, totalMarks: 0, missionComplete: '', earnedBadges: [] };
  }
}

function buildPassportRow(){
  const email = (state.profile?.email||'').trim();
  const studentId = (state.profile?.studentId) || (email.includes('@') ? email.split('@')[0] : '');
  const name = state.profile?.name || '';
  const school = state.profile?.school || '';
  const grade = state.profile?.grade || '';
  const selectedFieldKey = state.profile?.field || '';
  const selectedFieldName = (window.fieldsData && selectedFieldKey && window.fieldsData[selectedFieldKey]) ? window.fieldsData[selectedFieldKey].name : selectedFieldKey;
  const pathway = state.pathway || '';
  const suitableFieldKey = state.careerQuiz?.result || '';
  const suitableFieldName = (window.fieldsData && suitableFieldKey && window.fieldsData[suitableFieldKey]) ? window.fieldsData[suitableFieldKey].name : suitableFieldKey;
  const institution = (selectedFieldKey && window.fieldsData && window.fieldsData[selectedFieldKey]) ? (window.fieldsData[selectedFieldKey].institution||'') : '';

  const m = computeProgressAndMarks();

  return {
    Timestamp: new Date().toISOString(), // boleh guna di client; atau biar GAS guna server time
    StudentID: studentId,
    Name: name,
    Email: email,
    School: school,
    GradeLevel: grade,
    SuitableField: suitableFieldName || '-',
    SelectedField: selectedFieldName || '-',
    Pathway: pathway || '-',
    Institution: institution || '-',
    OverallProgress: m.overallProgress,
    TotalMarks: m.totalMarks,
    MissionComplete: m.missionComplete,
    EarnedBadgesJson: JSON.stringify(m.earnedBadges)
  };
}

async function saveToGoogleSheet(customRow){
  const row = customRow || buildPassportRow();
  const cfg = (window.GAS_CONFIG || {});
  if (!cfg.endpoint) { alert('GAS endpoint not configured.'); return; }
  try {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cfg.token||'', action: 'savePassport', data: row })
    });
    const data = await res.json().catch(()=>({ ok:false, message:'Invalid JSON' }));
    if (res.ok && (data.ok || data.status==='ok')) {
      alert('Saved to Google Sheet ✅');
    } else {
      alert('Save failed ❌: ' + (data.message || res.statusText));
    }
  } catch (e) {
    alert('Save error ❌: ' + (e && e.message ? e.message : e));
  }
}

// Auto-inject a "Save to My Passport" button on the #passport screen if missing
function ensurePassportSaveButton(){
  const passport = document.getElementById('passport');
  if (!passport) return;
  const mainCard = passport.querySelector('.bg-white.rounded-lg.shadow-lg.p-8');
  if (!mainCard) return;
  if (mainCard.querySelector('#saveToSheetBtn')) return; // already exists
  const btn = document.createElement('button');
  btn.id = 'saveToSheetBtn';
  btn.className = 'mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold';
  btn.textContent = 'Save to My Passport';
  btn.addEventListener('click', function(){ saveToGoogleSheet(); });
  mainCard.appendChild(btn);
}

function collectSaveData() {
  const data = {};
  document.querySelectorAll('[data-save]').forEach(el => {
    const key = el.getAttribute('data-save');
    const val = (el.type === 'checkbox') ? (el.checked ? 'TRUE' : 'FALSE') : (el.value ?? el.textContent ?? '');
    data[key] = val;
  });
  return data;
}

/*async function sendToSheet() {
  try {
    syncSaveFields(); // pastikan latest
    const payload = {
      token:  window.GAS_CONFIG?.token,
      action: 'savePassport',
      data:   collectSaveData()
    };
    const res = await fetch(window.GAS_CONFIG?.endpoint, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || 'Failed to save');
    alert('Saved to Google Sheet!');
  } catch (e) {
    alert('Save error: ' + e.message);
  }
}*/

async function sendToSheet(){
  // 0) Pastikan nilai hidden terisi
  try { if (typeof window.syncSaveFields === 'function') window.syncSaveFields(); } catch(e){ console.warn('syncSaveFields:', e); }

  // 1) Semak config
  const { endpoint, token } = window.GAS_CONFIG || {};
  if (!endpoint) throw new Error('GAS endpoint not set (config.js)');
  if (!token)    throw new Error('GAS token not set (config.js)');

  // 2) Kumpul semua [data-save]
  const data = {};
  document.querySelectorAll('[data-save]').forEach(el=>{
    const key = el.dataset.save;
    const val = el.type==='checkbox' ? String(el.checked) : (el.value ?? '');
    data[key] = val;
  });

  // 3) Hantar ke GAS — biar Content-Type default (text/plain) untuk elak preflight
  const payload = { token, action:'savePassport', data };
  console.log('[GAS] sending ->', endpoint, payload);

  const res  = await fetch(endpoint, { method:'POST', body: JSON.stringify(payload), redirect:'follow' });
  const text = await res.text();                // log teks mentah utk debug
  console.log('[GAS] status', res.status, text);

  // Cuba parse jika JSON
  let json = {};
  try { json = JSON.parse(text); } catch(_){}
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || ('HTTP '+res.status));
  }

  alert('Saved to Google Sheet ✅');
}


/*function sendToSheetSafe(){
  try { syncSaveFields(); } catch(e) { console.warn('syncSaveFields failed', e); }
  // elak hantar kalau endpoint tak diisi
  if (!window.GAS_CONFIG?.endpoint) {
    alert('GAS endpoint is not set (config.js).');
    return;
  }
  try { sendToSheet(); } catch (e) { console.error(e); alert('Save error: ' + e.message); }
}*/

//TUTUP KEJAP SEBAB NAK TEST YANG BARU KAT BAWAH TU

function sendToSheetSafe(){
  try {
    if (typeof window.syncSaveFields === 'function') {
      window.syncSaveFields();            // isi hidden inputs
    } else {
      console.warn('syncSaveFields missing; proceed without it');
    }
  } catch (e) {
    console.warn('syncSaveFields failed:', e);
  }

  try {
    return sendToSheet();                 // fungsi hantar ke GAS yang sedia ada
  } catch (e) {
    alert('Save error: ' + (e.message || e));
  }
}

/*function sendToSheetSafe(){
  return sendToSheet().catch(e => {
    console.error(e);
    alert('Save error: ' + (e.message || e));
  });
}*/




function updateHeaderName() {
  const nm = (state.profile?.name || state.auth?.name || '').trim()
           || (state.profile?.email?.split('@')[0] || '');
  const el = document.getElementById('headerRegName');
  if (el) el.textContent = nm || '-';
}

// Panggilan disyorkan:
/// - di akhir register()
/// - di akhir login()
/// - di akhir saveProfile()
/// - dalam init() / updateUI()


// === Auto save snapshot to Google Sheet (cooldown 2s) ===
/*let __sheetCooldownUntil = 0;
function autoSaveToSheet(reason){
  const now = Date.now();
  if (now < __sheetCooldownUntil) return;      // throttle supaya tak spam baris
  __sheetCooldownUntil = now + 2000;

  try { saveState && saveState(); } catch(_) {}
  try { typeof syncSaveFields === 'function' && syncSaveFields(); } catch(e){ console.warn('syncSaveFields', e); }

  // guna fungsi hantar yang sedia ada
  try { 
    if (typeof sendToSheetSafe === 'function') return sendToSheetSafe();
    if (typeof sendToSheet === 'function')     return sendToSheet();
  } catch(e){
    console.warn('sendToSheet failed', e);
  }
}
window.autoSaveToSheet = autoSaveToSheet;
*/


// === Auto save snapshot setiap kali saveState() menukar perkara penting ===
/*(function(){
  // pastikan util hantar wujud
  function autoSaveToSheet(){
    const now = Date.now();
    if (autoSaveToSheet._until && now < autoSaveToSheet._until) return;
    autoSaveToSheet._until = now + 2000; // cooldown 2s

    try { typeof window.syncSaveFields === 'function' && window.syncSaveFields(); } catch(e){ console.warn('syncSaveFields', e); }

    const send = window.sendToSheetSafe || window.sendToSheet;
    if (typeof send === 'function') {
      try { send(); } catch (e) { console.warn('sendToSheet failed', e); }
    } else {
      console.warn('sendToSheet function not found');
    }
  }
  window.autoSaveToSheet = autoSaveToSheet;

  // fungsi ringkas untuk mengekstrak “jejak perubahan”
  function snapshotKey(){
    const s = window.state || {};
    const m = (s.missions || {});
    const s1 = Array.isArray(m.s1) ? m.s1.join('') : '';
    const s2 = Array.isArray(m.s2) ? m.s2.join('') : '';
    return JSON.stringify({
      fld:  s.profile && s.profile.field || '',
      pth:  s.pathway || '',
      s1, s2,
      g:    !!m.goalsSaved,
      cv:   !!m.cvBuilt,
      ex:   !!m.explorerCompleted,
      cvh:  JSON.stringify(s.cv || {})      // bila CV berubah
    });
  }

  // balut saveState sekali sahaja
  if (!window.__saveStateWrapped && typeof window.saveState === 'function') {
    window.__saveStateWrapped = true;
    const orig = window.saveState;
    let last = '';
    window.saveState = function(){
      const out = orig.apply(this, arguments);  // jalankan simpanan asal
      try {
        const cur = snapshotKey();
        if (cur !== last) {                     // hanya bila benar-benar berubah
          last = cur;
          setTimeout(autoSaveToSheet, 0);       // auto-save (async, tak block UI)
        }
      } catch(e){ console.warn('autosave hook', e); }
      return out;
    };
    console.log('[AUTO] saveState wrapped for autosave');
  } else {
    console.warn('[AUTO] saveState not found or already wrapped');
  }
})();*/

// === Auto save setiap kali saveState dipanggil (cooldown + snapshot) ===
(function wrapSaveStateOnce(){
  function ready(fn){                 // cuba wrap sekarang; jika belum, cuba lagi
    if (typeof window.saveState === 'function') return fn();
    setTimeout(()=>ready(fn), 0);
  }
  ready(function(){
    if (window.__saveStateWrapped) return;
    window.__saveStateWrapped = true;

    const orig = window.saveState;
    let last = '';                   // untuk detect perubahan bermakna
    let until = 0;                   // throttle 2s

    function snapshotKey(){
      const s = window.state || {};
      const m = s.missions || {};
      const s1 = Array.isArray(m.s1) ? m.s1.join('') : '';
      const s2 = Array.isArray(m.s2) ? m.s2.join('') : '';
      return JSON.stringify({
        fld:  s.profile && s.profile.field || '',
        pth:  s.pathway || '',
        s1, s2,
        g:    !!m.goalsSaved,
        cv:   !!m.cvBuilt,
        ex:   !!m.explorerCompleted,
        cvh:  JSON.stringify(s.cv || {})
      });
    }

    window.saveState = function(){
      const out = orig.apply(this, arguments);

      /*try {
        const now = Date.now();
        const snap = snapshotKey();
        if (snap !== last && now >= until) {
          last = snap;
          until = now + 2000; // cooldown 2s
          try { if (typeof window.syncSaveFields === 'function') window.syncSaveFields(); } catch(e){ console.warn('syncSaveFields:', e); }
          const send = window.sendToSheetSafe || window.sendToSheet;
          if (typeof send === 'function') setTimeout(()=>{ try { send(); } catch(e){ console.warn(e); } }, 0);
          else console.warn('sendToSheet function not found');
        }
      } catch (e) { console.warn('autosave hook:', e); }*/

      // di dalam window.saveState = function(){ ... } (wrapper autosave)
      try {
        const now = Date.now();
        const snap = snapshotKey();
        if (snap !== last && now >= until) {
          // >>> GUARD: skip bila logout / tak login / tiada email
          if (window.__noSheet) return;
          if (!state?.auth?.isLoggedIn) return;
          const emailNow = state?.profile?.email || state?.auth?.email || '';
          if (!emailNow) return;

          last = snap;
          until = now + 2000; // cooldown
          try { typeof window.syncSaveFields==='function' && window.syncSaveFields(); } catch(e){}
          const send = window.sendToSheetSafe || window.sendToSheet;
          if (typeof send === 'function') setTimeout(()=>{ try{ send(); }catch(e){} },0);
        }
      } catch(e) { /* ... */ }


      return out;
    };

    console.log('[AUTO] saveState wrapped for autosave');
  });
})();

