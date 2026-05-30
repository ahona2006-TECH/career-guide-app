// ========== XRPL CONFIGURATION ==========
const XRPL_CONFIG = {
    testnet_url: 'wss://s.altnet.rippletest.net:51233',
    explorer_url: 'https://testnet.xrpl.org/transactions/'
};

// Connected wallet address (yours)
const WALLET_ADDRESS = 'rJ4aFjKpK8WjG3mzkYyuTmSfX3jSfDWYjJ';

// Function to connect to XRPL Testnet
async function connectXRPL() {
    try {
        const client = new xrpl.Client(XRPL_CONFIG.testnet_url);
        await client.connect();
        console.log('✅ Connected to XRPL Testnet');
        return client;
    } catch (error) {
        console.error('❌ XRPL Connection Error:', error);
        alert('Failed to connect to XRPL. Check console.');
        return null;
    }
}

// Function to create a credential memo (what gets stored on blockchain)
function createCredentialMemo(credentialData) {
    const memo = {
        Memo: {
            MemoData: xrpl.convertStringToHex(JSON.stringify({
                passport_id: credentialData.passportId,
                timestamp: new Date().toISOString(),
                credentials: {
                    roadmap_progress: credentialData.roadmapProgress || 'N/A',
                    skill_badges: credentialData.skillBadges || 'N/A',
                    competition: credentialData.competition || 'N/A',
                    internship: credentialData.internship || 'N/A',
                    mentor_endorsement: credentialData.endorsement || 'N/A'
                },
                graduate_name: credentialData.name,
                graduate_education: credentialData.education
            }))
        }
    };
    return memo;
}

// Function to submit transaction to XRPL
async function submitToXRPL(secret, credentialData) {
    const client = await connectXRPL();
    if (!client) return null;

    try {
        // Create wallet from secret
        const wallet = xrpl.Wallet.fromSecret(secret);
        console.log('📌 Wallet created:', wallet.address);

        // Create payment transaction with credential memo
        const memo = createCredentialMemo(credentialData);

        const transaction = {
            Account: wallet.address,
            Destination: WALLET_ADDRESS,
            Amount: '1', // 1 drop (minimum) = essentially free
            TransactionType: 'Payment',
            Memos: [memo]
        };

        // Submit with autofill to handle ledger sequence
        const response = await client.submitAndWait(transaction, {
            wallet,
            autofill: true
        });

        console.log('✅ Transaction submitted:', response.result.hash);

        client.disconnect();

        return {
            success: true,
            hash: response.result.hash,
            explorer_url: XRPL_CONFIG.explorer_url + response.result.hash
        };
    } catch (error) {
        console.error('❌ Transaction Error:', error);
        client.disconnect();
        return {
            success: false,
            error: error.message
        };
    }
}
// ─── TAB SWITCHING ────────────────────────────────────────────────────────────

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.remove('hidden');
    event.target.classList.add('active');

    if (tab === 'companies') renderCompanies();
}

// ─── CAREER ANALYSIS ─────────────────────────────────────────────────────────

async function analyzeProfile() {
    const name = document.getElementById('name').value;
    const education = document.getElementById('education').value;
    const cgpa = document.getElementById('cgpa').value;
    const skills = document.getElementById('skills').value;
    const experience = document.getElementById('experience').value;
    const interests = document.getElementById('interests').value;

    if (!name || !education) {
        alert('Please fill in at least your name and educational background.');
        return;
    }

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, education, cgpa, skills, experience, interests })
    });

    const data = await response.json();

    // Strengths
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = '';
    data.strengths.forEach(s => {
        const li = document.createElement('li');
        li.textContent = '✅ ' + s;
        strengthsList.appendChild(li);
    });

    // Gaps
    const gapsList = document.getElementById('gaps-list');
    gapsList.innerHTML = '';
    data.gaps.forEach(g => {
        const li = document.createElement('li');
        li.textContent = '🔧 ' + g;
        gapsList.appendChild(li);
    });

    // Jobs
    const jobsList = document.getElementById('jobs-list');
    jobsList.innerHTML = '';
    data.top_jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';

        const skillTags = job.skills_needed.map(s => `<span class="tag">${s}</span>`).join('');
        const bdCompanies = job.companies_bd.join(', ') || '—';
        const globalCompanies = job.companies_global.join(', ') || '—';

        card.innerHTML = `
            <h4>🎯 ${job.title}</h4>
            <div>${skillTags}</div>
            <div class="salary">🇧🇩 BD Salary: <strong>${job.salary_bd}</strong> &nbsp;|&nbsp; 🌍 Global: <strong>${job.salary_global}</strong></div>
            <div class="salary">🏢 BD Companies: ${bdCompanies}</div>
            <div class="salary">🌐 Global Companies: ${globalCompanies}</div>
            <div class="how">📚 How to get in: ${job.how_to_get_in}</div>
            <div class="how">🎓 Learn from: ${job.learn_from}</div>
        `;
        jobsList.appendChild(card);
    });

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// ─── CV BUILDER ───────────────────────────────────────────────────────────────

function buildCV() {
    const name = document.getElementById('cv-name').value.trim();
    const email = document.getElementById('cv-email').value.trim();
    const phone = document.getElementById('cv-phone').value.trim();
    const location = document.getElementById('cv-location').value.trim();
    const linkedin = document.getElementById('cv-linkedin').value.trim();
    const education = document.getElementById('cv-education').value.trim();
    const skills = document.getElementById('cv-skills').value.trim();
    const experience = document.getElementById('cv-experience').value.trim();
    const extra = document.getElementById('cv-extra').value.trim();
    const objective = document.getElementById('cv-objective').value.trim();
    const photoFile = document.getElementById('cv-photo').files[0];

    if (!name) {
        alert('Please enter your name to generate the CV.');
        return;
    }

    const skillList = skills
        ? skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')
        : '';

    function render(photoSrc) {
        const photoHTML = photoSrc
            ? `<img src="${photoSrc}" alt="Profile Photo" class="cv-photo" />`
            : `<div class="cv-photo-placeholder">👤</div>`;

        const cvHTML = `
        <div class="cv-wrapper">

            <!-- LEFT SIDEBAR -->
            <div class="cv-sidebar">
                ${photoHTML}
                <h1 class="cv-name">${name}</h1>

                <div class="cv-sidebar-section">
                    <h3>Contact</h3>
                    ${email ? `<p>📧 ${email}</p>` : ''}
                    ${phone ? `<p>📞 ${phone}</p>` : ''}
                    ${location ? `<p>📍 ${location}</p>` : ''}
                    ${linkedin ? `<p>🔗 ${linkedin}</p>` : ''}
                </div>

                ${skills ? `
                <div class="cv-sidebar-section">
                    <h3>Skills</h3>
                    <div class="cv-skills-wrap">${skillList}</div>
                </div>` : ''}
            </div>

            <!-- RIGHT MAIN CONTENT -->
            <div class="cv-main">

                ${objective ? `
                <div class="cv-section">
                    <h2 class="cv-section-title">Career Objective</h2>
                    <p>${objective}</p>
                </div>` : ''}

                ${education ? `
                <div class="cv-section">
                    <h2 class="cv-section-title">Education</h2>
                    <p>${education}</p>
                </div>` : ''}

                ${experience ? `
                <div class="cv-section">
                    <h2 class="cv-section-title">Experience</h2>
                    <p>${experience}</p>
                </div>` : ''}

                ${extra ? `
                <div class="cv-section">
                    <h2 class="cv-section-title">Extracurricular & Achievements</h2>
                    <p>${extra}</p>
                </div>` : ''}

                <div class="cv-section">
                    <h2 class="cv-section-title">References</h2>
                    <p>Available upon request.</p>
                </div>

            </div>
        </div>`;

        document.getElementById('cv-output').innerHTML = cvHTML;
        document.getElementById('cv-preview').classList.remove('hidden');
        document.getElementById('cv-preview').scrollIntoView({ behavior: 'smooth' });
    }

    // If photo uploaded, read it as base64 first, then render
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => render(e.target.result);
        reader.readAsDataURL(photoFile);
    } else {
        render(null);
    }
}

