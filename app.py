from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)

# ─── JOB DATABASE ───────────────────────────────────────────────────────────

JOBS = [
    {
        "title": "Software Engineer",
        "fields": ["cse", "computer", "software", "engineering"],
        "skills_needed": ["Python", "JavaScript", "Data Structures", "Git", "SQL"],
        "salary_bd": "40,000–80,000 BDT/month",
        "salary_global": "$80,000–$150,000/year",
        "companies_bd": ["Grameenphone", "bKash", "BJIT", "Brain Station 23", "Pathao"],
        "companies_global": ["Google", "Amazon", "Microsoft", "Meta"],
        "how_to_get_in": "Build a strong GitHub portfolio. Practice Data Structures & Algorithms on LeetCode. Get certified in cloud (AWS/GCP). Apply through LinkedIn and company career pages.",
        "learn_from": "LeetCode, freeCodeCamp, CS50 (Harvard free), Coursera"
    },
    {
        "title": "Data Analyst",
        "fields": ["cse", "statistics", "math", "economics", "business", "bba"],
        "skills_needed": ["Excel", "SQL", "Python", "Power BI", "Tableau"],
        "salary_bd": "30,000–60,000 BDT/month",
        "salary_global": "$60,000–$110,000/year",
        "companies_bd": ["bKash", "BRAC", "Dutch-Bangla Bank", "Unilever BD", "Robi"],
        "companies_global": ["Amazon", "Google", "McKinsey", "Deloitte"],
        "how_to_get_in": "Learn SQL and Excel deeply. Build a portfolio of 3-5 analysis projects. Get Google Data Analytics Certificate (free on Coursera with financial aid).",
        "learn_from": "Google Data Analytics Certificate, Kaggle, YouTube (Alex the Analyst)"
    },
    {
        "title": "Digital Marketing Specialist",
        "fields": ["bba", "marketing", "business", "communication", "english"],
        "skills_needed": ["SEO", "Google Ads", "Facebook Ads", "Content Writing", "Analytics"],
        "salary_bd": "20,000–50,000 BDT/month",
        "salary_global": "$45,000–$90,000/year",
        "companies_bd": ["Grameenphone", "Robi", "Unilever BD", "PRAN-RFL", "Shajgoj"],
        "companies_global": ["HubSpot", "Hootsuite", "Remote startups"],
        "how_to_get_in": "Get Google Digital Marketing Certificate. Run your own social media page as practice. Build a small portfolio of real campaigns.",
        "learn_from": "Google Digital Garage (free), Meta Blueprint (free), HubSpot Academy (free)"
    },
    {
        "title": "Management Trainee (MT)",
        "fields": ["bba", "business", "economics", "cse", "engineering", "any"],
        "skills_needed": ["Leadership", "Communication", "Problem Solving", "Excel", "Presentation"],
        "salary_bd": "50,000–80,000 BDT/month",
        "salary_global": "N/A (BD-specific program)",
        "companies_bd": ["BAT Bangladesh", "Unilever Bangladesh", "Grameenphone", "Robi", "PRAN-RFL"],
        "companies_global": [],
        "how_to_get_in": "MT programs are highly competitive. Strong CGPA (3.5+), extracurricular leadership, and excellent English are key. Apply in October–January. Prepare for aptitude tests (SHL, Wonderlic) and case interviews.",
        "learn_from": "BAT Careers website, LinkedIn MT communities, case interview prep on YouTube"
    },
    {
        "title": "Product Manager",
        "fields": ["cse", "bba", "engineering", "business"],
        "skills_needed": ["Product Thinking", "SQL", "Agile", "User Research", "Communication"],
        "salary_bd": "60,000–120,000 BDT/month",
        "salary_global": "$100,000–$180,000/year",
        "companies_bd": ["bKash", "Shohoz", "Pathao", "Chaldal", "ShopUp"],
        "companies_global": ["Google", "Amazon", "Microsoft", "Airbnb"],
        "how_to_get_in": "Start as a Business Analyst or Software Engineer. Build side projects. Get the Google PM Certificate or do the Exponent PM course.",
        "learn_from": "Lenny's Newsletter, Exponent, Product School (YouTube)"
    },
    {
        "title": "Banking & Finance Officer",
        "fields": ["bba", "finance", "accounting", "economics", "business"],
        "skills_needed": ["Excel", "Financial Modeling", "Communication", "Accounting", "SQL"],
        "salary_bd": "25,000–60,000 BDT/month",
        "salary_global": "$55,000–$120,000/year",
        "companies_bd": ["Dutch-Bangla Bank", "BRAC Bank", "Islami Bank", "City Bank", "bKash"],
        "companies_global": ["JP Morgan", "HSBC", "Citi", "Standard Chartered"],
        "how_to_get_in": "Strong GPA matters here. Get CFA Level 1 or ACCA for an edge. Banks post jobs on their websites and BDjobs.com. Written exam + viva is the usual process.",
        "learn_from": "CFA Institute, ACCA, Investopedia, CFI (Corporate Finance Institute)"
    },
    {
        "title": "Cybersecurity Analyst",
        "fields": ["cse", "computer", "software", "networking", "it"],
        "skills_needed": ["Networking", "Linux", "Python", "Ethical Hacking", "SIEM tools"],
        "salary_bd": "35,000–75,000 BDT/month",
        "salary_global": "$80,000–$140,000/year",
        "companies_bd": ["Grameenphone", "bKash", "BJIT", "government CIRT", "Banks"],
        "companies_global": ["IBM", "Palo Alto Networks", "CrowdStrike", "Accenture"],
        "how_to_get_in": "Get CompTIA Security+ or CEH certification. Practice on TryHackMe or HackTheBox. Build a home lab.",
        "learn_from": "TryHackMe (free tier), Professor Messer (YouTube), CompTIA Security+"
    },
    {
        "title": "Graphic Designer / UI-UX Designer",
        "fields": ["fine arts", "design", "cse", "architecture", "any"],
        "skills_needed": ["Figma", "Adobe XD", "Photoshop", "User Research", "Prototyping"],
        "salary_bd": "20,000–55,000 BDT/month",
        "salary_global": "$55,000–$110,000/year",
        "companies_bd": ["Shajgoj", "Pathao", "Chaldal", "agencies", "freelance"],
        "companies_global": ["Toptal", "Upwork", "Fiverr", "Remote design studios"],
        "how_to_get_in": "Build a Behance/Dribbble portfolio. Do 3-5 real or redesign projects. Figma is the #1 tool — master it first.",
        "learn_from": "Figma YouTube channel, Google UX Design Certificate (Coursera), Behance for inspiration"
    }
]