function printCV() {
    const cvContent = document.getElementById('cv-output').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>CV — CareerPath BD</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; }

                .cv-wrapper {
                    display: flex;
                    min-height: 100vh;
                }

                /* SIDEBAR */
                .cv-sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: #1a1a2e;
                    color: #fff;
                    padding: 32px 20px;
                }
                .cv-photo {
                    width: 110px; height: 110px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid #fff;
                    display: block;
                    margin: 0 auto 14px;
                }
                .cv-photo-placeholder {
                    width: 110px; height: 110px;
                    border-radius: 50%;
                    background: #2e2e50;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 40px;
                    margin: 0 auto 14px;
                }
                .cv-name {
                    font-size: 20px;
                    font-weight: 700;
                    text-align: center;
                    margin-bottom: 24px;
                    color: #fff;
                    line-height: 1.3;
                }
                .cv-sidebar-section { margin-bottom: 22px; }
                .cv-sidebar-section h3 {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #a5b4fc;
                    border-bottom: 1px solid #a5b4fc44;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .cv-sidebar-section p {
                    font-size: 12px;
                    color: #ddd;
                    margin-bottom: 6px;
                    line-height: 1.5;
                    word-break: break-word;
                }
                .cv-skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
                .skill-tag {
                    background: #2e2e50;
                    color: #a5b4fc;
                    font-size: 11px;
                    padding: 3px 9px;
                    border-radius: 20px;
                    border: 1px solid #a5b4fc55;
                }

                /* MAIN */
                .cv-main {
                    flex: 1;
                    padding: 36px 32px;
                    background: #fff;
                }
                .cv-section { margin-bottom: 26px; }
                .cv-section-title {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #4f46e5;
                    border-bottom: 2px solid #4f46e5;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .cv-main p, .cv-main li {
                    font-size: 13px;
                    color: #444;
                    line-height: 1.8;
                }
            </style>
        </head>
        <body>${cvContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ─── COMPANY GUIDES ───────────────────────────────────────────────────────────
// ─── COMPANY GUIDES + HIRING JOURNEYS ────────────────────────────────────────

const companies = {
    bat: {
        name: "🚬 BAT Bangladesh", type: "local",
        desc: "British American Tobacco — one of BD's top MT employers.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1–2 weeks after deadline",
                tip: "Tailor your cover letter to BAT's 'Winning Together' values. Mention specific brands.",
                tasks: ["Update CV with CareerPath BD", "Write BAT-specific cover letter", "Submit on BAT careers portal"]
            },
            {
                title: "Online Aptitude Test", time: "⏱ 1–2 weeks after shortlisting",
                tip: "Numerical reasoning is tough — practice 30 mins daily on JobTestPrep.com for 2 weeks.",
                tasks: ["Practice numerical reasoning daily", "Practice verbal reasoning tests", "Do 2 full mock tests under timed conditions"]
            },
            {
                title: "Assessment Centre", time: "⏱ 2–3 weeks after aptitude",
                tip: "Group exercises test leadership AND listening. Don't dominate — build on others' ideas.",
                tasks: ["Practise group discussions with friends", "Prepare a 2-min self-introduction", "Research BAT's current BD campaigns"]
            },
            {
                title: "Final Interview", time: "⏱ 1–2 weeks after AC",
                tip: "Use STAR format. Prepare 'Why BAT?' with real reasons — they can tell if it's generic.",
                tasks: ["Prepare 5 STAR format answers", "Research BAT's global and BD strategy", "Do a mock interview with a friend"]
            },
            {
                title: "Offer & Onboarding", time: "⏱ Total process: 6–10 weeks",
                tip: "MT salary is mostly fixed but ask about allowances, training budget, and rotation plans.",
                tasks: ["Review offer letter carefully", "Ask about MT rotation schedule", "Confirm joining date and documents needed"]
            }
        ]
    },
    unilever: {
        name: "🧴 Unilever Bangladesh", type: "local",
        desc: "FMCG giant — Future Leaders Programme is highly competitive.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1 week after deadline",
                tip: "Unilever's application asks situational questions — answer with specific examples, not generic ones.",
                tasks: ["Apply on Unilever careers site", "Answer situational questions with real examples", "Attach updated CV"]
            },
            {
                title: "Digital Interview (HireVue)", time: "⏱ 1–2 weeks after application",
                tip: "Record yourself answering questions on your phone first — check your pace and eye contact.",
                tasks: ["Practice answering on camera for 60 seconds", "Test your mic and lighting beforehand", "Prepare 'Why Unilever?' answer"]
            },
            {
                title: "Assessment Centre", time: "⏱ 2–3 weeks after HireVue",
                tip: "Unilever's AC has a business case presentation — practice presenting data-backed recommendations.",
                tasks: ["Practice a business case presentation", "Do a mock group discussion", "Read Unilever's Compass strategy"]
            },
            {
                title: "Final HR Interview", time: "⏱ 1 week after AC",
                tip: "They look for 'standards of leadership' — be ready to show initiative, resilience, and accountability.",
                tasks: ["Prepare STAR answers around leadership", "Research Unilever BD brands (Sunsilk, Lux, etc.)", "Prepare questions to ask the interviewer"]
            },
            {
                title: "Offer", time: "⏱ Total process: 6–8 weeks",
                tip: "FLP offers are competitive. Ask about rotation departments and international exposure opportunities.",
                tasks: ["Review full offer package", "Ask about FLP rotation and mentoring", "Confirm start date"]
            }
        ]
    },
    gp: {
        name: "📡 Grameenphone", type: "local",
        desc: "Bangladesh's largest telecom — strong MT and tech hiring.",
        steps: [
            {
                title: "Online Application", time: "⏱ 2 weeks after deadline",
                tip: "GP posts jobs on bdjobs and LinkedIn — set alerts so you don't miss opening windows.",
                tasks: ["Set bdjobs alert for Grameenphone", "Apply with tailored CV", "Follow GP on LinkedIn"]
            },
            {
                title: "Written Test", time: "⏱ 2–3 weeks after application",
                tip: "GP's written test includes English, math, and analytical reasoning. English section is harder than it looks.",
                tasks: ["Practice English grammar and comprehension", "Practice analytical reasoning problems", "Do timed mock tests"]
            },
            {
                title: "Group Discussion", time: "⏱ 1–2 weeks after written test",
                tip: "GD topics are often current BD business issues. Read The Daily Star business section daily.",
                tasks: ["Read BD business news daily", "Practice group discussions with friends", "Work on structured argument delivery"]
            },
            {
                title: "HR + Technical Interview", time: "⏱ 1–2 weeks after GD",
                tip: "Technical round for tech roles covers networking basics, SQL, and problem solving. HR round is STAR-based.",
                tasks: ["Revise SQL and networking basics (tech roles)", "Prepare 5 STAR format answers", "Research GP's current products and strategy"]
            },
            {
                title: "Offer", time: "⏱ Total process: 8–12 weeks",
                tip: "GP offers solid packages. Ask about their learning budget and internal mobility programs.",
                tasks: ["Review offer details carefully", "Ask about training and growth path", "Confirm joining date"]
            }
        ]
    },
    bkash: {
        name: "💸 bKash", type: "local",
        desc: "Bangladesh's leading MFS company — fast-growing tech and business roles.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1–2 weeks after deadline",
                tip: "bKash looks for people who understand fintech and financial inclusion. Mention both in your objective.",
                tasks: ["Apply via bKash careers page or bdjobs", "Tailor CV objective to fintech", "Research bKash's latest services"]
            },
            {
                title: "Aptitude Test", time: "⏱ 2 weeks after application",
                tip: "Focuses on logical reasoning and basic math. Fast-paced — practice under timed conditions.",
                tasks: ["Practice logical reasoning daily", "Practice basic math under time pressure", "Try IndiaBix aptitude section"]
            },
            {
                title: "Technical/Functional Interview", time: "⏱ 1–2 weeks after test",
                tip: "For tech roles, expect SQL and system design basics. For business roles, expect case questions on MFS.",
                tasks: ["Revise SQL basics (tech roles)", "Read about MFS market in Bangladesh", "Prepare a case answer on digital payments"]
            },
            {
                title: "HR Interview", time: "⏱ 1 week after technical",
                tip: "bKash values innovation and impact. Prepare stories of when you solved a problem creatively.",
                tasks: ["Prepare STAR answers focused on problem-solving", "Prepare 'Why bKash?' with genuine reasons", "Do a mock interview"]
            },
            {
                title: "Offer", time: "⏱ Total process: 6–8 weeks",
                tip: "bKash offers competitive packages. Ask about their internal tech projects and learning opportunities.",
                tasks: ["Review offer letter", "Ask about team and growth path", "Confirm documents and joining date"]
            }
        ]
    },
    brac: {
        name: "🌿 BRAC", type: "local",
        desc: "World's largest NGO — meaningful work across development sectors.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1–2 weeks after deadline",
                tip: "BRAC values mission alignment. Mention why development work matters to you — don't just say it, show it.",
                tasks: ["Apply on BRAC's career portal", "Write a mission-driven cover letter", "Research BRAC's current programs"]
            },
            {
                title: "Written Test", time: "⏱ 2–3 weeks after application",
                tip: "Includes English writing, comprehension, and analytical questions. Writing quality matters a lot here.",
                tasks: ["Practice formal English writing daily", "Practice comprehension passages", "Read about development sector terminology"]
            },
            {
                title: "Panel Interview", time: "⏱ 2 weeks after written test",
                tip: "Panel may include senior BRAC staff. Be calm, speak clearly, and show genuine interest in social impact.",
                tasks: ["Prepare answers on development issues in BD", "Prepare 'Why BRAC?' with a personal story", "Do a mock panel interview"]
            },
            {
                title: "Offer", time: "⏱ Total process: 6–10 weeks",
                tip: "BRAC salaries are moderate but the learning, impact, and network are exceptional for early career.",
                tasks: ["Review offer and benefits", "Ask about field exposure and training", "Confirm reporting structure"]
            }
        ]
    },
    bs23: {
        name: "💻 Brain Station 23", type: "local",
        desc: "Top BD software company — great for fresh CS/IT graduates.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1 week after deadline",
                tip: "BS23 hires frequently. Check their LinkedIn and website monthly — they post junior roles regularly.",
                tasks: ["Follow BS23 on LinkedIn", "Apply with GitHub profile linked", "Highlight your tech stack clearly in CV"]
            },
            {
                title: "Coding Test", time: "⏱ 1–2 weeks after application",
                tip: "Expect OOP, data structures, and practical coding problems. LeetCode Easy–Medium level difficulty.",
                tasks: ["Do 10 LeetCode Easy problems this week", "Revise OOP concepts", "Practice on HackerRank"]
            },
            {
                title: "Technical Interview", time: "⏱ 1 week after coding test",
                tip: "They'll go deep on your projects. Be ready to explain every design decision and what you'd improve.",
                tasks: ["Review all your GitHub projects thoroughly", "Revise SQL and basic system design", "Practice explaining code out loud"]
            },
            {
                title: "HR Interview + Offer", time: "⏱ Total process: 3–5 weeks",
                tip: "BS23 has a great learning culture. Ask about mentoring, tech stack they use, and project variety.",
                tasks: ["Prepare 'Why BS23?' answer", "Ask about tech stack and team structure", "Review and sign offer"]
            }
        ]
    },
    pathao: {
        name: "🛵 Pathao", type: "local",
        desc: "BD's leading super-app startup — fast-paced, young culture.",
        steps: [
            {
                title: "Application", time: "⏱ Response within 1–2 weeks",
                tip: "Pathao loves self-starters. Show side projects, freelance work, or anything you built independently.",
                tasks: ["Apply via Pathao website or LinkedIn", "Highlight any side projects or initiatives", "Follow Pathao on LinkedIn"]
            },
            {
                title: "Task Round", time: "⏱ 1 week after application",
                tip: "Expect a real-world task — a business proposal, a data analysis, or a feature spec. Show structured thinking.",
                tasks: ["Practice writing a structured business proposal", "Practice basic data analysis in Excel", "Study Pathao's product features deeply"]
            },
            {
                title: "Interview", time: "⏱ 1 week after task round",
                tip: "Very conversational. They want to know how you think and if you'd fit the culture — be yourself, be direct.",
                tasks: ["Prepare to walk through your task submission", "Research Pathao's growth story and competitors", "Prepare 'Why a startup?' answer"]
            },
            {
                title: "Offer", time: "⏱ Total process: 3–4 weeks",
                tip: "Startup salaries vary. Ask about equity, learning opportunities, and how fast people grow here.",
                tasks: ["Review offer and growth potential", "Ask about team size and your role", "Confirm joining details"]
            }
        ]
    },
    chaldal: {
        name: "🛒 Chaldal", type: "local",
        desc: "BD's top e-grocery startup — tech, ops, and business roles available.",
        steps: [
            {
                title: "Application", time: "⏱ 1–2 weeks response time",
                tip: "Chaldal values hustle and problem-solving. Mention any experience with logistics, operations, or e-commerce.",
                tasks: ["Apply via Chaldal website or bdjobs", "Tailor CV to ops or tech role", "Research Chaldal's business model"]
            },
            {
                title: "Practical Task or Interview", time: "⏱ 1–2 weeks after application",
                tip: "Ops roles may get a case on delivery route optimization. Tech roles get a coding task. Prepare for both.",
                tasks: ["Study Chaldal's delivery and warehouse model", "Practice structured problem-solving out loud", "Revise relevant tech or Excel skills"]
            },
            {
                title: "Final Interview + Offer", time: "⏱ Total process: 3–5 weeks",
                tip: "Very startup-style — honest, direct conversation. Show you're adaptable and not afraid of fast-changing roles.",
                tasks: ["Prepare 'Why Chaldal?' answer", "Show examples of handling uncertainty or change", "Review and sign offer"]
            }
        ]
    },
    robi: {
        name: "📶 Robi Axiata", type: "local",
        desc: "BD's second largest telecom — strong corporate structure and MT program.",
        steps: [
            {
                title: "Online Application", time: "⏱ 1–2 weeks after deadline",
                tip: "Robi posts on bdjobs and LinkedIn. Their MT cycle usually opens around October–December.",
                tasks: ["Set bdjobs alert for Robi", "Apply with strong CV and cover letter", "Follow Robi on LinkedIn"]
            },
            {
                title: "Written + Aptitude Test", time: "⏱ 2–3 weeks after application",
                tip: "Similar to GP — English, math, reasoning. Robi also sometimes includes a short essay section.",
                tasks: ["Practice aptitude and reasoning tests", "Practice writing a short business essay", "Do timed mock tests"]
            },
            {
                title: "Assessment Centre / GD", time: "⏱ 2 weeks after test",
                tip: "Robi's AC includes group work and individual presentations. Prepare a 5-minute business case presentation.",
                tasks: ["Prepare and practice a business case presentation", "Practice group discussion etiquette", "Research Robi's recent campaigns and strategy"]
            },
            {
                title: "Final Interview + Offer", time: "⏱ Total process: 8–12 weeks",
                tip: "Ask about Axiata group exposure — Robi is part of a large regional group and that's a big growth opportunity.",
                tasks: ["Prepare STAR answers", "Prepare 'Why Robi over GP?' — have a real answer", "Review offer and ask about MT rotation"]
            }
        ]
    },
    google: {
        name: "🔍 Google", type: "global",
        desc: "Apply for APAC/remote roles or internships from Bangladesh.",
        steps: [
            {
                title: "Online Application", time: "⏱ 2–4 weeks for response",
                tip: "Google ATS screens for keywords. Mirror the job description language in your CV and cover letter.",
                tasks: ["Apply on careers.google.com", "Mirror job description keywords in your CV", "Link your GitHub and LinkedIn"]
            },
            {
                title: "Phone Screen", time: "⏱ 1–2 weeks after application review",
                tip: "A recruiter call first — they check communication, basics, and motivation. Treat it seriously.",
                tasks: ["Prepare a 90-second self-introduction", "Know your CV inside out", "Prepare 'Why Google?' with specific teams/products"]
            },
            {
                title: "Technical Interviews (4–5 rounds)", time: "⏱ 2–4 weeks after phone screen",
                tip: "Data structures, algorithms, and system design. Aim for LeetCode Medium–Hard. Think out loud — they score your process.",
                tasks: ["Solve 3 LeetCode problems per day", "Study system design (Grokking the System Design)", "Practice thinking out loud while coding"]
            },
            {
                title: "Hiring Committee Review + Offer", time: "⏱ Total process: 8–16 weeks",
                tip: "Google's HC reviews all feedback together. One bad round doesn't always kill your chances — consistency matters.",
                tasks: ["Prepare Googleyness / leadership answers", "Review offer with total comp calculator", "Negotiate if needed — Google expects it"]
            }
        ]
    },
    amazon: {
        name: "📦 Amazon", type: "global",
        desc: "Amazon hires for tech and ops roles globally — LP-driven process.",
        steps: [
            {
                title: "Online Application + OA", time: "⏱ OA sent within 1–2 weeks",
                tip: "Amazon's OA has 2 coding problems + a work style survey. Do the survey honestly — there's no trick to it.",
                tasks: ["Apply on Amazon.jobs", "Practice 2 LeetCode problems back to back under 70 min", "Read Amazon's 16 Leadership Principles"]
            },
            {
                title: "Virtual Onsite (Loop)", time: "⏱ 2–3 weeks after OA",
                tip: "Every interviewer asks LP-based behavioral questions. Prepare 2–3 STAR stories per LP. This is non-negotiable.",
                tasks: ["Write STAR stories for all 16 LPs", "Practice coding + LP questions in the same session", "Practice on a whiteboard or shared doc"]
            },
            {
                title: "Offer + Negotiation", time: "⏱ Total process: 6–10 weeks",
                tip: "Amazon's comp is heavy on RSUs. Understand the vesting schedule — year 1 and 2 vest less than 3 and 4.",
                tasks: ["Understand RSU vesting schedule", "Negotiate sign-on bonus if base is fixed", "Confirm team, manager, and location"]
            }
        ]
    },
    meta: {
        name: "👍 Meta", type: "global",
        desc: "Meta hires strong engineers globally — move fast culture.",
        steps: [
            {
                title: "Recruiter Screen", time: "⏱ 1–2 weeks after application",
                tip: "Meta recruiters are approachable. LinkedIn outreach to a Meta recruiter can speed up the process.",
                tasks: ["Apply on metacareers.com", "Message a Meta recruiter on LinkedIn", "Prepare your 60-second pitch"]
            },
            {
                title: "Technical Screens (2 rounds)", time: "⏱ 1–2 weeks after recruiter screen",
                tip: "Meta focuses heavily on coding speed and clean solutions. LeetCode Medium–Hard, especially graphs and DP.",
                tasks: ["Focus LeetCode on graphs and dynamic programming", "Practice writing clean, commented code fast", "Do mock technical interviews"]
            },
            {
                title: "Virtual Onsite (5–6 rounds)", time: "⏱ 2–3 weeks after screens",
                tip: "Includes a system design round and a behavioral round. Meta values 'impact' stories — show scale and results.",
                tasks: ["Study large-scale system design", "Prepare behavioral stories with measurable impact", "Practice 5 hours of mock interviews"]
            },
            {
                title: "Offer", time: "⏱ Total process: 6–12 weeks",
                tip: "Meta's comp is top-tier. RSUs vest quarterly after year 1. Always negotiate — they expect it.",
                tasks: ["Use levels.fyi to benchmark the offer", "Negotiate base and RSU grant", "Confirm team and product area"]
            }
        ]
    },
    microsoft: {
        name: "🪟 Microsoft", type: "global",
        desc: "Microsoft hires globally — growth mindset culture, strong for fresh grads.",
        steps: [
            {
                title: "Online Application", time: "⏱ 2–4 weeks for response",
                tip: "Microsoft values 'growth mindset' — use that language in your cover letter and application.",
                tasks: ["Apply on careers.microsoft.com", "Use 'growth mindset' framing in your cover letter", "Link GitHub and LinkedIn"]
            },
            {
                title: "Phone Screen + Coding", time: "⏱ 1–2 weeks after application",
                tip: "Microsoft's coding round is more about problem-solving approach than perfect code. Talk through your thinking.",
                tasks: ["Practice explaining your approach before coding", "Do LeetCode Easy–Medium problems daily", "Prepare a clean self-introduction"]
            },
            {
                title: "Virtual Onsite (4–5 rounds)", time: "⏱ 2–3 weeks after phone screen",
                tip: "One round is always behavioral — 'Tell me about a time you failed' is common. Have a genuine, specific answer.",
                tasks: ["Prepare a real failure story with what you learned", "Study system design basics", "Practice 3 full mock interview sessions"]
            },
            {
                title: "Offer", time: "⏱ Total process: 6–10 weeks",
                tip: "Microsoft is negotiation-friendly. Use competing offers or levels.fyi data to back your ask.",
                tasks: ["Benchmark offer on levels.fyi", "Negotiate with data, not emotion", "Confirm team and onboarding plan"]
            }
        ]
    }
};

let currentFilter = 'all';

function renderCompanies() {
    const container = document.getElementById('company-cards');
    container.innerHTML = '';

    Object.entries(companies).forEach(([key, company]) => {
        if (currentFilter !== 'all' && company.type !== currentFilter) return;

        const card = document.createElement('div');
        card.className = `company-card ${company.type}`;
        card.id = `card-${key}`;

        card.innerHTML = `
            <div class="company-card-header" onclick="toggleJourney('${key}')">
                <div>
                    <h3>${company.name}</h3>
                    <p class="company-desc">${company.desc}</p>
                </div>
                <span class="expand-icon" id="icon-${key}">▼</span>
            </div>
            <div class="journey-panel hidden" id="journey-${key}">
                <div class="journey-timeline">
                    ${company.steps.map((step, i) => `
                        <div class="journey-step">
                            <div class="step-header">
                                <span class="step-num">${i + 1}</span>
                                <div>
                                    <strong>${step.title}</strong>
                                    <span class="step-time">${step.time}</span>
                                </div>
                            </div>
                            <p class="step-tip">💡 <strong>Tip:</strong> ${step.tip}</p>
                            <div class="step-checklist">
                                ${step.tasks.map((task, j) => `
                                    <label>
                                        <input type="checkbox" class="task-check"
                                            data-key="${key}-${i}-${j}"
                                            onchange="saveTask('${key}-${i}-${j}', this.checked)">
                                        ${task}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Restore saved checkbox states
    restoreCheckboxes();
}

function toggleJourney(key) {
    const panel = document.getElementById(`journey-${key}`);
    const icon = document.getElementById(`icon-${key}`);
    const isHidden = panel.classList.contains('hidden');

    // Close all others
    document.querySelectorAll('.journey-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.expand-icon').forEach(i => i.textContent = '▼');

    if (isHidden) {
        panel.classList.remove('hidden');
        icon.textContent = '▲';
    }
}

function filterCompanies(type) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderCompanies();
}

// ─── CHECKLIST PERSISTENCE (localStorage) ────────────────────────────────────

function saveTask(key, checked) {
    localStorage.setItem(`task-${key}`, checked);
    updateBanner();
}

function restoreCheckboxes() {
    document.querySelectorAll('.task-check').forEach(cb => {
        const saved = localStorage.getItem(`task-${cb.dataset.key}`);
        if (saved === 'true') cb.checked = true;
    });
}

function updateBanner() {
    const allKeys = [];
    Object.entries(companies).forEach(([key, company]) => {
        company.steps.forEach((step, i) => {
            step.tasks.forEach((_, j) => allKeys.push(`${key}-${i}-${j}`));
        });
    });

    const uncompleted = allKeys.filter(k => localStorage.getItem(`task-${k}`) !== 'true');
    const banner = document.getElementById('daily-banner');
    const bannerText = document.getElementById('banner-text');

    if (uncompleted.length > 0) {
        bannerText.textContent = `📋 You have ${uncompleted.length} tasks still to complete — keep pushing!`;
        banner.classList.remove('hidden');
    } else {
        bannerText.textContent = '🎉 All tasks done! You\'re on track!';
        banner.classList.remove('hidden');
    }
}

// ─── BROWSER NOTIFICATIONS ───────────────────────────────────────────────────

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') scheduleNotification();
        });
    } else if (Notification.permission === 'granted') {
        scheduleNotification();
    }
}

function scheduleNotification() {
    const allKeys = [];
    Object.entries(companies).forEach(([key, company]) => {
        company.steps.forEach((step, i) => {
            step.tasks.forEach((_, j) => allKeys.push(`${key}-${i}-${j}`));
        });
    });

    const uncompleted = allKeys.filter(k => localStorage.getItem(`task-${k}`) !== 'true');

    if (uncompleted.length > 0) {
        setTimeout(() => {
            new Notification('CareerPath BD 🎓', {
                body: `You still have ${uncompleted.length} hiring tasks to complete. Don't stop now!`,
                icon: '/static/icon.png'
            });
        }, 5000); // shows 5 seconds after page load
    }
}