# ─── COMPANY GUIDES ──────────────────────────────────────────────────────────

COMPANY_GUIDES = {
    "BAT Bangladesh": {
        "type": "local",
        "what_they_look_for": "Strong academics (3.5+ CGPA), leadership in extracurriculars, excellent English, resilience under pressure.",
        "hiring_process": "Online application → Aptitude Test (SHL) → Group Exercise → Panel Interview → Final HR Interview.",
        "tips": "Apply in Oct–Jan. Prepare for case discussions. Visit BAT's website for their Global Graduate program.",
        "careers_link": "careers.bat.com"
    },
    "Unilever Bangladesh": {
        "type": "local",
        "what_they_look_for": "Problem solvers, analytical thinkers, strong communicators. Both STEM and business graduates.",
        "hiring_process": "Online application → Digital Interview (HireVue) → Discovery Centre (Assessment Day) → Offer.",
        "tips": "Research Unilever's brands and sustainability goals. Practice HireVue video interviews. Show passion for FMCG.",
        "careers_link": "unilever.com/careers"
    },
    "Grameenphone": {
        "type": "local",
        "what_they_look_for": "Tech-savvy graduates, strong analytical skills, teamwork, and digital mindset.",
        "hiring_process": "Application on GP website → Written Test → Interview rounds → HR Final.",
        "tips": "Follow GP on LinkedIn for job postings. Their GP Accelerate program is great for fresh grads.",
        "careers_link": "grameenphone.com/careers"
    },
    "bKash": {
        "type": "local",
        "what_they_look_for": "Fintech interest, data-driven thinking, strong problem solving.",
        "hiring_process": "Application → Technical/Aptitude Test → Interviews.",
        "tips": "Understand mobile financial services deeply. Know bKash's products and business model.",
        "careers_link": "bkash.com/careers"
    },
    "BRAC": {
        "type": "local",
        "what_they_look_for": "Social mission alignment, fieldwork readiness, communication, and leadership.",
        "hiring_process": "Application on BRAC website → Written exam → Interview.",
        "tips": "BRAC values development sector passion. Volunteering experience is a big plus.",
        "careers_link": "brac.net/careers"
    },
    "Google": {
        "type": "global",
        "what_they_look_for": "Strong CS fundamentals, problem solving (DSA/algorithms), Googleyness (collaboration, growth mindset).",
        "hiring_process": "Application/Referral → Recruiter Screen → 4–6 Technical Interviews (LeetCode style) → Hiring Committee → Offer.",
        "tips": "Solve 150+ LeetCode problems. Practice system design. A referral from a Google employee increases your chances dramatically.",
        "careers_link": "careers.google.com"
    },
    "Amazon": {
        "type": "global",
        "what_they_look_for": "Leadership Principles alignment (16 LPs), strong ownership mindset, technical depth.",
        "hiring_process": "Application → OA (Online Assessment, 2 coding problems) → Virtual Onsite (4 interviews: coding + behavioral) → Offer.",
        "tips": "Memorize Amazon's 16 Leadership Principles. Use the STAR method for behavioral questions. Practice on LeetCode.",
        "careers_link": "amazon.jobs"
    },
    "Meta": {
        "type": "global",
        "what_they_look_for": "Strong coding skills, systems thinking, move fast culture fit.",
        "hiring_process": "Application → Recruiter Call → 2 Technical Phone Screens → Virtual Onsite (coding + system design + behavioral) → Offer.",
        "tips": "Focus on graph problems and dynamic programming on LeetCode. System design is critical for SDE-2+.",
        "careers_link": "metacareers.com"
    },
    "Microsoft": {
        "type": "global",
        "what_they_look_for": "Growth mindset, coding ability, collaboration, product sense.",
        "hiring_process": "Application → Recruiter Screen → Technical Phone Interview → 4–5 Virtual Onsite Interviews → Offer.",
        "tips": "Microsoft values culture fit heavily. Practice both coding and behavioral. Their Explore/LEAP programs are great for fresh grads.",
        "careers_link": "careers.microsoft.com"
    }
}