// ─── INIT ON PAGE LOAD ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    renderCompanies();
    updateBanner();
    requestNotificationPermission();
});

// ─── 6-MONTH ROADMAP ──────────────────────────────────────────────────────────

function generateRoadmap() {
    const name = document.getElementById('name').value.trim();
    const education = document.getElementById('education').value.trim();
    const skills = document.getElementById('skills').value.trim().toLowerCase();
    const experience = document.getElementById('experience').value.trim();
    const interests = document.getElementById('interests').value.trim().toLowerCase();
    const cgpa = document.getElementById('cgpa').value.trim();

    const hasExperience = experience.length > 5;
    const isCSE = skills.includes('python') || skills.includes('java') || skills.includes('sql') || education.toLowerCase().includes('cse') || education.toLowerCase().includes('computer');
    const isBusiness = interests.includes('marketing') || interests.includes('finance') || interests.includes('business') || education.toLowerCase().includes('bba') || education.toLowerCase().includes('mba');
    const isDesign = skills.includes('photoshop') || skills.includes('figma') || skills.includes('design') || interests.includes('design');

    let track = 'general';
    if (isCSE) track = 'tech';
    else if (isBusiness) track = 'business';
    else if (isDesign) track = 'design';

    const roadmaps = {
        tech: [
            {
                month: 1,
                title: "Foundation & Polish",
                goal: "Clean up your profile and identify exactly what kind of tech role you want.",
                tasks: [
                    "Update your LinkedIn with a professional photo, headline, and summary",
                    "Pick your primary tech stack (e.g. Python + SQL, or Java + Spring)",
                    "Do 10 LeetCode Easy problems to warm up",
                    "Research 5 companies you want to target (local + global)"
                ],
                resources: [
                    "LinkedIn Learning — free with many university emails",
                    "LeetCode.com — free tier is enough",
                    "GitHub — create an account and pin your best projects"
                ],
                companies: "Start researching: bKash, GP Digital, Augmedix, Brain Station 23, Pathao"
            },
            {
                month: 2,
                title: "Skill Building",
                goal: "Fill the gaps that most BD tech companies look for.",
                tasks: [
                    "Complete one mini project (e.g. a REST API, a data dashboard, or a web app)",
                    "Push all your projects to GitHub with a proper README",
                    "Do 15 more LeetCode Easy/Medium problems",
                    "Learn SQL basics if not already strong — most companies test this"
                ],
                resources: [
                    "freeCodeCamp.org — free full courses",
                    "CS50 on edX — free and very respected",
                    "SQLZoo.net — free SQL practice"
                ],
                companies: "Follow Brain Station 23, BJIT, Shohoz, Chaldal on LinkedIn — watch for openings"
            },
            {
                month: 3,
                title: "CV & Applications",
                goal: "Start applying with a strong, targeted CV.",
                tasks: [
                    "Generate your CV using CareerPath BD's CV Builder",
                    "Tailor your career objective for each company you apply to",
                    "Apply to at least 8–10 companies this month",
                    "Write a strong cover letter template you can customize"
                ],
                resources: [
                    "CareerPath BD CV Builder — right here!",
                    "bdjobs.com — biggest BD job board",
                    "LinkedIn Jobs — filter by Bangladesh"
                ],
                companies: "Apply to: bKash, GP, Brain Station 23, BJIT, Augmedix, Pathao, Shohoz"
            },
            {
                month: 4,
                title: "Aptitude & Test Prep",
                goal: "Most BD tech companies have written/aptitude tests — prepare hard.",
                tasks: [
                    "Practice IQ and aptitude tests (logical reasoning, math, English)",
                    "Do 20 more coding problems on LeetCode or HackerRank",
                    "Review your data structures: arrays, linked lists, trees, sorting",
                    "Practice explaining your projects out loud in 2 minutes"
                ],
                resources: [
                    "HackerRank.com — great for company-style tests",
                    "IndiaBix.com — aptitude questions bank",
                    "GeeksForGeeks.org — DSA revision"
                ],
                companies: "Target written test rounds at: Grameenphone, bKash, Robi, Augmedix"
            },
            {
                month: 5,
                title: "Interview Preparation",
                goal: "Get interview-ready — technical and behavioral.",
                tasks: [
                    "Practice 20 common HR questions (tell me about yourself, strengths, weaknesses)",
                    "Do 3 mock technical interviews with a friend",
                    "Review your projects deeply — be ready to explain every line",
                    "Research each company's culture, products, and recent news before interviews"
                ],
                resources: [
                    "Glassdoor.com — read real interview experiences",
                    "YouTube: 'GP interview experience Bangladesh'",
                    "CareerPath BD Company Guides tab — read each company's process"
                ],
                companies: "Focus interview prep on your top 3 choices from Month 3 applications"
            },
            {
                month: 6,
                title: "Offers, Negotiation & Next Steps",
                goal: "Close the loop — evaluate offers and negotiate smartly.",
                tasks: [
                    "Compare any offers you receive (salary, growth, culture, location)",
                    "Don't be afraid to negotiate — politely ask for 10–15% more",
                    "If no offer yet: ask for feedback from rejections and keep applying",
                    "Continue 2–3 applications per week — never stop until you sign"
                ],
                resources: [
                    "Numbeo.com — check Dhaka cost of living vs salary offers",
                    "LinkedIn Salary Insights — benchmark your offer",
                    "CareerPath BD — come back to refine your CV and strategy"
                ],
                companies: "If still searching: expand to Therap BD, Enosis Solutions, Kaz Software, TigerIT"
            }
        ],
        business: [
            {
                month: 1,
                title: "Foundation & Polish",
                goal: "Define your target role — marketing, finance, HR, or operations?",
                tasks: [
                    "Update LinkedIn with a professional photo and strong headline",
                    "Pick your focus: Marketing / Finance / HR / Supply Chain",
                    "Research top FMCG and telecom companies in Bangladesh",
                    "Read the annual reports of BAT Bangladesh and Unilever Bangladesh"
                ],
                resources: [
                    "BAT Bangladesh website — careers section",
                    "Unilever Bangladesh — LinkedIn page",
                    "Google Scholar — read about BD consumer market"
                ],
                companies: "Start researching: BAT, Unilever, Nestlé, Marico, GP, Robi, bKash, BRAC"
            },
            {
                month: 2,
                title: "Skill Building",
                goal: "Build the core skills FMCG and corporate BD companies look for.",
                tasks: [
                    "Learn Excel deeply — pivot tables, VLOOKUP, dashboards",
                    "Take a free digital marketing course (Google Digital Garage)",
                    "Learn basics of financial analysis if targeting finance roles",
                    "Join a case competition or business club if still in university"
                ],
                resources: [
                    "Google Digital Garage — free marketing certifications",
                    "Coursera Financial Markets (Yale) — free to audit",
                    "ExcelJet.net — free Excel tutorials"
                ],
                companies: "Follow BAT, Unilever, Nestlé, Marico on LinkedIn — note their hiring seasons"
            },
            {
                month: 3,
                title: "CV & Applications",
                goal: "Apply with a sharp, business-focused CV.",
                tasks: [
                    "Build your CV using CareerPath BD — highlight leadership and achievements",
                    "Write a strong cover letter for each company",
                    "Apply to Management Trainee programs — most open Oct–Feb",
                    "Apply to at least 6–8 companies this month"
                ],
                resources: [
                    "CareerPath BD CV Builder — right here!",
                    "bdjobs.com — filter by MNC and FMCG",
                    "LinkedIn Jobs — search 'Management Trainee Bangladesh'"
                ],
                companies: "Apply to MT programs: BAT, Unilever, Nestlé, Marico, GP, Robi, bKash, BRAC"
            },
            {
                month: 4,
                title: "Aptitude & Assessment Prep",
                goal: "Corporate BD companies have tough written and psychometric tests.",
                tasks: [
                    "Practice numerical reasoning and verbal reasoning tests daily",
                    "Practice case studies — BAT and Unilever love business cases",
                    "Do mock group discussions with friends",
                    "Practice writing business emails and reports clearly"
                ],
                resources: [
                    "JobTestPrep.com — aptitude test practice",
                    "IndiaBix.com — free logical reasoning",
                    "YouTube: 'Unilever Future Leaders test prep'"
                ],
                companies: "Focus test prep on: BAT Bangladesh, Unilever, Nestlé assessment centers"
            },
            {
                month: 5,
                title: "Interview Preparation",
                goal: "Master the HR interview and assessment center formats.",
                tasks: [
                    "Prepare STAR format answers (Situation, Task, Action, Result)",
                    "Practice 'Why do you want to work at BAT/Unilever?' deeply",
                    "Do 3 mock interviews with someone who can give honest feedback",
                    "Research each company's values, brands, and recent campaigns"
                ],
                resources: [
                    "Glassdoor — read BAT and Unilever BD interview experiences",
                    "CareerPath BD Company Guides — step by step for each company",
                    "YouTube: 'Assessment centre group exercise tips'"
                ],
                companies: "Prepare company-specific answers for your top 3 targets"
            },
            {
                month: 6,
                title: "Offers, Negotiation & Next Steps",
                goal: "Evaluate and close your offer confidently.",
                tasks: [
                    "Compare offers: base salary, allowances, training quality, brand name",
                    "MT programs often have fixed salaries — ask about growth timeline instead",
                    "If no offer: apply to second-tier MNCs and large local corporates",
                    "Keep networking — many BD jobs are filled through referrals"
                ],
                resources: [
                    "LinkedIn — connect with MT alumni of your target companies",
                    "CareerPath BD — revisit and refine your profile",
                    "BDjobs salary report — benchmark your offer"
                ],
                companies: "Backup options: Square Group, Pran-RFL, ACI, Transcom, City Group"
            }
        ],
        design: [
            {
                month: 1,
                title: "Foundation & Portfolio Start",
                goal: "A designer is only as strong as their portfolio — start building it now.",
                tasks: [
                    "Set up a Behance and/or Dribbble profile",
                    "List all your design tools: Figma, Photoshop, Illustrator, Canva",
                    "Pick 2–3 personal projects to redesign and add to portfolio",
                    "Research design roles at BD tech companies and agencies"
                ],
                resources: [
                    "Behance.net — free portfolio hosting",
                    "Figma.com — free for individuals",
                    "Dribbble.com — great for UI/UX inspiration"
                ],
                companies: "Research: Shajgoj, Chaldal, Pathao, local digital agencies in Dhaka"
            },
            {
                month: 2,
                title: "Skill Building",
                goal: "Fill gaps in your design skill set.",
                tasks: [
                    "Complete a UI/UX course if not already strong in it",
                    "Learn basic prototyping in Figma",
                    "Redesign 2 real BD app screens as a portfolio piece",
                    "Learn basic motion design or social media content creation"
                ],
                resources: [
                    "Google UX Design Certificate on Coursera — free to audit",
                    "Figma tutorials on YouTube — free",
                    "DesignCourse.com — free design fundamentals"
                ],
                companies: "Follow Shajgoj, Pathao, Shohoz on LinkedIn — watch for design openings"
            },
            {
                month: 3,
                title: "Portfolio & Applications",
                goal: "Apply with a strong portfolio — this is your real CV as a designer.",
                tasks: [
                    "Have at least 4–5 strong portfolio pieces",
                    "Build your CV using CareerPath BD — link your Behance/Dribbble",
                    "Apply to 6–8 companies or agencies this month",
                    "Write a short personal bio that shows your design personality"
                ],
                resources: [
                    "CareerPath BD CV Builder — right here!",
                    "bdjobs.com — search Graphic Designer, UI/UX Designer",
                    "LinkedIn Jobs — filter by Dhaka, Design"
                ],
                companies: "Apply to: Shajgoj, local ad agencies, tech startups, freelance platforms"
            },
            {
                month: 4,
                title: "Test & Task Round Prep",
                goal: "Many BD design jobs give a practical task — be ready.",
                tasks: [
                    "Practice designing a social media post set in under 2 hours",
                    "Practice redesigning a landing page in Figma in one sitting",
                    "Get feedback on your portfolio from a senior designer",
                    "Learn to present and explain your design decisions clearly"
                ],
                resources: [
                    "r/design on Reddit — portfolio feedback community",
                    "Figma Community — free UI kits and templates to study",
                    "YouTube: 'How to present design work in interviews'"
                ],
                companies: "Focus task prep on agencies and startups you applied to in Month 3"
            },
            {
                month: 5,
                title: "Interview Preparation",
                goal: "Prepare to walk through your portfolio confidently.",
                tasks: [
                    "Practice presenting each portfolio piece in 3 minutes",
                    "Prepare answers: 'What is your design process?', 'How do you handle feedback?'",
                    "Research the visual style of each company you're interviewing with",
                    "Do a mock portfolio review with a friend"
                ],
                resources: [
                    "Glassdoor — search design interview experiences",
                    "YouTube: 'UI UX designer portfolio presentation'",
                    "CareerPath BD Company Guides — check company culture"
                ],
                companies: "Prepare company-specific portfolio presentations for your top 3"
            },
            {
                month: 6,
                title: "Offers & Freelance Strategy",
                goal: "Close your offer or build a freelance income while you keep searching.",
                tasks: [
                    "Evaluate offers: creative freedom matters as much as salary for designers",
                    "If no full-time offer: start freelancing on Fiverr or Upwork",
                    "Keep adding to your portfolio even after getting a job",
                    "Connect with Dhaka's design community on Facebook groups"
                ],
                resources: [
                    "Fiverr.com — start freelancing",
                    "Upwork.com — higher-paying international clients",
                    "Facebook: 'Graphic Designers Bangladesh' group"
                ],
                companies: "Expand search to: freelance platforms, international remote design roles"
            }
        ],
        general: [
            {
                month: 1,
                title: "Foundation & Self-Assessment",
                goal: "Get clear on what you want and start building your professional presence.",
                tasks: [
                    "Complete your LinkedIn profile fully with photo and headline",
                    "List all your skills — technical and soft",
                    "Research 5 companies you genuinely want to work at",
                    "Identify 2–3 job roles that match your background"
                ],
                resources: [
                    "LinkedIn.com — free professional profile",
                    "bdjobs.com — browse roles by category",
                    "Google — research each company's culture and hiring process"
                ],
                companies: "Start researching: BRAC, GP, bKash, Dutch-Bangla Bank, local NGOs"
            },
            {
                month: 2,
                title: "Skill Building",
                goal: "Pick one key skill to strengthen this month.",
                tasks: [
                    "Take one free online course relevant to your target role",
                    "Practice MS Office — Word, Excel, PowerPoint (most BD jobs require this)",
                    "Improve your English writing — practice emailing professionally",
                    "Join a club, volunteer, or do a short course to add to your CV"
                ],
                resources: [
                    "Google Digital Garage — free courses with certificates",
                    "Coursera — free to audit most courses",
                    "YouTube — search any skill + 'tutorial'"
                ],
                companies: "Follow your target companies on LinkedIn — note their job posting patterns"
            },
            {
                month: 3,
                title: "CV & Applications",
                goal: "Start applying with a clean, honest CV.",
                tasks: [
                    "Build your CV using CareerPath BD CV Builder",
                    "Apply to at least 8 companies this month",
                    "Write a basic cover letter template",
                    "Ask a teacher or senior to review your CV"
                ],
                resources: [
                    "CareerPath BD CV Builder — right here!",
                    "bdjobs.com — biggest BD job board",
                    "LinkedIn Jobs — filter by Dhaka"
                ],
                companies: "Apply broadly: BRAC, NGOs, local corporates, government jobs, SMEs"
            },
            {
                month: 4,
                title: "Aptitude & Test Prep",
                goal: "Most companies in BD have written tests — prepare for them.",
                tasks: [
                    "Practice English grammar, comprehension, and writing daily",
                    "Practice basic math and logical reasoning",
                    "Practice IQ and aptitude test questions online",
                    "Do mock tests under timed conditions"
                ],
                resources: [
                    "IndiaBix.com — free aptitude questions",
                    "JobTestPrep.com — practice tests",
                    "YouTube: 'Bangladesh bank written test preparation'"
                ],
                companies: "Prepare for written tests at: Dutch-Bangla Bank, Sonali Bank, BRAC, NGOs"
            },
            {
                month: 5,
                title: "Interview Preparation",
                goal: "Get ready to impress in person.",
                tasks: [
                    "Prepare answers for 15 common interview questions",
                    "Practice 'Tell me about yourself' until it sounds natural",
                    "Research each company before every interview",
                    "Do a mock interview with a friend or family member"
                ],
                resources: [
                    "Glassdoor.com — real interview experiences",
                    "YouTube: 'Job interview tips Bangladesh'",
                    "CareerPath BD Company Guides tab"
                ],
                companies: "Focus on interview prep for the companies that called you back"
            },
            {
                month: 6,
                title: "Offers & Next Steps",
                goal: "Evaluate your options and keep going until you sign.",
                tasks: [
                    "Compare any offers you receive carefully",
                    "Don't stop applying until you have a signed offer letter",
                    "Ask for feedback from any rejections — use it to improve",
                    "Keep networking — tell everyone you're looking for a job"
                ],
                resources: [
                    "CareerPath BD — revisit your profile and CV anytime",
                    "LinkedIn — connect with alumni from your university",
                    "bdjobs.com — keep checking daily"
                ],
                companies: "Widen your search: any company that matches your skills and interests"
            }
        ]
    };

    const plan = roadmaps[track];
    const userName = name || 'You';

    let html = `<div class="roadmap-header">
        <h3>🗺️ ${userName}'s 6-Month Plan</h3>
        <p class="roadmap-track">Track: <strong>${track.charAt(0).toUpperCase() + track.slice(1)}</strong> — based on your profile</p>
    </div>`;

    plan.forEach((month, index) => {
        const taskItems = month.tasks.map(t => `<li>${t}</li>`).join('');
        const resourceItems = month.resources.map(r => `<li>${r}</li>`).join('');

        html += `
        <div class="roadmap-card">
            <div class="roadmap-month-label">Month ${month.month}</div>
            <h3 class="roadmap-title">${month.title}</h3>
            <p class="roadmap-goal">🎯 <strong>Goal:</strong> ${month.goal}</p>

            <div class="roadmap-section">
                <h4>✅ Tasks</h4>
                <ul>${taskItems}</ul>
            </div>

            <div class="roadmap-section">
                <h4>📚 Resources</h4>
                <ul>${resourceItems}</ul>
            </div>

            <div class="roadmap-section roadmap-companies">
                <h4>🏢 Company Targets</h4>
                <p>${month.companies}</p>
            </div>
        </div>`;
    });

    document.getElementById('roadmap-cards').innerHTML = html;
    document.getElementById('roadmap-output').classList.remove('hidden');
    document.getElementById('roadmap-output').scrollIntoView({ behavior: 'smooth' });
}
// ─── CAREER PASSPORT ──────────────────────────────────────────────────────────

function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const timestamp = Date.now().toString(16);
    return `0x${hex}${timestamp}bd`;
}

function generatePassport() {
    const name = document.getElementById('name').value.trim();
    const education = document.getElementById('education').value.trim();
    const skills = document.getElementById('skills').value.trim();
    const experience = document.getElementById('experience').value.trim();

    if (!name) {
        alert('Please fill in your profile in the Career Analysis tab first!');
        return;
    }

    // Show passport card, hide generate prompt
    document.getElementById('passport-card').classList.remove('hidden');
    document.getElementById('passport-generate-prompt').classList.add('hidden');

    // Fill identity
    document.getElementById('passport-name').textContent = name;
    document.getElementById('passport-education').textContent = education || 'Education not specified';

    // Generate blockchain-style hash
    const hashInput = name + education + skills + Date.now();
    const hash = generateHash(hashInput);
    document.getElementById('passport-hash').textContent = `🔗 ${hash}`;
    localStorage.setItem('passport-hash', hash);

    // Timestamp
    const now = new Date();
    document.getElementById('passport-timestamp').textContent =
        `Issued: ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    // Profile photo from CV builder if available
    const photoFile = document.getElementById('cv-photo').files[0];
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('passport-avatar').innerHTML =
                `<img src="${e.target.result}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid #fff;" />`;
        };
        reader.readAsDataURL(photoFile);
    }

    // ── Skill badges ──────────────────────────────────────────────────────
    const skillTags = document.getElementById('cred-skills-tags');
    skillTags.innerHTML = '';
    if (skills) {
        skills.split(',').forEach(s => {
            const tag = document.createElement('span');
            tag.className = 'passport-skill-tag';
            tag.textContent = s.trim();
            skillTags.appendChild(tag);
        });
        setStamp('skills', true);
    }

    // ── Projects & Experience ─────────────────────────────────────────────
    if (experience && experience.length > 5) {
        document.getElementById('cred-projects-text').textContent = experience;
        setStamp('projects', true);
    }

    // ── Roadmap progress ──────────────────────────────────────────────────
    const allRoadmapKeys = [];
    ['tech', 'business', 'design', 'general'].forEach(track => {
        for (let m = 0; m < 6; m++) {
            for (let t = 0; t < 4; t++) {
                allRoadmapKeys.push(`${track}-${m}-${t}`);
            }
        }
    });
    const completedRoadmap = allRoadmapKeys.filter(k =>
        localStorage.getItem(`task-${k}`) === 'true'
    ).length;

    if (completedRoadmap > 0) {
        document.getElementById('cred-roadmap-text').textContent =
            `${completedRoadmap} roadmap tasks completed`;
        setStamp('roadmap', completedRoadmap >= 10);
    }

    // ── Hiring journey progress ───────────────────────────────────────────
    const allHiringKeys = [];
    Object.entries(companies).forEach(([key, company]) => {
        company.steps.forEach((step, i) => {
            step.tasks.forEach((_, j) => {
                allHiringKeys.push(`${key}-${i}-${j}`);
            });
        });
    });
    const completedHiring = allHiringKeys.filter(k =>
        localStorage.getItem(`task-${k}`) === 'true'
    ).length;

    if (completedHiring > 0) {
        document.getElementById('cred-hiring-text').textContent =
            `${completedHiring} hiring tasks completed across company guides`;
        setStamp('hiring', completedHiring >= 5);
    }

    // Save to localStorage
    localStorage.setItem('passport-name', name);
    localStorage.setItem('passport-education', education);
    localStorage.setItem('passport-skills', skills);

    document.getElementById('passport-card').scrollIntoView({ behavior: 'smooth' });
}

async function stampPassport() {
    const profile = {
        name: document.getElementById('name').value || localStorage.getItem('passport-name'),
        education: document.getElementById('education').value || localStorage.getItem('passport-education')
    };

    if (!profile.name) {
        alert('❌ Please fill your profile in Tab 1 first!');
        return;
    }

    // Prompt user for XRPL secret (only used here, not stored)
    const secret = prompt(
        '🔐 Enter your XRPL Testnet wallet SECRET to stamp credentials on blockchain:\n\n' +
        '(This will only be used to sign this transaction. It will NOT be stored.)\n\n' +
        'Your wallet: rJ4aFjKpK8WjG3mzkYyuTmSfX3jSfDWYjJ'
    );

    if (!secret) {
        alert('Cancelled. No credentials stamped.');
        return;
    }

    // Show loading state
    const stampBtn = document.querySelector('button[onclick="stampPassport()"]');
    const originalText = stampBtn.textContent;
    stampBtn.textContent = '⏳ Submitting to XRP Ledger...';
    stampBtn.disabled = true;

    // Collect credential data
    const credentialData = {
        passportId: 'PASSPORT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: profile.name,
        education: profile.education,
        timestamp: new Date().toISOString(),
        roadmapProgress: document.querySelector('[data-credential="roadmap"]')?.textContent || 'Not started',
        skillBadges: document.querySelector('[data-credential="skills"]')?.textContent || 'None',
        competition: document.querySelector('[data-credential="competition"]')?.textContent || 'None',
        internship: document.querySelector('[data-credential="internship"]')?.textContent || 'None',
        endorsement: document.querySelector('[data-credential="endorsement"]')?.textContent || 'None'
    };

    // Submit to XRPL
    const result = await submitToXRPL(secret, credentialData);

    // Reset button
    stampBtn.textContent = originalText;
    stampBtn.disabled = false;

    if (result.success) {
        // ✅ Success
        alert(`✅ Credentials stamped on XRP Ledger!\n\nTransaction Hash:\n${result.hash}\n\nView on explorer:\n${result.explorer_url}`);

        // Save to localStorage
        const passportData = {
            stamped: true,
            stampedAt: new Date().toISOString(),
            xrplHash: result.hash,
            xrplExplorerUrl: result.explorer_url,
            passportId: credentialData.passportId
        };
        localStorage.setItem('passportStamp', JSON.stringify(passportData));

        // Update UI
        updateStampDisplay(result.hash, result.explorer_url, credentialData.passportId);

    } else {
        // ❌ Failed
        alert(`❌ Failed to stamp credentials.\n\nError: ${result.error}\n\nMake sure your secret is correct.`);
    }
}
function updateStampDisplay(hash, explorerUrl, passportId) {
    // Find the passport stamp section
    const stampSection = document.querySelector('.passport-stamp-display') ||
        document.querySelector('[data-section="stamp"]');

    if (stampSection) {
        // Update with real transaction hash
        stampSection.innerHTML = `
            <div style="padding: 20px; background: #f0f9ff; border: 2px solid #10b981; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #059669; margin-bottom: 10px;">✅ Credentials Verified on XRP Ledger</h3>
                
                <p style="color: #666; margin: 10px 0; font-size: 14px;">
                    <strong>Passport ID:</strong> ${passportId}
                </p>
                
                <p style="color: #666; margin: 10px 0; font-size: 14px;">
                    <strong>Transaction Hash:</strong>
                </p>
                <div style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; color: #333; margin: 5px 0;">
                    ${hash}
                </div>

                <a href="${explorerUrl}" target="_blank" style="
                    display: inline-block;
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #10b981;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                ">
                    🔗 View on XRP Ledger Explorer
                </a>
            </div>
        `;
    }

    // Also update localStorage
    const passportData = JSON.parse(localStorage.getItem('passportStamp')) || {};
    passportData.xrplHash = hash;
    passportData.xrplExplorerUrl = explorerUrl;
    passportData.passportId = passportId;
    passportData.stamped = true;
    localStorage.setItem('passportStamp', JSON.stringify(passportData));
}
function setStamp(credentialKey, verified) {
    const stamp = document.getElementById(`stamp-${credentialKey}`);
    if (!stamp) return;
    if (verified) {
        stamp.textContent = '✅ Verified';
        stamp.classList.add('stamped');
    } else {
        stamp.textContent = '⏳ In Progress';
        stamp.classList.add('in-progress');
    }
}

function copyPassportLink() {
    const id = document.getElementById('passport-share-link').textContent;
    navigator.clipboard.writeText(id).then(() => {
        alert(`✅ Passport ID copied!\n\n${id}\n\nShare this with employers to verify your credentials.`);
    });
}

function printPassport() {
    const name = document.getElementById('passport-name').textContent;
    const education = document.getElementById('passport-education').textContent;
    const hash = document.getElementById('passport-hash').textContent;
    const timestamp = document.getElementById('passport-timestamp').textContent;
    const passportID = document.getElementById('passport-share-link').textContent || '—';

    const credentials = [];

    const blocks = document.querySelectorAll('.credential-block');
    blocks.forEach(block => {
        const title = block.querySelector('h4').textContent;
        const text = block.querySelector('p, .credential-tags') ?
            (block.querySelector('p') ? block.querySelector('p').textContent : '') : '';
        const stamp = block.querySelector('.credential-stamp').textContent;
        credentials.push({ title, text, stamp });
    });

    const credHTML = credentials.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;
            padding:12px 16px;border-radius:8px;background:#f8f9ff;margin-bottom:10px;border-left:4px solid #4f46e5;">
            <div>
                <strong style="color:#1a1a2e;">${c.title}</strong>
                <p style="color:#555;font-size:12px;margin:4px 0 0;">${c.text || '—'}</p>
            </div>
            <span style="font-size:12px;font-weight:700;color:#4f46e5;">${c.stamp}</span>
        </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Career Passport — ${name}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f0f8; padding: 40px; }
            </style>
        </head>
        <body>
            <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

                <!-- HEADER -->
                <div style="background:linear-gradient(135deg,#1a1a2e,#4f46e5);padding:40px;color:#fff;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;margin-bottom:8px;">
                                🪪 CareerPath BD — Career Passport
                            </p>
                            <h1 style="font-size:28px;font-weight:800;margin-bottom:6px;">${name}</h1>
                            <p style="color:#c7d2fe;font-size:14px;">${education}</p>
                            <p style="color:#a5b4fc;font-size:11px;margin-top:12px;font-family:monospace;">${hash}</p>
                        </div>
                        <div style="text-align:right;">
                            <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 16px;">
                                <p style="font-size:10px;color:#a5b4fc;margin-bottom:4px;">PASSPORT ID</p>
                                <p style="font-size:13px;font-weight:700;font-family:monospace;">${passportID}</p>
                            </div>
                            <p style="font-size:11px;color:#a5b4fc;margin-top:8px;">${timestamp}</p>
                        </div>
                    </div>
                </div>

                <!-- CREDENTIALS -->
                <div style="padding:32px;">
                    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:16px;">
                        Verified Credentials
                    </h3>
                    ${credHTML}

                    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;
                        display:flex;justify-content:space-between;align-items:center;">
                        <p style="font-size:11px;color:#aaa;">
                            Issued by CareerPath BD · Tamper-resistant credential record
                        </p>
                        <p style="font-size:11px;color:#4f46e5;font-weight:700;">careerpathbd.com</p>
                    </div>
                </div>

            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ── Restore passport from localStorage on page load ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('passport-name');
    if (savedName) {
        // Pre-fill fields if passport was previously generated
        const competition = localStorage.getItem('passport-competition');
        const internship = localStorage.getItem('passport-internship');
        const endorsement = localStorage.getItem('passport-endorsement');
        const github = localStorage.getItem('passport-github');

        if (competition) document.getElementById('passport-competition').value = competition;
        if (internship) document.getElementById('passport-internship').value = internship;
        if (endorsement) document.getElementById('passport-endorsement').value = endorsement;
        if (github) document.getElementById('passport-github').value = github;
    }
});