# ─── ANALYSIS LOGIC ──────────────────────────────────────────────────────────


def analyze_profile(data):
    education = data.get("education", "").lower()
    skills = data.get("skills", "").lower()
    interests = data.get("interests", "").lower()
    cgpa_str = data.get("cgpa", "0")
    experience = data.get("experience", "").lower()

    try:
        cgpa = float(cgpa_str.split("/")[0].strip()) if cgpa_str else 0
    except:
        cgpa = 0

    # Match jobs
    matched_jobs = []
    for job in JOBS:
        score = 0
        for field in job["fields"]:
            if field in education or field == "any":
                score += 2
        for skill in job["skills_needed"]:
            if skill.lower() in skills:
                score += 1
        if any(interest in interests for interest in job["title"].lower().split()):
            score += 2
        matched_jobs.append((score, job))

    matched_jobs.sort(key=lambda x: x[0], reverse=True)
    top_jobs = [j for _, j in matched_jobs[:4]]

    # Strengths
    strengths = []
    if cgpa >= 3.5:
        strengths.append(
            f"Excellent academic record (CGPA {cgpa}) — highly valued by top companies")
    elif cgpa >= 3.0:
        strengths.append(f"Solid academic record (CGPA {cgpa})")
    if experience:
        strengths.append(
            "Has prior experience or internship — a big advantage over fresh graduates")
    if "python" in skills:
        strengths.append(
            "Python skills — one of the most in-demand skills globally right now")
    if "excel" in skills:
        strengths.append("Excel proficiency — valued in almost every industry")
    if "communication" in skills or "english" in skills:
        strengths.append(
            "Strong communication skills — key for MT programs and client-facing roles")
    if len(strengths) < 3:
        strengths.append(
            "Motivated fresh graduate with a clear academic background")
        strengths.append(
            "Early career stage — perfect time to build targeted skills quickly")

    # Weaknesses / Gaps
    gaps = []
    all_needed = set()
    for job in top_jobs:
        for s in job["skills_needed"]:
            all_needed.add(s.lower())
    missing = [s for s in all_needed if s.lower() not in skills][:5]
    for m in missing:
        gaps.append(f"Missing skill: {m} — required for your target roles")
    if not experience:
        gaps.append(
            "No work experience yet — internships and projects are crucial to stand out")
    if cgpa < 3.0 and cgpa > 0:
        gaps.append(
            "CGPA below 3.0 — some companies have a minimum cutoff; compensate with strong skills")

    return {
        "strengths": strengths,
        "gaps": gaps,
        "top_jobs": top_jobs,
        "company_guides": COMPANY_GUIDES
    }

# ─── ROUTES ──────────────────────────────────────────────────────────────────


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    result = analyze_profile(data)
    return jsonify(result)


@app.route("/build-cv", methods=["POST"])
def build_cv():
    data = request.json
    return jsonify({"cv_data": data})


if __name__ == "__main__":
    app.run(debug=True)
